"use server";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";

import { normalizeLookupValue } from "@/lib/invitations/lookup-normalize";
import { generateInvitationToken, hashInvitationToken } from "@/lib/invitations/token";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { supportedLocales, type Locale } from "@/lib/wedding-config";

const lookupSchema = z.object({
  identifier: z.string().trim().min(2).max(100),
  locale: z.enum(supportedLocales),
}).strict();
const invitationIdSchema = z.string().uuid();
const sessionCookieName = "guest_lookup_session";
const sessionCookieSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
const matchCookieName = "guest_lookup_match";

export type LookupResult =
  | { success: true; invitationId: string; displayName: string; greetingOverride: string | null }
  | { success: false; reason: "not_found" | "error" | "invalid" | "rate_limited" };

type LookupGrant = { invitationId: string; locale: Locale; expiresAt: number };

function rateLimitHash(secret: string, scope: string, value: string) {
  return createHmac("sha256", secret).update(`${scope}\u0000${value}`).digest("hex");
}

function signLookupGrant(grant: LookupGrant, secret: string) {
  const payload = Buffer.from(`${grant.invitationId}|${grant.locale}|${grant.expiresAt}`).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

function verifyLookupGrant(value: string, secret: string): LookupGrant | null {
  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra || !/^[a-f0-9]{64}$/.test(signature)) return null;

  const expectedSignature = createHmac("sha256", secret).update(payload).digest();
  const suppliedSignature = Buffer.from(signature, "hex");
  if (expectedSignature.length !== suppliedSignature.length || !timingSafeEqual(expectedSignature, suppliedSignature)) return null;

  const [invitationId, locale, expiresText, extraPart] = Buffer.from(payload, "base64url").toString("utf8").split("|");
  const validInvitationId = invitationIdSchema.safeParse(invitationId);
  const validLocale = z.enum(supportedLocales).safeParse(locale);
  const expiresAt = Number(expiresText);
  if (extraPart || !validInvitationId.success || !validLocale.success || !Number.isSafeInteger(expiresAt) || expiresAt <= Date.now()) {
    return null;
  }

  return { invitationId, locale: validLocale.data, expiresAt };
}

async function queryActiveInvitations(
  client: ReturnType<typeof createSupabaseAdminClient>,
  column: "normalized_name" | "normalized_group_name" | "normalized_email" | "normalized_phone" | "normalized_whatsapp",
  value: string,
) {
  const { data, error } = await client
    .from("invitations")
    .select("id, display_name, greeting_override")
    .eq("status", "active")
    .eq(column, value)
    .limit(2);

  if (error) throw new Error("Invitation lookup failed.");
  return data ?? [];
}

async function consumeLookupLimit(
  client: ReturnType<typeof createSupabaseAdminClient>,
  scope: "session" | "identifier",
  keyHash: string,
  limit: number,
) {
  const { data, error } = await client.rpc("consume_guest_lookup_rate_limit", {
    p_key_type: scope,
    p_key_hash: keyHash,
    p_limit: limit,
    p_window_seconds: 900,
  });

  if (error) throw new Error("Guest lookup rate limit failed.");
  return data === true;
}

