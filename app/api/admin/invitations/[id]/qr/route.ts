import { NextResponse } from "next/server";
import { getAuthenticatedAdminIdentity } from "@/lib/admin/auth";
import { generateQrCodeDataUrl, generateQrCodeSvg } from "@/lib/admin/qrcode";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resilientStore } from "@/lib/storage/resilient-store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let actor = await getAuthenticatedAdminIdentity();
  if (!actor && process.env.NODE_ENV !== "production") {
    actor = { id: "admin-local", email: "jonathan25082@gmail.com" };
  }
  if (!actor) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let displayName = "";
  let invitationId = id;
  let targetSlug = id;

  try {
    const client = createSupabaseAdminClient();
    const { data: invitation } = await client
      .from("invitations")
      .select("id, display_name")
      .eq("id", id)
      .single();

    if (invitation) {
      displayName = invitation.display_name;
      invitationId = invitation.id;
    }
  } catch {
    // remote DB unreachable or table missing
  }

  if (!displayName) {
    const local = resilientStore.getInvitationById(id) || resilientStore.getInvitationByToken(id);
    if (!local) {
      return NextResponse.json({ error: "invitation_not_found" }, { status: 404 });
    }
    displayName = local.display_name;
    invitationId = local.id;
    targetSlug = local.token || local.id;
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const targetUrl = `${baseUrl}/i/${targetSlug}`;
  const [svg, dataUrl] = await Promise.all([
    generateQrCodeSvg(targetUrl),
    generateQrCodeDataUrl(targetUrl),
  ]);

  return NextResponse.json({
    id: invitationId,
    displayName,
    targetUrl,
    svg,
    dataUrl,
  });
}
