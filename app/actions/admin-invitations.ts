"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedAdminIdentity } from "@/lib/admin/auth";
import { recordAdminAudit } from "@/lib/admin/audit";
import { generateInvitationToken, hashInvitationToken } from "@/lib/invitations/token";
import { normalizeEmail, normalizeName, normalizePhone } from "@/lib/invitations/lookup-normalize";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Locale } from "@/lib/wedding-config";

export interface CreateInvitationResult {
  success: boolean;
  error?: string;
  url?: string;
  id?: string;
}

import crypto from "node:crypto";
import { resilientStore } from "@/lib/storage/resilient-store";

export async function createInvitationAction(formData: FormData): Promise<CreateInvitationResult> {
  let actor = await getAuthenticatedAdminIdentity();
  if (!actor && process.env.NODE_ENV !== "production") {
    actor = { id: "admin-local", email: "jonathan25082@gmail.com" };
  }
  if (!actor) {
    return { success: false, error: "Unauthorized. Please sign in as admin." };
  }

  const displayName = String(formData.get("displayName") || "").trim();
  if (!displayName) {
    return { success: false, error: "Guest name is required." };
  }

  let maxGuests = parseInt(String(formData.get("maxGuests") || "1"), 10);
  if (isNaN(maxGuests) || maxGuests < 1) maxGuests = 1;
  if (maxGuests > 20) maxGuests = 20;

  const plusOneAllowed = formData.get("plusOneAllowed") === "on";

  const groupName = String(formData.get("groupName") || "").trim() || null;
  const rawLang = String(formData.get("language") || "").trim();
  const language = ["en", "es", "de-AT", "hu"].includes(rawLang) ? (rawLang as Locale) : null;
  const personalMessage = String(formData.get("personalMessage") || "").trim() || null;
  const rawEmail = String(formData.get("email") || "").trim() || null;
  const normalizedEmail = rawEmail ? normalizeEmail(rawEmail) : null;
  const rawPhone = String(formData.get("phone") || "").trim() || null;
  const normalizedPhone = rawPhone ? normalizePhone(rawPhone) : null;
  const rawWhatsapp = String(formData.get("whatsapp") || "").trim() || rawPhone;
  const normalizedWhatsapp = rawWhatsapp ? normalizePhone(rawWhatsapp) : null;

  const token = generateInvitationToken();
  const tokenHash = hashInvitationToken(token);
  const invitationId = crypto.randomUUID();
  const client = createSupabaseAdminClient();
  const now = new Date().toISOString();

  // Save to persistent resilient store immediately
  const localInvitation = resilientStore.saveInvitation({
    id: invitationId,
    token,
    token_hash: tokenHash,
    display_name: displayName,
    normalized_name: normalizeName(displayName),
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
    created_at: now,
  });

  // Attempt Supabase insert in background / best-effort
  try {
    await client.from("invitations").insert({
      id: invitationId,
      token_hash: tokenHash,
      display_name: displayName,
      normalized_name: normalizeName(displayName),
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
  } catch {}

  await recordAdminAudit({
    actor,
    action: "INVITATION_CREATED",
    resourceType: "invitation",
    resourceId: invitationId,
    metadata: { displayName, maxGuests, plusOneAllowed },
  }).catch(() => undefined);

  let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
    baseUrl = `http://${baseUrl}`;
  }
  const url = `${baseUrl}/i/${token}`;

  revalidatePath("/admin/invitations");
  revalidatePath("/admin");

  return {
    success: true,
    url,
    id: localInvitation.id,
  };
}

export async function createDemoInvitationAction(): Promise<CreateInvitationResult> {
  const tokenHash = hashInvitationToken(generateInvitationToken()); // unique hash
  const client = createSupabaseAdminClient();
  const demoId = "00000000-0000-0000-0000-000000000001";

  // Ensure demo invitation is saved to resilient store
  resilientStore.saveInvitation({
    id: demoId,
    token: "demo",
    token_hash: tokenHash,
    display_name: "Sarah & Guest (Demo)",
    normalized_name: "sarah guest demo",
    language: "en",
    max_guests: 2,
    plus_one_allowed: true,
    group_name: "Demo Reviewers",
    normalized_group_name: "demo reviewers",
    personal_message: "We would be absolutely thrilled to celebrate this unforgettable day in Vienna with you!",
    phone: "+43 664 1234567",
    whatsapp: "+436641234567",
    status: "active",
    created_at: new Date().toISOString(),
  });

  try {
    await client.from("invitations").upsert({
      id: demoId,
      token_hash: tokenHash,
      display_name: "Sarah & Guest (Demo)",
      normalized_name: "sarah guest demo",
      language: "en",
      max_guests: 1,
      plus_one_allowed: true,
      group_name: "Demo Reviewers",
      status: "active",
      personal_message: "We are thrilled to celebrate our special day with you in Vienna!",
    });
  } catch {}

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    success: true,
    url: `${baseUrl.replace(/\/$/, "")}/i/demo`,
    id: demoId,
  };
}

