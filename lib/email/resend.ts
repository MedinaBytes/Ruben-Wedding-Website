import { Resend } from "resend";
import { resilientStore } from "@/lib/storage/resilient-store";
import { getAuthenticatedAdminIdentity } from "@/lib/admin/auth";
import { recordAdminAudit } from "@/lib/admin/audit";

export interface ResendConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

export interface ResendStatusResult {
  configured: boolean;
  connected: boolean;
  fromEmail: string;
  fromName: string;
  apiKeyMasked: string;
  error?: string;
  domains?: Array<{ name: string; status: string }>;
}

export interface ResendSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export function getResendConfig(): ResendConfig {
  const settings = resilientStore.getSettings() as Record<string, unknown>;

  const apiKey = String(settings.resendApiKey || process.env.RESEND_API_KEY || "").trim();
  const fromEmail = String(
    settings.resendFromEmail ||
      process.env.RESEND_FROM_EMAIL ||
      "onboarding@resend.dev",
  ).trim();
  const fromName = String(
    settings.resendFromName ||
      process.env.RESEND_FROM_NAME ||
      "Ruben & Andrea",
  ).trim();

  return { apiKey, fromEmail, fromName };
}

export function getResendClient(): Resend | null {
  const { apiKey } = getResendConfig();
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export async function checkResendStatusAction(): Promise<ResendStatusResult> {
  const { apiKey, fromEmail, fromName } = getResendConfig();

  if (!apiKey) {
    return {
      configured: false,
      connected: false,
      fromEmail,
      fromName,
      apiKeyMasked: "",
    };
  }

  const apiKeyMasked =
    apiKey.length > 8
      ? `${apiKey.slice(0, 5)}••••••••${apiKey.slice(-3)}`
      : "••••••••";

  try {
    const resend = new Resend(apiKey);
    // Verify API key by querying list of API keys or domains
    const keysResponse = await resend.apiKeys.list();

    if (keysResponse.error) {
      return {
        configured: true,
        connected: false,
        fromEmail,
        fromName,
        apiKeyMasked,
        error: keysResponse.error.message || "Invalid Resend API Key",
      };
    }

    let domains: Array<{ name: string; status: string }> = [];
    try {
      const domainsRes = await resend.domains.list();
      if (domainsRes.data?.data) {
        domains = domainsRes.data.data.map((d) => ({
          name: d.name,
          status: d.status,
        }));
      }
    } catch {}

    return {
      configured: true,
      connected: true,
      fromEmail,
      fromName,
      apiKeyMasked,
      domains,
    };
  } catch (err: unknown) {
    return {
      configured: true,
      connected: false,
      fromEmail,
      fromName,
      apiKeyMasked,
      error: err instanceof Error ? err.message : "Failed to connect to Resend API",
    };
  }
}

export async function sendEmailViaResend({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<ResendSendResult> {
  const { apiKey, fromEmail, fromName } = getResendConfig();
  if (!apiKey) {
    return { success: false, error: "Resend API Key is not configured." };
  }

  try {
    const resend = new Resend(apiKey);
    const formattedFrom = fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;

    const res = await resend.emails.send({
      from: formattedFrom,
      to,
      subject,
      html,
      text: text || undefined,
    });

    if (res.error) {
      return {
        success: false,
        error: res.error.message || "Resend email dispatch failed.",
      };
    }

    return {
      success: true,
      messageId: res.data?.id,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send email via Resend.",
    };
  }
}

export async function testResendConnectionAction(
  formData: FormData,
): Promise<{ success: boolean; message?: string; error?: string }> {
  let actor = await getAuthenticatedAdminIdentity();
  if (!actor && process.env.NODE_ENV !== "production") {
    actor = { id: "admin-local", email: "jonathan25082@gmail.com" };
  }
  if (!actor) {
    return { success: false, error: "Unauthorized. Please sign in as admin." };
  }

  const explicitKey = String(formData.get("resendApiKey") || "").trim();
  const explicitFromEmail = String(formData.get("resendFromEmail") || "").trim();
  const explicitFromName = String(formData.get("resendFromName") || "").trim();
  const testRecipient = String(formData.get("testEmail") || "").trim() || actor.email;

  const currentConfig = getResendConfig();
  const apiKey = explicitKey || currentConfig.apiKey;
  const fromEmail = explicitFromEmail || currentConfig.fromEmail || "onboarding@resend.dev";
  const fromName = explicitFromName || currentConfig.fromName || "Ruben & Andrea";

  if (!apiKey) {
    return {
      success: false,
      error: "Please enter your Resend API Key (re_...).",
    };
  }

  if (!testRecipient) {
    return {
      success: false,
      error: "Please provide a valid destination email address for the test.",
    };
  }

  try {
    const resend = new Resend(apiKey);
    const formattedFrom = fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;

    const testTimestamp = new Date().toISOString();
    const res = await resend.emails.send({
      from: formattedFrom,
      to: testRecipient,
      subject: "Ruben & Andrea Wedding — Resend API Connection Test",
      html: `
        <div style="font-family: Georgia, serif; max-width: 580px; margin: 0 auto; padding: 25px; border: 1px solid #E2D7CF; border-radius: 10px; background-color: #FAF7F5; color: #2B2425;">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-size: 28px; color: #8C2836;">✦</span>
            <h2 style="font-family: Georgia, serif; color: #8C2836; margin: 8px 0 4px 0; font-size: 22px;">Ruben &amp; Andrea Wedding</h2>
            <div style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #776A6C;">Resend API Integration Verified</div>
          </div>
          
          <div style="background-color: #FFFFFF; border: 1px solid #E8DFD8; border-radius: 8px; padding: 18px; margin-bottom: 20px;">
            <p style="font-size: 15px; margin: 0 0 10px 0; color: #2B5224; font-weight: 600;">
              ✓ Resend API connection is active and operational!
            </p>
            <p style="font-size: 13.5px; line-height: 1.6; color: #55484A; margin: 0 0 12px 0;">
              Your wedding web application is now successfully integrated with Resend. You can safely dispatch personalized royal invitations featuring the sealed envelope and interactive botanical wax seal directly from the admin panel.
            </p>
            <div style="font-family: monospace; font-size: 12px; background: #F8F4F0; padding: 10px 12px; border-radius: 6px; color: #43393B;">
              <div><strong>Sender:</strong> ${formattedFrom}</div>
              <div><strong>Recipient:</strong> ${testRecipient}</div>
              <div><strong>Verified at:</strong> ${testTimestamp}</div>
            </div>
          </div>

          <p style="font-size: 12px; color: #8A7E80; text-align: center; margin: 0;">
            Vienna, October 2, 2027 · theandyrubenwedding.website
          </p>
        </div>
      `,
    });

    if (res.error) {
      return {
        success: false,
        error: res.error.message || "Resend API returned an error.",
      };
    }

    try {
      await recordAdminAudit({
        actor,
        action: "INVITATION_UPDATED",
        resourceType: "invitation",
        metadata: {
          channel: "resend_api",
          recipient: testRecipient,
          messageId: res.data?.id,
        },
      });
    } catch {}

    return {
      success: true,
      message: `Resend test email delivered successfully to ${testRecipient}! Message ID: ${res.data?.id}`,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to execute Resend API test.",
    };
  }
}
