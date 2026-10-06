import { NextResponse } from "next/server";
import { getAuthenticatedAdminIdentity } from "@/lib/admin/auth";
import { isSameOriginMutation } from "@/lib/security/request";

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

  // ToS-safe serverless direct WhatsApp assistant state
  const status = {
    status: "connected",
    engine: "direct_assistant",
    isServerless: true,
    qrCode: null,
    linkedPhone: null,
    lastSyncedAt: new Date().toISOString(),
    error: null,
    mode: "wa_me_click_to_chat",
    description: "Serverless-ready direct WhatsApp assistant. Uses official wa.me click-to-chat links without WebSocket ban risks.",
  };

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

  return GET();
}
