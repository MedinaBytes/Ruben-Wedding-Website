"use server";

import nodemailer from "nodemailer";
import { getAuthenticatedAdminIdentity } from "@/lib/admin/auth";
import { recordAdminAudit } from "@/lib/admin/audit";
import { resilientStore } from "@/lib/storage/resilient-store";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildEnvelopeInvitationHtml } from "@/lib/email/template";
import { getResendConfig, sendEmailViaResend } from "@/lib/email/resend";

export interface SmtpTestResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface SendInvitationEmailResult {
  success: boolean;
  messageId?: string;
  provider?: "resend" | "smtp";
  error?: string;
}

async function getSmtpConfig() {
  const settings = resilientStore.getSettings() as Record<string, unknown>;

  const host = String(settings.smtpHost || process.env.SMTP_HOST || "").trim();
  const port = parseInt(String(settings.smtpPort || process.env.SMTP_PORT || "587"), 10) || 587;
  const secure = Boolean(settings.smtpSecure) || process.env.SMTP_SECURE === "true" || port === 465;
  const user = String(settings.smtpUser || process.env.SMTP_USER || "").trim();
  const pass = String(settings.smtpPass || process.env.SMTP_PASS || "").trim();
  const fromEmail = String(settings.smtpSenderEmail || process.env.SMTP_SENDER_EMAIL || user).trim();
  const fromName = String(settings.smtpSenderName || process.env.SMTP_SENDER_NAME || "Ruben & Andrea").trim();

  return { host, port, secure, user, pass, fromEmail, fromName };
}

export { buildEnvelopeInvitationHtml };

