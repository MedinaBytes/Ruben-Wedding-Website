"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedAdminIdentity } from "@/lib/admin/auth";
import { recordAdminAudit } from "@/lib/admin/audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function updateSiteSettings(formData: FormData) {
  const actor = await getAuthenticatedAdminIdentity();
  if (!actor) throw new Error("Unauthorized");

  const showGiftDetails = formData.get("showGiftDetails") === "on";
  const showPrivateAddress = formData.get("showPrivateAddress") === "on";
  const spotifyPlaylistUrl = String(formData.get("spotifyPlaylistUrl") || "").trim();
  const contactPhone = String(formData.get("contactPhone") || "").trim();
  const contactEmail = String(formData.get("contactEmail") || "").trim();

  const client = createSupabaseAdminClient();
  const now = new Date().toISOString();

  await client.from("site_settings").upsert([
    { key: "showGiftDetails", value: showGiftDetails, updated_at: now },
    { key: "showPrivateAddress", value: showPrivateAddress, updated_at: now },
    { key: "spotifyPlaylistUrl", value: spotifyPlaylistUrl, updated_at: now },
    { key: "contactPhone", value: contactPhone, updated_at: now },
    { key: "contactEmail", value: contactEmail, updated_at: now },
  ]);

  await recordAdminAudit({
    actor,
    action: "SITE_SETTINGS_UPDATED",
    resourceType: "site_settings",
    metadata: { showGiftDetails, showPrivateAddress },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/");
}
