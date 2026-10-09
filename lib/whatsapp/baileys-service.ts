import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  type WASocket,
} from "@whiskeysockets/baileys";
import pino from "pino";
import QRCode from "qrcode";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { resilientStore } from "@/lib/storage/resilient-store";

export interface WhatsAppBotState {
  status: "disconnected" | "connecting" | "connected";
  qrCode: string | null;
  linkedPhone: string | null;
  lastSyncedAt: string | null;
  error: string | null;
  isServerless?: boolean;
  engine?: "meta_cloud" | "external_gateway" | "socket_bot" | "direct_assistant";
  metaCloudConfigured?: boolean;
  gatewayConfigured?: boolean;
}

interface GlobalWhatsApp {
  socket: WASocket | null;
  state: WhatsAppBotState;
  isInitializing: boolean;
}

declare global {
  var __whatsappBot: GlobalWhatsApp | undefined;
}

export function isServerlessEnvironment(): boolean {
  return (
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    Boolean(process.env.LAMBDA_TASK_ROOT)
  );
}

function getAuthDir(): string {
  if (process.env.WHATSAPP_AUTH_DIR) {
    return path.resolve(process.env.WHATSAPP_AUTH_DIR);
  }

  // On Vercel / AWS Lambda, process.cwd() is read-only. Use os.tmpdir()
  if (isServerlessEnvironment()) {
    const tmpDir = path.join(os.tmpdir(), "whatsapp-auth");
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
    } catch {}
    return tmpDir;
  }

  try {
    const localDir = path.resolve(process.cwd(), ".whatsapp-auth");
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return localDir;
  } catch {
    const fallbackTmp = path.join(os.tmpdir(), "whatsapp-auth");
    try {
      if (!fs.existsSync(fallbackTmp)) {
        fs.mkdirSync(fallbackTmp, { recursive: true });
      }
    } catch {}
    return fallbackTmp;
  }
}

function getGlobalBot(): GlobalWhatsApp {
  if (!globalThis.__whatsappBot) {
    const saved = resilientStore.getWhatsAppSession();
    const authDir = getAuthDir();
    const hasAuthFiles =
      fs.existsSync(authDir) &&
      fs.readdirSync(authDir).length > 0;
    const isServerless = isServerlessEnvironment();

    globalThis.__whatsappBot = {
      socket: null,
      state: {
        status: hasAuthFiles && saved?.status === "connected" ? "connected" : "disconnected",
        qrCode: null,
        linkedPhone: hasAuthFiles ? saved?.linkedPhone ?? null : null,
        lastSyncedAt: saved?.lastSyncedAt ?? null,
        error: null,
        isServerless,
      },
      isInitializing: false,
    };
  }
  return globalThis.__whatsappBot;
}

export async function getWhatsAppStatus(): Promise<WhatsAppBotState> {
  const bot = getGlobalBot();
  bot.state.isServerless = isServerlessEnvironment();
  const authDir = getAuthDir();
  const hasAuthFiles =
    fs.existsSync(authDir) &&
    fs.readdirSync(authDir).length > 0;

  // Auto-resume existing session if auth credentials exist but socket is not active
  if (hasAuthFiles && !bot.socket && !bot.isInitializing && bot.state.status !== "connecting") {
    void startWhatsAppLinking().catch(() => {});
  }

  const settings = resilientStore.getSettings();
  const metaToken = String(process.env.WHATSAPP_CLOUD_API_TOKEN || settings.whatsappCloudToken || "").trim();
  const phoneId = String(process.env.WHATSAPP_PHONE_NUMBER_ID || settings.whatsappPhoneNumberId || "").trim();
  const metaCloudConfigured = Boolean(metaToken && phoneId);

  const gatewayUrl = String(process.env.WHATSAPP_GATEWAY_URL || settings.whatsappGatewayUrl || "").trim();
  const gatewayConfigured = Boolean(gatewayUrl);

  let engine: "meta_cloud" | "external_gateway" | "socket_bot" | "direct_assistant" = "direct_assistant";
  if (bot.state.status === "connected") {
    engine = "socket_bot";
  } else if (metaCloudConfigured) {
    engine = "meta_cloud";
  } else if (gatewayConfigured) {
    engine = "external_gateway";
  }

  bot.state.engine = engine;
  bot.state.metaCloudConfigured = metaCloudConfigured;
  bot.state.gatewayConfigured = gatewayConfigured;

  return { ...bot.state };
}