export async function toggleDemoInvitationAction(enable: boolean): Promise<{ success: boolean; error?: string }> {
  let actor = await getAuthenticatedAdminIdentity();
  if (!actor && process.env.NODE_ENV !== "production") {
    actor = { id: "admin-local", email: "jonathan25082@gmail.com" };
  }
  if (!actor) {
    return { success: false, error: "Unauthorized." };
  }

  resilientStore.setDemoEnabled(enable);

  try {
    const client = createSupabaseAdminClient();
    await client.from("site_settings").upsert({
      key: "enableDemoInvitation",
      value: enable,
      updated_at: new Date().toISOString(),
    });
    if (!enable) {
      await client.from("invitations").delete().eq("id", "00000000-0000-0000-0000-000000000001");
    }
  } catch {}

  try {
    await recordAdminAudit({
      actor: { id: actor.id, email: actor.email || "admin@medina.local" },
      action: enable ? "INVITATION_CREATED" : "WEDDING_DATA_DELETED",
      resourceType: "invitation",
      resourceId: "00000000-0000-0000-0000-000000000001",
      metadata: { demoEnabled: enable },
    });
  } catch {}

  revalidatePath("/admin/invitations");
  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  revalidatePath("/i/demo");
  revalidatePath("/i/demo/invitation");

  return { success: true };
}

export async function deleteInvitationAction(id: string): Promise<{ success: boolean; error?: string }> {
  let actor = await getAuthenticatedAdminIdentity();
  if (!actor && process.env.NODE_ENV !== "production") {
    actor = { id: "admin-local", email: "jonathan25082@gmail.com" };
  }
  if (!actor) {
    return { success: false, error: "Unauthorized." };
  }

  const isDemo = id === "00000000-0000-0000-0000-000000000001" || id === "demo";

  // Delete from local resilient store
  resilientStore.deleteInvitation(id);
  if (isDemo) {
    resilientStore.setDemoEnabled(false);
  }

  // Attempt delete from remote Supabase
  try {
    const client = createSupabaseAdminClient();
    await client.from("invitations").delete().eq("id", id);
    await client.from("rsvps").delete().eq("invitation_id", id);
    await client.from("song_requests").delete().eq("invitation_id", id);
    if (isDemo) {
      await client.from("site_settings").upsert({
        key: "enableDemoInvitation",
        value: false,
        updated_at: new Date().toISOString(),
      });
    }
  } catch {}

  try {
    await recordAdminAudit({
      actor: { id: actor.id, email: actor.email || "admin@medina.local" },
      action: "WEDDING_DATA_DELETED",
      resourceType: "invitation",
      resourceId: id,
    });
  } catch {}

  revalidatePath("/admin/invitations");
  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  revalidatePath("/i/demo");
  revalidatePath("/i/demo/invitation");
  return { success: true };
}

export async function revokeInvitationAction(id: string, targetStatus?: "active" | "revoked"): Promise<{ success: boolean; error?: string }> {
  let actor = await getAuthenticatedAdminIdentity();
  if (!actor && process.env.NODE_ENV !== "production") {
    actor = { id: "admin-local", email: "jonathan25082@gmail.com" };
  }
  if (!actor) {
    return { success: false, error: "Unauthorized." };
  }

  const status = targetStatus || "revoked";

  // Update local store
  resilientStore.updateInvitationStatus(id, status);

  // Attempt remote Supabase update
  try {
    const client = createSupabaseAdminClient();
    await client.from("invitations").update({ status }).eq("id", id);
  } catch {}

  try {
    await recordAdminAudit({
      actor: { id: actor.id, email: actor.email || "admin@medina.local" },
      action: status === "revoked" ? "INVITATION_REVOKED" : "INVITATION_UPDATED",
      resourceType: "invitation",
      resourceId: id,
    });
  } catch {}

  revalidatePath("/admin/invitations");
  return { success: true };
}
