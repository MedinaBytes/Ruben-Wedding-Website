"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedAdminIdentity } from "@/lib/admin/auth";
import { recordAdminAudit } from "@/lib/admin/audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function updateSiteSettings(formData: FormData) {
  const actor = await getAuthenticatedAdminIdentity();
  if (!actor) throw new Error("Unauthorized");

  // Gift & Bank Settings
  const showGiftDetails = formData.get("showGiftDetails") === "on";
  const bankName = String(formData.get("bankName") || "").trim();
  const accountHolder = String(formData.get("accountHolder") || "").trim();
  const iban = String(formData.get("iban") || "").trim();
  const bic = String(formData.get("bic") || "").trim();
  const giftNote = String(formData.get("giftNote") || "").trim();

  // Private Address Settings
  const showPrivateAddress = formData.get("showPrivateAddress") === "on";
  const privateStreet = String(formData.get("privateStreet") || "").trim();
  const privateCity = String(formData.get("privateCity") || "").trim();
  const privateAccessNotes = String(formData.get("privateAccessNotes") || "").trim();

  // SMTP Settings
  const smtpHost = String(formData.get("smtpHost") || "").trim();
  const smtpPort = String(formData.get("smtpPort") || "587").trim();
  const smtpSecure = formData.get("smtpSecure") === "on";
  const smtpUser = String(formData.get("smtpUser") || "").trim();
  const smtpPass = String(formData.get("smtpPass") || "").trim();
  const smtpSenderEmail = String(formData.get("smtpSenderEmail") || "").trim();
  const smtpSenderName = String(formData.get("smtpSenderName") || "").trim();

  // WhatsApp Dispatch Settings
  const whatsappTemplate = String(formData.get("whatsappTemplate") || "").trim();
  const whatsappDelaySeconds = parseInt(String(formData.get("whatsappDelaySeconds") || "8"), 10) || 8;

  // Spotify & General Contact
  const spotifyPlaylistUrl = String(formData.get("spotifyPlaylistUrl") || "").trim();
  const contactPhone = String(formData.get("contactPhone") || "").trim();
  const contactEmail = String(formData.get("contactEmail") || "").trim();

  const client = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const rows = [
    // Gifts
    { key: "showGiftDetails", value: showGiftDetails, updated_at: now },
    { key: "bankName", value: bankName, updated_at: now },
    { key: "accountHolder", value: accountHolder, updated_at: now },
    { key: "iban", value: iban, updated_at: now },
    { key: "bic", value: bic, updated_at: now },
    { key: "giftNote", value: giftNote, updated_at: now },

    // Address
    { key: "showPrivateAddress", value: showPrivateAddress, updated_at: now },
    { key: "privateStreet", value: privateStreet, updated_at: now },
    { key: "privateCity", value: privateCity, updated_at: now },
    { key: "privateAccessNotes", value: privateAccessNotes, updated_at: now },

    // SMTP
    { key: "smtpHost", value: smtpHost, updated_at: now },
    { key: "smtpPort", value: smtpPort, updated_at: now },
    { key: "smtpSecure", value: smtpSecure, updated_at: now },
    { key: "smtpUser", value: smtpUser, updated_at: now },
    { key: "smtpPass", value: smtpPass, updated_at: now },
    { key: "smtpSenderEmail", value: smtpSenderEmail, updated_at: now },
    { key: "smtpSenderName", value: smtpSenderName, updated_at: now },

    // WhatsApp
    { key: "whatsappTemplate", value: whatsappTemplate, updated_at: now },
    { key: "whatsappDelaySeconds", value: whatsappDelaySeconds, updated_at: now },

    // General
    { key: "spotifyPlaylistUrl", value: spotifyPlaylistUrl, updated_at: now },
    { key: "contactPhone", value: contactPhone, updated_at: now },
    { key: "contactEmail", value: contactEmail, updated_at: now },
  ];

  await client.from("site_settings").upsert(rows);

  await recordAdminAudit({
    actor,
    action: "INVITATION_UPDATED",
    resourceType: "invitation",
    metadata: { showGiftDetails, showPrivateAddress, smtpConfigured: Boolean(smtpHost && smtpUser) },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/");
}
