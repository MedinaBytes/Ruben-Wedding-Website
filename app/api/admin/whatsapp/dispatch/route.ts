import { NextResponse } from "next/server";
import { getAuthenticatedAdminIdentity } from "@/lib/admin/auth";
import { isSameOriginMutation } from "@/lib/security/request";
import { normalizePhoneForWaMe } from "@/lib/whatsapp/wa-link";
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

  const { phone, message, invitationId, guestName, markDispatched } = body as {
    phone?: string;
    message?: string;
    invitationId?: string;
    guestName?: string;
    markDispatched?: boolean;
  };

  if (markDispatched && invitationId) {
    resilientStore.recordEvent({
      invitation_id: invitationId,
      event_type: "WHATSAPP_DISPATCHED",
      session_id: "wa-direct-click",
    });

    try {
      await recordAdminAudit({
        actor,
        action: "INVITATION_UPDATED",
        resourceType: "invitation",
        resourceId: invitationId,
        metadata: {
          channel: "whatsapp_direct_click",
          phone: phone ?? null,
          guestName: guestName ?? null,
        },
      });
    } catch {}

    return NextResponse.json({ success: true, marked: true });
  }

  if (!phone || !message) {
    return NextResponse.json({ error: "missing_fields" }, { status: 422 });
  }

  const cleanPhone = normalizePhoneForWaMe(phone);
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  if (invitationId) {
    resilientStore.recordEvent({
      invitation_id: invitationId,
      event_type: "WHATSAPP_DISPATCHED",
      session_id: "wa-click-to-chat",
    });

    try {
      await recordAdminAudit({
        actor,
        action: "INVITATION_UPDATED",
        resourceType: "invitation",
        resourceId: invitationId,
        metadata: {
          channel: "whatsapp_wa_me",
          phone: cleanPhone,
          guestName: guestName ?? null,
        },
      });
    } catch {}
  }

  return NextResponse.json({
    success: true,
    url: waUrl,
    mode: "click_to_chat",
    message: "Direct WhatsApp click-to-chat link created successfully",
  });
}
