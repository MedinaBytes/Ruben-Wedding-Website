import { NextResponse } from "next/server";
import { getAuthenticatedAdminIdentity } from "@/lib/admin/auth";
import { isSameOriginMutation } from "@/lib/security/request";
import {
  getWhatsAppStatus,
  startWhatsAppLinking,
  unlinkWhatsApp,
} from "@/lib/whatsapp/baileys-service";

export async function GET() {
  const actor = await getAuthenticatedAdminIdentity();
  if (!actor && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const status = await getWhatsAppStatus();
  return NextResponse.json(status);
}

export async function POST(request: Request) {
  const actor = await getAuthenticatedAdminIdentity();
  if (!actor && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const action = (body as { action?: string })?.action || "start";

  if (action === "unlink") {
    await unlinkWhatsApp();
    const status = await getWhatsAppStatus();
    return NextResponse.json(status);
  }

  // Start linking or retrieve live QR code
  const status = await startWhatsAppLinking();
  return NextResponse.json(status);
}
