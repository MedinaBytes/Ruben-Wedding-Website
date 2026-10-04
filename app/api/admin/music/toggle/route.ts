import { NextResponse } from "next/server";
import { getAuthenticatedAdminIdentity } from "@/lib/admin/auth";
import { isSameOriginMutation } from "@/lib/security/request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const actor = await getAuthenticatedAdminIdentity();
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

  const { id, selected } = body as { id: string; selected: boolean };
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 422 });
  }

  // Update in local resilient store
  const { resilientStore } = await import("@/lib/storage/resilient-store");
  resilientStore.toggleSongSelected(id, Boolean(selected));

  // Best-effort remote update
  try {
    const client = createSupabaseAdminClient();
    await client
      .from("song_requests")
      .update({ selected_for_playlist: Boolean(selected) })
      .eq("id", id);
  } catch {}

  return NextResponse.json({ success: true, id, selected: Boolean(selected) });
}
