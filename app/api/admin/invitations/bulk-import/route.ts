import { NextResponse } from "next/server";
import { recordAdminAudit } from "@/lib/admin/audit";
import { getAuthenticatedAdminIdentity } from "@/lib/admin/auth";
import { generateInvitationToken, hashInvitationToken } from "@/lib/invitations/token";
import { normalizeName } from "@/lib/invitations/lookup-normalize";
import { isSameOriginMutation } from "@/lib/security/request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Locale } from "@/lib/wedding-config";

import crypto from "node:crypto";
import { resilientStore } from "@/lib/storage/resilient-store";

interface ImportRow {
  displayName: string;
  language?: Locale;
  maxGuests?: number;
  plusOneAllowed?: boolean;
  groupName?: string;
}

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

  if (typeof body !== "object" || body === null || !("rows" in body) || !Array.isArray((body as { rows: unknown }).rows)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 422 });
  }

  const rows = (body as { rows: ImportRow[] }).rows;
  if (rows.length === 0) {
    return NextResponse.json({ error: "empty_rows" }, { status: 422 });
  }

  const client = createSupabaseAdminClient();
  const created: Array<{ id: string; displayName: string; url: string }> = [];
  const errors: Array<{ row: number; displayName: string; message: string }> = [];

  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

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
    const plusOneAllowed = Boolean(row.plusOneAllowed);
    const groupName = row.groupName?.trim() || null;
    const language = ["en", "es", "de-AT", "hu"].includes(String(row.language)) ? (row.language as Locale) : null;
    const id = crypto.randomUUID();

    // Persist immediately in resilient store
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
      personal_message: null,
      status: "active",
      created_at: new Date().toISOString(),
    });

    // Best-effort remote insert
    try {
      await client.from("invitations").insert({
        id,
        token_hash: tokenHash,
        display_name: rawName,
        normalized_name: normalizeName(rawName),
        language,
        max_guests: maxGuests,
        plus_one_allowed: plusOneAllowed,
        group_name: groupName,
        normalized_group_name: groupName ? normalizeName(groupName) : null,
        status: "active",
      });
    } catch {}

    created.push({
      id,
      displayName: rawName,
      url: `${origin}/i/${token}`,
    });
  }

  if (created.length > 0) {
    await recordAdminAudit({
      actor,
      action: "INVITATION_CREATED",
      resourceType: "invitation",
      metadata: { importedCount: created.length, failedCount: errors.length },
    });
  }

  return NextResponse.json({
    success: true,
    imported: created.length,
    failed: errors.length,
    created,
    errors,
  });
}
