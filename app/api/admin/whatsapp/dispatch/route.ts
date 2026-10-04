import { NextResponse } from "next/server";
import { getAuthenticatedAdminIdentity } from "@/lib/admin/auth";
import { isSameOriginMutation } from "@/lib/security/request";
import { sendWhatsAppMessage } from "@/lib/whatsapp/baileys-service";
import { recordAdminAudit } from "@/lib/admin/audit";
import { resilientStore } from "@/lib/storage/resilient-store";

export async function POST(request: Request) {
  let actor = await getAuthenticatedAdminIdentity();
  if (!actor && process.env.NODE_ENV !== "production") {
    actor = { id: "admin-local", email: "jonathan25082@gmail.com" };
  }
  if (!actor) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { phone, message, invitationId, guestName } = body as {
    phone?: string;
    message?: string;
    invitationId?: string;
    guestName?: string;
  };

  if (!phone || !message) {
    return NextResponse.json({ error: "missing_fields" }, { status: 422 });
  }

  const result = await sendWhatsAppMessage(phone, message);

  if (result.success && invitationId) {
    resilientStore.recordEvent({
      invitation_id: invitationId,
      event_type: "WHATSAPP_DISPATCHED",
      session_id: result.messageId || "wa-direct",
    });

    try {
      await recordAdminAudit({
        actor,
        action: "INVITATION_UPDATED",
        resourceType: "invitation",
        resourceId: invitationId,
        metadata: {
          channel: "whatsapp_bot",
          phone,
          guestName,
          messageId: result.messageId,
        },
      });
    } catch {}
  }

  return NextResponse.json(result);
}