export async function testSmtpConnectionAction(formData: FormData): Promise<SmtpTestResult> {
  let actor = await getAuthenticatedAdminIdentity();
  if (!actor && process.env.NODE_ENV !== "production") {
    actor = { id: "admin-local", email: "jonathan25082@gmail.com" };
  }
  if (!actor) {
    return { success: false, error: "Unauthorized. Please sign in as admin." };
  }

  const host = String(formData.get("smtpHost") || "").trim();
  const port = parseInt(String(formData.get("smtpPort") || "587"), 10) || 587;
  const secure = formData.get("smtpSecure") === "on" || port === 465;
  const user = String(formData.get("smtpUser") || "").trim();
  const pass = String(formData.get("smtpPass") || "").trim();
  const fromEmail = String(formData.get("smtpSenderEmail") || "").trim() || user;
  const fromName = String(formData.get("smtpSenderName") || "Ruben & Andrea").trim();
  const toEmail = String(formData.get("testEmail") || "").trim() || actor.email || fromEmail;

  if (!host || !user || !pass) {
    return {
      success: false,
      error: "Please provide SMTP Host, Username/API Key, and Password.",
    };
  }

  if (!toEmail) {
    return {
      success: false,
      error: "Please enter a destination email to receive the test message.",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
    });

    await transporter.verify();

    const timestamp = new Date().toISOString();
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: toEmail,
      subject: "Ruben & Andrea Wedding — SMTP Server Test Connection",
      text: `Hello,\n\nYour SMTP server configuration is working perfectly!\n\nHost: ${host}:${port}\nSender: ${fromName} <${fromEmail}>\nTimestamp: ${timestamp}\n\nYou can now send invitation emails directly to your guests from the admin panel.`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 2rem; border: 1px solid #E8DFD8; border-radius: 8px; background: #FAF7F5;">
          <h2 style="color: #8C2836; margin-top: 0;">Ruben &amp; Andrea Wedding</h2>
          <p style="font-size: 1.1rem; color: #2B2425; font-weight: bold;">SMTP Connection Succeeded</p>
          <p style="color: #55484A; line-height: 1.6;">
            Your custom SMTP email server has been verified and successfully delivered this test email.
          </p>
          <div style="background: #FFFFFF; padding: 1rem; border-radius: 6px; border: 1px solid #E2D7CF; font-family: monospace; font-size: 0.85rem; color: #4A3E40;">
            <div><strong>Host:</strong> ${host}:${port}</div>
            <div><strong>Sender:</strong> ${fromName} &lt;${fromEmail}&gt;</div>
            <div><strong>Timestamp:</strong> ${timestamp}</div>
          </div>
          <p style="color: #776A6C; font-size: 0.85rem; margin-top: 1.5rem;">
            Ruben &amp; Andrea Wedding · Vienna, October 2, 2027
          </p>
        </div>
      `,
    });

    try {
      await recordAdminAudit({
        actor,
        action: "INVITATION_UPDATED",
        resourceType: "invitation",
        metadata: { smtpHost: host, testRecipient: toEmail, messageId: info.messageId },
      });
    } catch {}

    return {
      success: true,
      message: `SMTP verified! Test email successfully delivered to ${toEmail}.`,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to connect to SMTP server.",
    };
  }
}

export async function sendInvitationEmailAction({
  invitationId,
  recipientEmail,
  subject,
}: {
  invitationId: string;
  recipientEmail?: string;
  subject?: string;
}): Promise<SendInvitationEmailResult> {
  let actor = await getAuthenticatedAdminIdentity();
  if (!actor && process.env.NODE_ENV !== "production") {
    actor = { id: "admin-local", email: "jonathan25082@gmail.com" };
  }
  if (!actor) {
    return { success: false, error: "Unauthorized. Please sign in as admin." };
  }

  // 1. Fetch invitation
  const localInv = resilientStore.getInvitationById(invitationId);
  let invitation = localInv;

  if (!invitation) {
    try {
      const client = createSupabaseAdminClient();
      const { data } = await client
        .from("invitations")
        .select("id, display_name, language, email, phone, whatsapp, max_guests, plus_one_allowed")
        .eq("id", invitationId)
        .maybeSingle();
      if (data) {
        invitation = {
          id: data.id,
          token: data.id,
          token_hash: "",
          display_name: data.display_name,
          normalized_name: "",
          language: data.language,
          max_guests: data.max_guests || 1,
          plus_one_allowed: Boolean(data.plus_one_allowed),
          group_name: null,
          normalized_group_name: null,
          personal_message: null,
          email: data.email,
          status: "active",
          created_at: new Date().toISOString(),
        };
      }
    } catch {}
  }

  if (!invitation) {
    return { success: false, error: "Invitation not found." };
  }

  const targetEmail = recipientEmail?.trim() || invitation.email?.trim();
  if (!targetEmail || !targetEmail.includes("@")) {
    return { success: false, error: "No valid email address found for this guest." };
  }

  const origin = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const token = invitation.token || invitation.id;
  const invitationUrl = `${origin}/i/${token}${invitation.language ? `?lang=${invitation.language}` : ""}`;

  const lang = invitation.language || "es";
  const defaultSubject =
    lang === "es"
      ? `Invitación Imperial a la Boda de Ruben & Andrea — ${invitation.display_name}`
      : lang === "de" || lang === "de-AT"
        ? `Hochzeitseinladung Ruben & Andrea — ${invitation.display_name}`
        : lang === "hu"
          ? `Esküvői Meghívó: Ruben & Andrea — ${invitation.display_name}`
          : `Ruben & Andrea Wedding Invitation — ${invitation.display_name}`;

  const emailSubject = subject || defaultSubject;
  const emailHtml = buildEnvelopeInvitationHtml({
    guestName: invitation.display_name,
    invitationUrl,
    language: lang,
    maxGuests: invitation.max_guests,
    plusOneAllowed: invitation.plus_one_allowed,
    siteUrl: origin,
  });

  // Check if Resend is configured (preferred API provider)
  const resendConfig = getResendConfig();

  if (resendConfig.apiKey) {
    const resendRes = await sendEmailViaResend({
      to: targetEmail,
      subject: emailSubject,
      html: emailHtml,
    });

    if (resendRes.success) {
      resilientStore.recordEvent({
        invitation_id: invitation.id,
        event_type: "EMAIL_DISPATCHED",
        session_id: resendRes.messageId || "resend-api",
      });

      try {
        await recordAdminAudit({
          actor,
          action: "INVITATION_UPDATED",
          resourceType: "invitation",
          resourceId: invitation.id,
          metadata: {
            channel: "resend_api",
            recipient: targetEmail,
            messageId: resendRes.messageId,
          },
        });
      } catch {}

      return {
        success: true,
        messageId: resendRes.messageId,
        provider: "resend",
      };
    } else {
      // If Resend failed with an error, return error
      return {
        success: false,
        error: `Resend error: ${resendRes.error}`,
      };
    }
  }

  // Fallback to SMTP
  const smtp = await getSmtpConfig();
  if (!smtp.host || !smtp.user || !smtp.pass) {
    return {
      success: false,
      error: "No email service configured. Please configure your Resend API Key or SMTP credentials in Settings.",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: { user: smtp.user, pass: smtp.pass },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
    });

    const info = await transporter.sendMail({
      from: `"${smtp.fromName}" <${smtp.fromEmail}>`,
      to: targetEmail,
      subject: emailSubject,
      html: emailHtml,
    });

    // Record email dispatched event
    resilientStore.recordEvent({
      invitation_id: invitation.id,
      event_type: "EMAIL_DISPATCHED",
      session_id: info.messageId || "email-smtp",
    });

    try {
      await recordAdminAudit({
        actor,
        action: "INVITATION_UPDATED",
        resourceType: "invitation",
        resourceId: invitation.id,
        metadata: {
          channel: "smtp_email",
          recipient: targetEmail,
          messageId: info.messageId,
        },
      });
    } catch {}

    return {
      success: true,
      messageId: info.messageId,
      provider: "smtp",
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send invitation email.",
    };
  }
}
