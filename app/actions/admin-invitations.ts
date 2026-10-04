"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedAdminIdentity } from "@/lib/admin/auth";
import { recordAdminAudit } from "@/lib/admin/audit";
import { generateInvitationToken, hashInvitationToken } from "@/lib/invitations/token";
import { normalizeName } from "@/lib/invitations/lookup-normalize";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Locale } from "@/lib/wedding-config";

export interface CreateInvitationResult {
  success: boolean;
  error?: string;
  url?: string;
  id?: string;
}

export async function createInvitationAction(formData: FormData): Promise<CreateInvitationResult> {
  const actor = await getAuthenticatedAdminIdentity();
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
  if (plusOneAllowed && maxGuests < 2) {
    maxGuests = 2; // Auto-adjust to at least 2 places if +1 is enabled
  }

  const groupName = String(formData.get("groupName") || "").trim() || null;
  const rawLang = String(formData.get("language") || "").trim();
  const language = ["en", "es", "de-AT", "hu"].includes(rawLang) ? (rawLang as Locale) : null;
  const personalMessage = String(formData.get("personalMessage") || "").trim() || null;

  const token = generateInvitationToken();
  const tokenHash = hashInvitationToken(token);
  const client = createSupabaseAdminClient();

  const { data, error } = await client
    .from("invitations")
    .insert({
      token_hash: tokenHash,
      display_name: displayName,
      normalized_name: normalizeName(displayName),
      language,
      max_guests: maxGuests,
      plus_one_allowed: plusOneAllowed,
      group_name: groupName,
      normalized_group_name: groupName ? normalizeName(groupName) : null,
      personal_message: personalMessage,
      status: "active",
    })
    .select("id, display_name")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message || "Failed to create invitation in database." };
  }

  await recordAdminAudit({
    actor,
    action: "INVITATION_CREATED",
    resourceType: "invitation",
    resourceId: data.id,
    metadata: { displayName, maxGuests, plusOneAllowed },
  });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const url = `${baseUrl}/i/${token}`;

  revalidatePath("/admin/invitations");
  revalidatePath("/admin");

  return {
    success: true,
    url,
    id: data.id,
  };
}

export async function createDemoInvitationAction(): Promise<CreateInvitationResult> {
  const tokenHash = hashInvitationToken(generateInvitationToken()); // unique hash
  const client = createSupabaseAdminClient();

  // Upsert a demo invitation with id "00000000-0000-0000-0000-000000000001"
  const demoId = "00000000-0000-0000-0000-000000000001";
  await client.from("invitations").upsert({
    id: demoId,
    token_hash: tokenHash,
    display_name: "Sarah & Guest (Demo)",
    normalized_name: "sarah guest demo",
    language: "en",
    max_guests: 2,
    plus_one_allowed: true,
    group_name: "Demo Reviewers",
    status: "active",
    personal_message: "We are thrilled to celebrate our special day with you in Vienna!",
  });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    success: true,
    url: `${baseUrl}/i/${demoId}`,
    id: demoId,
  };
}
