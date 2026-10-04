import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  type WASocket,
} from "@whiskeysockets/baileys";
import pino from "pino";
import QRCode from "qrcode";
import fs from "node:fs";
import path from "node:path";
import { resilientStore } from "@/lib/storage/resilient-store";

export interface WhatsAppBotState {
  status: "disconnected" | "connecting" | "connected";
  qrCode: string | null;
  linkedPhone: string | null;
  lastSyncedAt: string | null;
  error: string | null;
}

interface GlobalWhatsApp {
  socket: WASocket | null;
  state: WhatsAppBotState;
  isInitializing: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var __whatsappBot: GlobalWhatsApp | undefined;
}

const AUTH_DIR = path.resolve(process.cwd(), ".whatsapp-auth");

function getGlobalBot(): GlobalWhatsApp {
  if (!globalThis.__whatsappBot) {
    const saved = resilientStore.getWhatsAppSession();
    const hasAuthFiles = fs.existsSync(AUTH_DIR) && fs.readdirSync(AUTH_DIR).length > 0;

    globalThis.__whatsappBot = {
      socket: null,
      state: {
        status: hasAuthFiles && saved?.status === "connected" ? "connected" : "disconnected",
        qrCode: null,
        linkedPhone: hasAuthFiles ? saved?.linkedPhone ?? null : null,
        lastSyncedAt: saved?.lastSyncedAt ?? null,
        error: null,
      },
      isInitializing: false,
    };
  }
  return globalThis.__whatsappBot;
}

export async function getWhatsAppStatus(): Promise<WhatsAppBotState> {
  const bot = getGlobalBot();
  const hasAuthFiles = fs.existsSync(AUTH_DIR) && fs.readdirSync(AUTH_DIR).length > 0;

  // Auto-resume existing session if auth credentials exist but socket is not active
  if (hasAuthFiles && !bot.socket && !bot.isInitializing && bot.state.status !== "connecting") {
    void startWhatsAppLinking().catch(() => {});
  }

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

  bot.isInitializing = true;
  bot.state.status = "connecting";
  bot.state.error = null;

  try {
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    const { state: authState, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

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
      }
    });

    bot.isInitializing = false;
    return { ...bot.state };
  } catch (err: unknown) {
    bot.isInitializing = false;
    bot.state.status = "disconnected";
    bot.state.error = err instanceof Error ? err.message : "Failed to initialize WhatsApp connection";
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
    if (fs.existsSync(AUTH_DIR)) {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
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
): Promise<{ success: boolean; error?: string; messageId?: string; directUrl?: string }> {
  const bot = getGlobalBot();
  const cleanPhone = phone.replace(/[^\d]/g, "");

  const directUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;

  if (!cleanPhone || cleanPhone.length < 6) {
    return { success: false, error: "Invalid recipient phone number format." };
  }

  if (!bot.socket || bot.state.status !== "connected") {
    return {
      success: false,
      error: "WhatsApp bot is not connected. Open directly via WhatsApp Web link.",
      directUrl,
    };
  }

  const jid = `${cleanPhone}@s.whatsapp.net`;

  try {
    const result = await bot.socket.sendMessage(jid, { text });
    return {
      success: true,
      messageId: result?.key?.id,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send message via WhatsApp socket.",
      directUrl,
    };
  }
}
