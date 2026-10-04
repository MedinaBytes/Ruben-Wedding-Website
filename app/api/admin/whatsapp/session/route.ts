import { NextResponse } from "next/server";
import { getAuthenticatedAdminIdentity } from "@/lib/admin/auth";
import { isSameOriginMutation } from "@/lib/security/request";
import {
  getWhatsAppStatus,
  startWhatsAppLinking,
  unlinkWhatsApp,
} from "@/lib/whatsapp/baileys-service";

export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET() {
  const actor = await getAuthenticatedAdminIdentity();
  if (!actor && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: noStoreHeaders });
  }

  const status = await getWhatsAppStatus();
  return NextResponse.json(status, { headers: noStoreHeaders });
}

export async function POST(request: Request) {
  const actor = await getAuthenticatedAdminIdentity();
  if (!actor && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: noStoreHeaders });
  }

  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403, headers: noStoreHeaders });
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
    return NextResponse.json(status, { headers: noStoreHeaders });
  }

  // Start linking or retrieve live QR code
  const status = await startWhatsAppLinking();
  return NextResponse.json(status, { headers: noStoreHeaders });
}
