"use server";

import nodemailer from "nodemailer";
import { getAuthenticatedAdminIdentity } from "@/lib/admin/auth";
import { recordAdminAudit } from "@/lib/admin/audit";
import { resilientStore } from "@/lib/storage/resilient-store";

export interface SmtpTestResult {
  success: boolean;
  message?: string;
  error?: string;
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
      auth: {
        user,
        pass,
      },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
    });

    // Verify SMTP connection handshake
    await transporter.verify();

    const timestamp = new Date().toISOString();
    // Send actual test email
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
        metadata: {
          smtpHost: host,
          testRecipient: toEmail,
          messageId: info.messageId,
        },
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
