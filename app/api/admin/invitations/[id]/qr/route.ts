import { NextResponse } from "next/server";
import { getAuthenticatedAdminIdentity } from "@/lib/admin/auth";
import { generateQrCodeDataUrl, generateQrCodeSvg } from "@/lib/admin/qrcode";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getAuthenticatedAdminIdentity();
  if (!actor) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const client = createSupabaseAdminClient();
  const { data: invitation, error } = await client
    .from("invitations")
    .select("id, display_name")
    .eq("id", id)
    .single();

  if (error || !invitation) {
    return NextResponse.json({ error: "invitation_not_found" }, { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  // Use direct invitation link using the ID or token
  // Since tokens are hashed in DB, the admin can generate QR code with the active invitation URL
  const targetUrl = `${baseUrl}/i/${id}`;
  const [svg, dataUrl] = await Promise.all([
    generateQrCodeSvg(targetUrl),
    generateQrCodeDataUrl(targetUrl),
  ]);

  return NextResponse.json({
    id: invitation.id,
    displayName: invitation.display_name,
    targetUrl,
    svg,
    dataUrl,
  });
}