export async function startWhatsAppLinking(): Promise<WhatsAppBotState> {
  const bot = getGlobalBot();

  if (bot.isInitializing) {
    return { ...bot.state };
  }

  if (bot.socket && bot.state.status === "connected") {
    return { ...bot.state };
  }

  // If already connecting and we have a valid qrCode, return it immediately
  if (bot.socket && bot.state.status === "connecting" && bot.state.qrCode) {
    return { ...bot.state };
  }

  // Close previous non-connected socket before opening a new one
  if (bot.socket) {
    try {
      bot.socket.end(undefined);
    } catch {}
    bot.socket = null;
  }

  bot.isInitializing = true;
  bot.state.status = "connecting";
  bot.state.error = null;

  try {
    const authDir = getAuthDir();
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    const { state: authState, saveCreds } = await useMultiFileAuthState(authDir);

    const sock = makeWASocket({
      auth: authState,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      browser: ["Ruben & Andrea Wedding", "Chrome", "1.0.0"],
      connectTimeoutMs: 60_000,
      defaultQueryTimeoutMs: 60_000,
      syncFullHistory: false,
    });

    bot.socket = sock;

    sock.ev.on("creds.update", saveCreds);

    let initialHandled = false;
    let resolveInitial: () => void = () => {};
    const initialQrPromise = new Promise<void>((resolve) => {
      resolveInitial = resolve;
      setTimeout(() => {
        if (!initialHandled) {
          initialHandled = true;
          resolve();
        }
      }, 4000);
    });

    sock.ev.on("connection.update", async (update) => {
      const { qr, connection, lastDisconnect } = update;

      if (qr) {
        try {
          bot.state.qrCode = await QRCode.toDataURL(qr, {
            margin: 2,
            scale: 7,
            color: { dark: "#2D2224", light: "#FFFFFF" },
          });
          bot.state.status = "connecting";
          bot.state.error = null;
          if (!initialHandled) {
            initialHandled = true;
            resolveInitial();
          }
        } catch (err: unknown) {
          bot.state.error = err instanceof Error ? err.message : "Failed to generate QR code";
        }
      }

      if (connection === "open") {
        const rawId = sock.user?.id || "";
        const cleanNumber = rawId.split(":")[0]?.split("@")[0] || "";
        const formatted = cleanNumber ? `+${cleanNumber}` : "Connected Device";

        bot.state.status = "connected";
        bot.state.linkedPhone = formatted;
        bot.state.qrCode = null;
        bot.state.lastSyncedAt = new Date().toISOString();
        bot.state.error = null;

        resilientStore.updateWhatsAppSession({
          status: "connected",
          linkedPhone: formatted,
          qrCode: null,
          lastSyncedAt: bot.state.lastSyncedAt,
        });

        if (!initialHandled) {
          initialHandled = true;
          resolveInitial();
        }
      }

      if (connection === "close") {
        const statusCode = (lastDisconnect?.error as { output?: { statusCode?: number } })?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;

        if (loggedOut) {
          await unlinkWhatsApp();
        } else {
          // Temporary drop, attempt re-connect
          bot.socket = null;
          bot.state.status = "disconnected";
        }
        if (!initialHandled) {
          initialHandled = true;
          resolveInitial();
        }
      }
    });

    await initialQrPromise;
    bot.isInitializing = false;
    return { ...bot.state };
  } catch (err: unknown) {
    bot.isInitializing = false;
    bot.state.status = "disconnected";
    const baseMsg = err instanceof Error ? err.message : "Failed to initialize WhatsApp connection";
    bot.state.error = isServerlessEnvironment()
      ? `Serverless environment detected: WebSockets cannot remain persistent across background HTTP invocations. Use direct click or local bot.`
      : baseMsg;
    return { ...bot.state };
  }
}