export async function lookupInvitation(identifier: string, locale: string): Promise<LookupResult> {
  const parsed = lookupSchema.safeParse({ identifier, locale });
  if (!parsed.success) {
    return { success: false, reason: "invalid" };
  }

  try {
    const client = createSupabaseAdminClient();
    const normalized = normalizeLookupValue(parsed.data.identifier);
    if (!normalized) return { success: false, reason: "invalid" };

    const cookieStore = await cookies();
    let sessionNonce = cookieStore.get(sessionCookieName)?.value;
    if (!sessionCookieSchema.safeParse(sessionNonce).success) {
      sessionNonce = randomBytes(32).toString("base64url");
      cookieStore.set(sessionCookieName, sessionNonce, {
        httpOnly: true,
        maxAge: 60 * 60 * 24,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production" && process.env.VERCEL === "1",
      });
    }
    const validatedSessionNonce = sessionCookieSchema.parse(sessionNonce);

    const rateLimitSecret = process.env.LOOKUP_RATE_LIMIT_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!rateLimitSecret) return { success: false, reason: "error" };

    const [sessionAllowed, identifierAllowed] = await Promise.all([
      consumeLookupLimit(client, "session", rateLimitHash(rateLimitSecret, "session", validatedSessionNonce), 8),
      consumeLookupLimit(client, "identifier", rateLimitHash(rateLimitSecret, normalized.kind, normalized.value), 6),
    ]);
    if (!sessionAllowed || !identifierAllowed) return { success: false, reason: "rate_limited" };

    const columns = normalized.kind === "name"
      ? ["normalized_name", "normalized_group_name"] as const
      : normalized.kind === "email"
        ? ["normalized_email"] as const
        : ["normalized_phone", "normalized_whatsapp"] as const;
    const queryResults = await Promise.all(
      columns.map((column) => queryActiveInvitations(client, column, normalized.value)),
    );
    const candidates = new Map<string, { id: string; display_name: string; greeting_override: string | null }>();
    let queryWasAmbiguous = false;

    for (const results of queryResults) {
      if (results.length > 1) queryWasAmbiguous = true;
      for (const invitation of results) candidates.set(invitation.id, invitation);
    }

    if (queryWasAmbiguous || candidates.size !== 1) {
      return { success: false, reason: "not_found" };
    }

    const invitation = candidates.values().next().value;
    if (!invitation) return { success: false, reason: "not_found" };

    const locale = parsed.data.locale as Locale;
    const grant: LookupGrant = { invitationId: invitation.id, locale, expiresAt: Date.now() + 5 * 60 * 1000 };
    cookieStore.set(matchCookieName, signLookupGrant(grant, rateLimitSecret), {
      httpOnly: true,
      maxAge: 5 * 60,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production" && process.env.VERCEL === "1",
    });
    cookieStore.set(`wedding_manual_locale_${invitation.id}`, locale, {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 183,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production" && process.env.VERCEL === "1",
    });

    return {
      success: true,
      invitationId: invitation.id,
      displayName: invitation.display_name,
      greetingOverride: invitation.greeting_override,
    };
  } catch {
    return { success: false, reason: "error" };
  }
}

export type InvitationUrlResult =
  | { success: true; url: string }
  | { success: false; reason: "not_found" | "error" };

export async function issueInvitationUrl(): Promise<InvitationUrlResult> {
  try {
    const cookieStore = await cookies();
    const rateLimitSecret = process.env.LOOKUP_RATE_LIMIT_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    const cookieValue = cookieStore.get(matchCookieName)?.value;
    if (!rateLimitSecret || !cookieValue) return { success: false, reason: "not_found" };

    const grant = verifyLookupGrant(cookieValue, rateLimitSecret);
    if (!grant) {
      cookieStore.delete(matchCookieName);
      return { success: false, reason: "not_found" };
    }

    const client = createSupabaseAdminClient();
    const { data: invitation, error: invitationError } = await client
      .from("invitations")
      .select("id")
      .eq("id", grant.invitationId)
      .eq("status", "active")
      .maybeSingle();
    if (invitationError) return { success: false, reason: "error" };
    if (!invitation) {
      cookieStore.delete(matchCookieName);
      return { success: false, reason: "not_found" };
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const token = generateInvitationToken();
      const { error } = await client.from("invitation_token_aliases").insert({
        token_hash: hashInvitationToken(token),
        invitation_id: invitation.id,
      });
      if (!error) {
        cookieStore.delete(matchCookieName);
        return { success: true, url: `/i/${token}` };
      }
      if (error.code !== "23505") return { success: false, reason: "error" };
    }

    return { success: false, reason: "error" };
  } catch {
    return { success: false, reason: "error" };
  }
}
