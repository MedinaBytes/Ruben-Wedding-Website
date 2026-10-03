import { NextResponse } from "next/server";

import { consumeInvitationRateLimit, findActiveInvitation } from "@/lib/invitations/store";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { privateApiHeaders } from "@/lib/security/request";
import { getSpotifyPlaylistConfig, searchSpotifyTracks, SpotifyUnavailableError } from "@/lib/spotify/api";

const privateHeaders = privateApiHeaders();

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 100) {
    return NextResponse.json({ error: "invalid_query" }, { status: 422, headers: privateHeaders });
  }

  const { token } = await context.params;
  try {
    const client = createSupabaseAdminClient();
    const invitation = await findActiveInvitation(client, token);
    if (!invitation) {
      return NextResponse.json({ error: "not_found" }, { status: 404, headers: privateHeaders });
    }

    const isAllowed = await consumeInvitationRateLimit(client, invitation.id, "spotify_search", 20, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: privateHeaders });
    }

    if (!getSpotifyPlaylistConfig()) throw new SpotifyUnavailableError();
    const tracks = await searchSpotifyTracks(query);
    return NextResponse.json({ tracks }, { headers: privateHeaders });
  } catch {
    return NextResponse.json({ error: "spotify_unavailable" }, { status: 503, headers: privateHeaders });
  }
}