export async function unlinkWhatsApp(): Promise<void> {
  const bot = getGlobalBot();

  if (bot.socket) {
    try {
      await bot.socket.logout();
    } catch {}
    try {
      bot.socket.end(undefined);
    } catch {}
    bot.socket = null;
  }

  try {
    const authDir = getAuthDir();
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true });
    }
  } catch {}

  bot.state.status = "disconnected";
  bot.state.linkedPhone = null;
  bot.state.qrCode = null;
  bot.state.lastSyncedAt = null;
  bot.state.error = null;
  bot.isInitializing = false;

  resilientStore.updateWhatsAppSession({
    status: "disconnected",
    linkedPhone: null,
    qrCode: null,
    lastSyncedAt: null,
  });
}

export async function sendWhatsAppMessage(
  phone: string,
  text: string,
): Promise<{
  success: boolean;
  error?: string;
  messageId?: string;
  directUrl?: string;
  waMeUrl?: string;
  engine?: "meta_cloud" | "external_gateway" | "socket_bot" | "direct_assistant";
}> {
  const cleanPhone = phone.replace(/[^\d]/g, "");

  const directUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
  const waMeUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;

  if (!cleanPhone || cleanPhone.length < 6) {
    return { success: false, error: "Invalid recipient phone number format." };
  }

  // Tier 1: Local / VPS Persistent Baileys Socket (PRIORITIZED FOR DIRECT BOT DISPATCH)
  const bot = getGlobalBot();
  if (bot.socket && bot.state.status === "connected") {
    const jid = `${cleanPhone}@s.whatsapp.net`;
    try {
      const result = await bot.socket.sendMessage(jid, { text });
      return {
        success: true,
        messageId: result?.key?.id ?? undefined,
        engine: "socket_bot",
      };
    } catch (err: unknown) {
      // If socket failed, fall through to other tiers
      console.warn("Baileys socket sendMessage failed, falling back:", err);
    }
  }

  const settings = resilientStore.getSettings();
  const metaToken = String(process.env.WHATSAPP_CLOUD_API_TOKEN || settings.whatsappCloudToken || "").trim();
  const phoneId = String(process.env.WHATSAPP_PHONE_NUMBER_ID || settings.whatsappPhoneNumberId || "").trim();

  // Tier 2: Meta WhatsApp Cloud API (if configured)
  if (metaToken && phoneId) {
    try {
      const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${metaToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhone,
          type: "text",
          text: { preview_url: true, body: text },
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.messages?.[0]?.id) {
        return {
          success: true,
          messageId: data.messages[0].id,
          engine: "meta_cloud",
        };
      }
    } catch {}
  }

  // Tier 3: External Gateway Microservice (if configured)
  const gatewayUrl = String(process.env.WHATSAPP_GATEWAY_URL || settings.whatsappGatewayUrl || "").trim();
  const gatewayKey = String(process.env.WHATSAPP_GATEWAY_KEY || settings.whatsappGatewayKey || "").trim();

  if (gatewayUrl) {
    try {
      const res = await fetch(gatewayUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(gatewayKey ? { Authorization: `Bearer ${gatewayKey}`, "x-api-key": gatewayKey } : {}),
        },
        body: JSON.stringify({
          number: cleanPhone,
          phone: cleanPhone,
          message: text,
          text,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return {
          success: true,
          messageId: data?.id || data?.messageId || "gateway-ok",
          engine: "external_gateway",
        };
      }
    } catch {}
  }

  // Tier 4: Direct 1-Click WhatsApp Assistant Fallback
  return {
    success: false,
    error: "WhatsApp bot is not connected. Scan QR code to connect directly or use 1-Click WhatsApp link.",
    directUrl,
    waMeUrl,
    engine: "direct_assistant",
  };
}
