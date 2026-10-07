import { NextResponse } from "next/server";
import crypto from "node:crypto";

import { recordAdminAudit } from "@/lib/admin/audit";
import { getAuthenticatedAdminIdentity } from "@/lib/admin/auth";
import { normalizeEmail, normalizeName, normalizePhone } from "@/lib/invitations/lookup-normalize";
import { generateInvitationToken, hashInvitationToken } from "@/lib/invitations/token";
import { isSameOriginMutation } from "@/lib/security/request";
import { resilientStore } from "@/lib/storage/resilient-store";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveLocale, type Locale } from "@/lib/wedding-config";
import { getInvitationEmailSubject } from "@/app/actions/admin-email";
import { buildEnvelopeInvitationHtml } from "@/lib/email/template";

interface ImportRow {
  displayName: string;
  language?: string;
  maxGuests?: number | string;
  plusOneAllowed?: boolean | string;
  groupName?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  personalMessage?: string;
}

const defaultWhatsAppTemplates: Record<string, string> = {
  en: "Dear {name},\n\nRuben & Andrea cordially invite you to celebrate their wedding on October 2, 2027 in Vienna!\n\nPlease open your personalized digital invitation here:\n{url}",
  es: "¡Hola {name}!\n\nRuben y Andrea te invitan cordialmente a celebrar su boda el 2 de octubre de 2027 en Viena.\n\nPor favor abre tu invitación digital personalizada aquí:\n{url}",
  "de-AT": "Liebe/r {name},\n\nRuben & Andrea laden dich herzlich ein, ihre Hochzeit am 2. Oktober 2027 in Wien zu feiern!\n\nBitte öffne deine persönliche digitale Einladung hier:\n{url}",
  hu: "Kedves {name}!\n\nRuben és Andrea szeretettel meghívnak, hogy ünnepeld velük az esküvőjüket 2027. október 2-án Bécsben!\n\nKérjük, nyisd meg a személyre szóló digitális meghívódat itt:\n{url}",
};

export async function POST(request: Request) {
  let actor = await getAuthenticatedAdminIdentity();
  if (!actor && process.env.NODE_ENV !== "production") {
    actor = { id: "admin-local", email: "jonathan25082@gmail.com" };
  }
  if (!actor) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const payload = body as { rows?: unknown; invitations?: unknown };
  const rawRows = Array.isArray(payload.rows) ? payload.rows : Array.isArray(payload.invitations) ? payload.invitations : null;

  if (!rawRows) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 422 });
  }

  const rows = rawRows as ImportRow[];
  if (rows.length === 0) {
    return NextResponse.json({ error: "empty_rows" }, { status: 422 });
  }

  const client = createSupabaseAdminClient();
  const created: Array<{
    id: string;
    displayName: string;
    url: string;
    language: string;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    whatsappMessage: string;
    emailSubject: string;
    emailBody: string;
  }> = [];
  const errors: Array<{ row: number; displayName: string; message: string }> = [];

  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const origin = host && !host.includes("localhost") && !host.includes("127.0.0.1")
    ? `${proto}://${host}`
    : (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")
        ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
        : "https://theandyrubenwedding.website");

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawName = String(row.displayName || "").trim();
    if (!rawName) {
      errors.push({ row: i + 1, displayName: "", message: "Missing display name" });
      continue;
    }

    const token = generateInvitationToken();
    const tokenHash = hashInvitationToken(token);
    const maxGuests = Math.min(20, Math.max(1, Number(row.maxGuests) || 1));
    const plusOneAllowed = typeof row.plusOneAllowed === "boolean"
      ? row.plusOneAllowed
      : String(row.plusOneAllowed || "").toLowerCase() === "true" || String(row.plusOneAllowed || "") === "1";

    const groupName = row.groupName?.trim() || null;
    const resolvedLang = resolveLocale(row.language);
    const language: Locale | null = resolvedLang ?? null;
    const templateLang = language || "en";

    // Contact info & normalization
    const rawEmail = row.email ? String(row.email).trim() : null;
    const normalizedEmail = rawEmail ? normalizeEmail(rawEmail) : null;

    const rawPhone = row.phone ? String(row.phone).trim() : null;
    const normalizedPhone = rawPhone ? normalizePhone(rawPhone) : null;

    const rawWhatsapp = (row.whatsapp || row.phone) ? String(row.whatsapp || row.phone).trim() : null;
    const normalizedWhatsapp = rawWhatsapp ? normalizePhone(rawWhatsapp) : null;

    const personalMessage = row.personalMessage ? String(row.personalMessage).trim() : null;
    const id = crypto.randomUUID();

    const guestUrl = `${origin}/i/${token}${language ? `?lang=${language}` : ""}`;
    const waTemplate = defaultWhatsAppTemplates[templateLang] || defaultWhatsAppTemplates.en;
    const whatsappMessage = waTemplate.replace(/\{name\}/g, rawName).replace(/\{url\}/g, guestUrl);
    const emailSubject = getInvitationEmailSubject(templateLang, rawName);
    const emailBody = buildEnvelopeInvitationHtml({
      guestName: rawName,
      invitationUrl: guestUrl,
      language: templateLang,
      maxGuests,
      plusOneAllowed,
      siteUrl: origin,
      personalMessage,
    });

    // 1. Persist immediately in resilient store
    resilientStore.saveInvitation({
      id,
      token,
      token_hash: tokenHash,
      display_name: rawName,
      normalized_name: normalizeName(rawName),
      language,
      max_guests: maxGuests,
      plus_one_allowed: plusOneAllowed,
      group_name: groupName,
      normalized_group_name: groupName ? normalizeName(groupName) : null,
      personal_message: personalMessage,
      email: rawEmail,
      normalized_email: normalizedEmail,
      phone: rawPhone,
      normalized_phone: normalizedPhone,
      whatsapp: rawWhatsapp,
      normalized_whatsapp: normalizedWhatsapp,
      status: "active",
      created_at: new Date().toISOString(),
    });

    // 2. Persist in remote Supabase
    try {
      const { error: insertError } = await client.from("invitations").upsert({
        id,
        token,
        token_hash: tokenHash,
        display_name: rawName,
        normalized_name: normalizeName(rawName),
        language,
        max_guests: maxGuests,
        plus_one_allowed: plusOneAllowed,
        group_name: groupName,
        normalized_group_name: groupName ? normalizeName(groupName) : null,
        personal_message: personalMessage,
        email: rawEmail,
        normalized_email: normalizedEmail,
        phone: rawPhone,
        normalized_phone: normalizedPhone,
        whatsapp: rawWhatsapp,
        normalized_whatsapp: normalizedWhatsapp,
        status: "active",
      });

      if (insertError) {
        console.error("[BulkImport] Supabase upsert error for", rawName, insertError);
      }
    } catch (err) {
      console.error("[BulkImport] Supabase network/client exception:", err);
    }

    created.push({
      id,
      displayName: rawName,
      url: guestUrl,
      language: templateLang,
      email: rawEmail,
      phone: rawPhone,
      whatsapp: rawWhatsapp,
      whatsappMessage,
      emailSubject,
      emailBody,
    });
  }

  if (created.length > 0) {
    await recordAdminAudit({
      actor,
      action: "INVITATION_CREATED",
      resourceType: "invitation",
      metadata: { importedCount: created.length, failedCount: errors.length },
    }).catch(() => undefined);
  }

  return NextResponse.json({
    success: true,
    imported: created.length,
    failed: errors.length,
    created,
    errors,
  });
}
