import { NextResponse } from "next/server";

import { consumeInvitationRateLimit, findActiveInvitation } from "@/lib/invitations/store";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { privateApiHeaders } from "@/lib/security/request";
import { searchSpotifyTracks } from "@/lib/spotify/api";

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

    // 1. Primary: Search Spotify Web API directly
    try {
      const tracks = await searchSpotifyTracks(query);
      if (tracks && tracks.length > 0) {
        return NextResponse.json({ tracks }, { headers: privateHeaders });
      }
    } catch (err) {
      console.error("Spotify search error:", err);
    }

    // 2. Secondary fallback: Query Apple Music / iTunes public API for real tracks, artists, and artwork
    try {
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=10`;
      const itunesRes = await fetch(itunesUrl, {
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
      });

      if (itunesRes.ok) {
        const itunesData = await itunesRes.json();
        if (Array.isArray(itunesData.results) && itunesData.results.length > 0) {
          const realTracks = (itunesData.results as Array<{ trackId?: number; trackName?: string; artistName?: string; artworkUrl100?: string }>).map((item, idx: number) => ({
            id: `track-${item.trackId || idx}`,
            title: item.trackName,
            artist: item.artistName,
            artworkUrl: item.artworkUrl100 ? item.artworkUrl100.replace("100x100bb", "300x300bb") : null,
            spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(`${item.trackName} ${item.artistName}`)}`,
          }));
          return NextResponse.json({ tracks: realTracks }, { headers: privateHeaders });
        }
      }
    } catch (err) {
      console.error("iTunes fallback search error:", err);
    }

    return NextResponse.json({ tracks: [] }, { headers: privateHeaders });
  } catch {
    return NextResponse.json({ error: "service_unavailable" }, { status: 503, headers: privateHeaders });
  }
}