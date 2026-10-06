"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedAdminIdentity } from "@/lib/admin/auth";
import { recordAdminAudit } from "@/lib/admin/audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function updateSiteSettings(formData: FormData) {
  let actor = await getAuthenticatedAdminIdentity();
  if (!actor && process.env.NODE_ENV !== "production") {
    actor = { id: "admin-local", email: "jonathan25082@gmail.com" };
  }
  if (!actor) throw new Error("Unauthorized");

  // Demo Invitation Setting
  const enableDemoInvitation = formData.get("enableDemoInvitation") === "on";

  // Feature Controls & Experience Modules
  const enableCalendarSync = formData.get("enableCalendarSync") === "on";
  const enableEnvelopeCalligraphy = formData.get("enableEnvelopeCalligraphy") === "on";
  const enableMealSelection = formData.get("enableMealSelection") === "on";
  const enableTravelConcierge = formData.get("enableTravelConcierge") === "on";
  const enableDayOfTimeline = formData.get("enableDayOfTimeline") === "on";
  const enableGuestbook = formData.get("enableGuestbook") === "on";
  const enableTablePlanner = formData.get("enableTablePlanner") === "on";
  const enableQrCheckin = formData.get("enableQrCheckin") === "on";
  const enableRsvpReminders = formData.get("enableRsvpReminders") === "on";

  // Gift & Payment Settings
  const showGiftDetails = formData.get("showGiftDetails") === "on";
  const enableBankTransfer = formData.get("enableBankTransfer") === "on";
  const bankName = String(formData.get("bankName") || "").trim();
  const accountHolder = String(formData.get("accountHolder") || "").trim();
  const iban = String(formData.get("iban") || "").trim();
  const bic = String(formData.get("bic") || "").trim();
  const giftNote = String(formData.get("giftNote") || "").trim();

  const enableRevolut = formData.get("enableRevolut") === "on";
  const revolutTag = String(formData.get("revolutTag") || "").trim();
  const revolutNote = String(formData.get("revolutNote") || "").trim();

  const enableWise = formData.get("enableWise") === "on";
  const wiseTag = String(formData.get("wiseTag") || "").trim();
  const wiseNote = String(formData.get("wiseNote") || "").trim();

  const enableCash = formData.get("enableCash") === "on";
  const cashNote = String(formData.get("cashNote") || "").trim();

  // Private Address Settings
  const showPrivateAddress = formData.get("showPrivateAddress") === "on";
  const privateStreet = String(formData.get("privateStreet") || "").trim();
  const privateCity = String(formData.get("privateCity") || "").trim();
  const privateAccessNotes = String(formData.get("privateAccessNotes") || "").trim();

  // Resend API Settings
  const resendApiKey = String(formData.get("resendApiKey") || "").trim();
  const resendFromEmail = String(formData.get("resendFromEmail") || "").trim();
  const resendFromName = String(formData.get("resendFromName") || "").trim();

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
  const whatsappCloudToken = String(formData.get("whatsappCloudToken") || "").trim();
  const whatsappPhoneNumberId = String(formData.get("whatsappPhoneNumberId") || "").trim();
  const whatsappGatewayUrl = String(formData.get("whatsappGatewayUrl") || "").trim();
  const whatsappGatewayKey = String(formData.get("whatsappGatewayKey") || "").trim();

  // Spotify & General Contact
  const spotifyPlaylistUrl = String(formData.get("spotifyPlaylistUrl") || "").trim();
  const contactPhone = String(formData.get("contactPhone") || "").trim();
  const contactEmail = String(formData.get("contactEmail") || "").trim();

  const client = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const rows = [
    // Demo
    { key: "enableDemoInvitation", value: enableDemoInvitation, updated_at: now },

    // Features
    { key: "enableCalendarSync", value: enableCalendarSync, updated_at: now },
    { key: "enableEnvelopeCalligraphy", value: enableEnvelopeCalligraphy, updated_at: now },
    { key: "enableMealSelection", value: enableMealSelection, updated_at: now },
    { key: "enableTravelConcierge", value: enableTravelConcierge, updated_at: now },
    { key: "enableDayOfTimeline", value: enableDayOfTimeline, updated_at: now },
    { key: "enableGuestbook", value: enableGuestbook, updated_at: now },
    { key: "enableTablePlanner", value: enableTablePlanner, updated_at: now },
    { key: "enableQrCheckin", value: enableQrCheckin, updated_at: now },
    { key: "enableRsvpReminders", value: enableRsvpReminders, updated_at: now },

    // Gifts & Payments
    { key: "showGiftDetails", value: showGiftDetails, updated_at: now },
    { key: "enableBankTransfer", value: enableBankTransfer, updated_at: now },
    { key: "bankName", value: bankName, updated_at: now },
    { key: "accountHolder", value: accountHolder, updated_at: now },
    { key: "iban", value: iban, updated_at: now },
    { key: "bic", value: bic, updated_at: now },
    { key: "giftNote", value: giftNote, updated_at: now },
    { key: "enableRevolut", value: enableRevolut, updated_at: now },
    { key: "revolutTag", value: revolutTag, updated_at: now },
    { key: "revolutNote", value: revolutNote, updated_at: now },
    { key: "enableWise", value: enableWise, updated_at: now },
    { key: "wiseTag", value: wiseTag, updated_at: now },
    { key: "wiseNote", value: wiseNote, updated_at: now },
    { key: "enableCash", value: enableCash, updated_at: now },
    { key: "cashNote", value: cashNote, updated_at: now },

    // Address
    { key: "showPrivateAddress", value: showPrivateAddress, updated_at: now },
    { key: "privateStreet", value: privateStreet, updated_at: now },
    { key: "privateCity", value: privateCity, updated_at: now },
    { key: "privateAccessNotes", value: privateAccessNotes, updated_at: now },

    // Resend API
    { key: "resendApiKey", value: resendApiKey, updated_at: now },
    { key: "resendFromEmail", value: resendFromEmail, updated_at: now },
    { key: "resendFromName", value: resendFromName, updated_at: now },

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
    { key: "whatsappCloudToken", value: whatsappCloudToken, updated_at: now },
    { key: "whatsappPhoneNumberId", value: whatsappPhoneNumberId, updated_at: now },
    { key: "whatsappGatewayUrl", value: whatsappGatewayUrl, updated_at: now },
    { key: "whatsappGatewayKey", value: whatsappGatewayKey, updated_at: now },

    // General
    { key: "spotifyPlaylistUrl", value: spotifyPlaylistUrl, updated_at: now },
    { key: "contactPhone", value: contactPhone, updated_at: now },
    { key: "contactEmail", value: contactEmail, updated_at: now },
  ];

  const { resilientStore } = await import("@/lib/storage/resilient-store");
  resilientStore.setDemoEnabled(enableDemoInvitation);
  resilientStore.updateSettings({
    enableDemoInvitation,
    enableCalendarSync,
    enableEnvelopeCalligraphy,
    enableMealSelection,
    enableTravelConcierge,
    enableDayOfTimeline,
    enableGuestbook,
    enableTablePlanner,
    enableQrCheckin,
    enableRsvpReminders,
    showGiftDetails,
    enableBankTransfer,
    bankName,
    accountHolder,
    iban,
    bic,
    giftNote,
    enableRevolut,
    revolutTag,
    revolutNote,
    enableWise,
    wiseTag,
    wiseNote,
    enableCash,
    cashNote,
    showPrivateAddress,
    privateStreet,
    privateCity,
    privateAccessNotes,
    resendApiKey,
    resendFromEmail,
    resendFromName,
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser,
    smtpPass,
    smtpSenderEmail,
    smtpSenderName,
    whatsappTemplate,
    whatsappDelaySeconds,
    whatsappCloudToken,
    whatsappPhoneNumberId,
    whatsappGatewayUrl,
    whatsappGatewayKey,
    spotifyPlaylistUrl,
    contactPhone,
    contactEmail,
  });

  try {
    await client.from("site_settings").upsert(rows);
  } catch {}

  try {
    await recordAdminAudit({
      actor,
      action: "INVITATION_UPDATED",
      resourceType: "invitation",
      metadata: {
        enableDemoInvitation,
        enableCalendarSync,
        enableMealSelection,
        enableGuestbook,
        showGiftDetails,
        showPrivateAddress,
        resendConfigured: Boolean(resendApiKey),
        smtpConfigured: Boolean(smtpHost && smtpUser),
      },
    });
  } catch {}

  revalidatePath("/admin/settings");
  revalidatePath("/admin/invitations");
  revalidatePath("/admin");
  revalidatePath("/i/demo");
  revalidatePath("/i/demo/invitation");
  revalidatePath("/");
}
