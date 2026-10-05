"use server";

import nodemailer from "nodemailer";
import { getAuthenticatedAdminIdentity } from "@/lib/admin/auth";
import { recordAdminAudit } from "@/lib/admin/audit";
import { resilientStore } from "@/lib/storage/resilient-store";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface SmtpTestResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface SendInvitationEmailResult {
  success: boolean;
  messageId?: string;
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

function buildInvitationEmailHtml({
  guestName,
  invitationUrl,
  language = "en",
}: {
  guestName: string;
  invitationUrl: string;
  language?: string;
}) {
  const isEs = language === "es" || language.startsWith("es");
  const isDe = language === "de" || language === "de-AT" || language.startsWith("de");
  const isHu = language === "hu" || language.startsWith("hu");

  const eyebrow = isEs
    ? "CELEBRACIÓN PRIVADA DE BODA"
    : isDe
      ? "HOCHZEITSEINLADUNG"
      : isHu
        ? "ESKÜVŐI MEGHÍVÓ"
        : "A PRIVATE WEDDING CELEBRATION";

  const greeting = isEs
    ? `Estimado/a ${guestName},`
    : isDe
      ? `Liebe/r ${guestName},`
      : isHu
        ? `Kedves ${guestName}!`
        : `Dear ${guestName},`;

  const leadText = isEs
    ? "Ruben y Andrea tienen el honor y la inmensa alegría de invitarte a celebrar su boda en Viena."
    : isDe
      ? "Ruben & Andrea geben sich die Ehre und freuen sich riesig, Dich zu ihrer Hochzeit in Wien einzuladen."
      : isHu
        ? "Ruben és Andrea szeretettel és örömmel hívnak meg esküvőjük megünneplésére Bécsbe."
        : "Ruben & Andrea request the pleasure of your company to celebrate their wedding in Vienna.";

  const bodyText = isEs
    ? "Hemos preparado una experiencia digital interactiva con todos los detalles del evento, lugares, código de vestimenta, hospedaje y confirmación de asistencia (RSVP)."
    : isDe
      ? "Wir haben eine interaktive digitale Einladung mit allen Details zu Ablauf, Veranstaltungsorten, Dresscode, Anreise und Rückmeldung (RSVP) für Dich vorbereitet."
      : isHu
        ? "Készítettünk egy digitális élményt a rendezvény minden részletével, a helyszínekkel, az öltözködési kóddal, a szállással és a visszajelzéssel (RSVP)."
        : "We have prepared an interactive digital invitation with full details for the ceremony, celebration venues, dress code, travel, and RSVP.";

  const ctaText = isEs
    ? "Ver Invitación Personalizada →"
    : isDe
      ? "Zur persönlichen Einladung →"
      : isHu
        ? "Személyes meghívó megnyitása →"
        : "Open Your Personal Invitation →";

  const datePlace = isEs
    ? "Sábado, 2 de Octubre de 2027 · Viena, Austria"
    : isDe
      ? "Samstag, 2. Oktober 2027 · Wien, Österreich"
      : isHu
        ? "2027. október 2., szombat · Bécs, Ausztria"
        : "Saturday, October 2, 2027 · Vienna, Austria";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ruben &amp; Andrea Wedding</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #FAF7F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Georgia, serif; color: #2B2425;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAF7F5; padding: 30px 15px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E6DED8; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
                <!-- Header Banner -->
                <tr>
                  <td align="center" style="background: linear-gradient(135deg, #8C2836 0%, #681C26 100%); padding: 35px 20px 30px 20px;">
                    <div style="font-family: Georgia, serif; font-size: 28px; color: #CCA468; letter-spacing: 4px; font-weight: normal; margin-bottom: 8px;">
                      R &amp; A
                    </div>
                    <div style="color: rgba(255,255,255,0.85); font-size: 11px; letter-spacing: 2px; text-transform: uppercase;">
                      ${eyebrow}
                    </div>
                  </td>
                </tr>

                <!-- Content Area -->
                <tr>
                  <td style="padding: 35px 35px 25px 35px; text-align: center;">
                    <h1 style="font-family: Georgia, serif; font-size: 26px; color: #2B2425; font-weight: normal; margin: 0 0 15px 0;">
                      Ruben <span style="color: #CCA468; font-style: italic;">&amp;</span> Andrea
                    </h1>
                    <div style="font-size: 14px; color: #8C2836; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 25px;">
                      ${datePlace}
                    </div>

                    <div style="background-color: #FAF7F5; border-radius: 8px; border: 1px solid #EFE8E2; padding: 20px; margin-bottom: 25px; text-align: left;">
                      <p style="font-size: 16px; font-weight: 600; color: #2B2425; margin: 0 0 10px 0;">
                        ${greeting}
                      </p>
                      <p style="font-size: 14px; line-height: 1.6; color: #55484A; margin: 0 0 12px 0;">
                        ${leadText}
                      </p>
                      <p style="font-size: 13px; line-height: 1.6; color: #776A6C; margin: 0;">
                        ${bodyText}
                      </p>
                    </div>

                    <!-- CTA Button -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 25px 0 20px 0;">
                      <tr>
                        <td align="center">
                          <a href="${invitationUrl}" target="_blank" style="display: inline-block; background-color: #8C2836; color: #FFFFFF; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 30px; border-radius: 999px; box-shadow: 0 3px 10px rgba(140,40,54,0.25);">
                            ${ctaText}
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="font-size: 11px; color: #9A8E90; margin-top: 15px; word-break: break-all;">
                      Direct link: <a href="${invitationUrl}" style="color: #8C2836; text-decoration: underline;">${invitationUrl}</a>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #F8F4F0; padding: 20px; text-align: center; border-top: 1px solid #EFE8E2; font-size: 11px; color: #8A7E80; line-height: 1.5;">
                    Ruben &amp; Andrea Wedding · Vienna 2027<br>
                    This is a private invitation link created specifically for your party.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

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
        .select("id, display_name, language, email, phone, whatsapp")
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
          max_guests: 1,
          plus_one_allowed: false,
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

  const smtp = await getSmtpConfig();
  if (!smtp.host || !smtp.user || !smtp.pass) {
    return { success: false, error: "SMTP settings not configured. Please configure SMTP in Settings." };
  }

  const origin = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const token = invitation.token || invitation.id;
  const invitationUrl = `${origin}/i/${token}${invitation.language ? `?lang=${invitation.language}` : ""}`;

  const emailSubject = subject || `Ruben & Andrea Wedding Invitation — ${invitation.display_name}`;
  const emailHtml = buildInvitationEmailHtml({
    guestName: invitation.display_name,
    invitationUrl,
    language: invitation.language || "en",
  });

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
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send invitation email.",
    };
  }
}
