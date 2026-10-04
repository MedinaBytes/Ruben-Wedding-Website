import { NextResponse } from "next/server";

import { recordAdminAudit } from "@/lib/admin/audit";
import { getAuthenticatedAdminIdentity } from "@/lib/admin/auth";
import { generateInvitationToken, hashInvitationToken } from "@/lib/invitations/token";
import { normalizeEmail, normalizeName, normalizePhone } from "@/lib/invitations/lookup-normalize";
import { invalidOriginResponse, isJsonRequest, isSameOriginMutation } from "@/lib/security/request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createInvitationSchema } from "@/lib/validation/admin";

const privateHeaders = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

export async function POST(request: Request) {
  const actor = await getAuthenticatedAdminIdentity();
  if (!actor) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: privateHeaders });
  }
  if (!isSameOriginMutation(request)) return invalidOriginResponse();
  if (!isJsonRequest(request)) {
    return NextResponse.json({ error: "invalid_content_type" }, { status: 415, headers: privateHeaders });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400, headers: privateHeaders });
  }

  const payload = createInvitationSchema.safeParse(body);
  if (!payload.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 422, headers: privateHeaders });
  }

  const normalizedName = normalizeName(payload.data.displayName);
  const normalizedGroupName = payload.data.groupName ? normalizeName(payload.data.groupName) : null;
  const normalizedEmail = payload.data.email ? normalizeEmail(payload.data.email) : null;
  const normalizedPhone = payload.data.phone ? normalizePhone(payload.data.phone) : null;
  if ((payload.data.email && !normalizedEmail) || (payload.data.phone && !normalizedPhone)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 422, headers: privateHeaders });
  }

  const client = createSupabaseAdminClient();
  const { resilientStore } = await import("@/lib/storage/resilient-store");
  const crypto = await import("node:crypto");

  const token = generateInvitationToken();
  const tokenHash = hashInvitationToken(token);
  const id = crypto.randomUUID();

  // Save to resilient store
  resilientStore.saveInvitation({
    id,
    token,
    token_hash: tokenHash,
    display_name: payload.data.displayName,
    normalized_name: normalizedName,
    language: (payload.data.language as "en" | "es" | "de-AT" | "hu") ?? null,
    max_guests: payload.data.maxGuests,
    plus_one_allowed: payload.data.plusOneAllowed,
    group_name: payload.data.groupName ?? null,
    normalized_group_name: normalizedGroupName,
    personal_message: payload.data.personalMessage ?? null,
    phone: payload.data.phone ?? null,
    whatsapp: payload.data.phone ?? null,
    status: payload.data.status,
    created_at: new Date().toISOString(),
  });

  // Best-effort remote insert
  try {
    await client
      .from("invitations")
      .insert({
        id,
        token_hash: tokenHash,
        display_name: payload.data.displayName,
        normalized_name: normalizedName,
        greeting_override: payload.data.greetingOverride ?? null,
        language: payload.data.language ?? null,
        group_name: payload.data.groupName ?? null,
        normalized_group_name: normalizedGroupName,
        normalized_email: normalizedEmail,
        normalized_phone: normalizedPhone,
        max_guests: payload.data.maxGuests,
        plus_one_allowed: payload.data.plusOneAllowed,
        personal_message: payload.data.personalMessage ?? null,
        status: payload.data.status,
      });

    await recordAdminAudit({
      actor,
      action: "INVITATION_CREATED",
      resourceType: "invitation",
      resourceId: id,
      metadata: { status: payload.data.status, maxGuests: payload.data.maxGuests },
    });
  } catch {}

  const invitationUrl = new URL(`/i/${token}`, request.url).toString();
  return NextResponse.json(
    { invitation: { id, displayName: payload.data.displayName, status: payload.data.status, url: invitationUrl } },
    { status: 201, headers: privateHeaders },
  );
}
