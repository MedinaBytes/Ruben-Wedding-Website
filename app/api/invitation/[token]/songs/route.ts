import { NextResponse } from "next/server";

import {
  consumeInvitationRateLimit,
  findActiveInvitation,
  recordInvitationEvent,
} from "@/lib/invitations/store";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { invalidOriginResponse, isJsonRequest, isSameOriginMutation, privateApiHeaders } from "@/lib/security/request";
import { spotifySongSubmissionSchema } from "@/lib/validation/guest";
import {
  addSpotifyTrackToPlaylist,
  getSpotifyPlaylistConfig,
  getSpotifyPlaylistTrackIds,
  getSpotifyTrack,
  SpotifyUnavailableError,
} from "@/lib/spotify/api";
import { z } from "zod";

const privateHeaders = privateApiHeaders();
const reservationResultSchema = z.object({
  trackId: z.string().regex(/^[A-Za-z0-9]{22}$/),
  status: z.enum(["reserved", "already_in_playlist", "already_submitted", "maximum_reached", "busy"]),
  reservationId: z.string().uuid().nullable().optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;

  try {
    const client = createSupabaseAdminClient();
    const invitation = await findActiveInvitation(client, token);
    if (!invitation) {
      return NextResponse.json({ error: "not_found" }, { status: 404, headers: privateHeaders });
    }

    const { data, error } = await client
      .from("song_requests")
      .select("song_title, artist, spotify_url, spotify_track_id, album_artwork_url, playlist_status, slot")
      .eq("invitation_id", invitation.id)
      .order("slot");

    if (error) throw new Error("Song request lookup failed.");

    return NextResponse.json(
      {
        requests: (data ?? []).map((request) => ({
          title: request.song_title,
          artist: request.artist,
          spotifyUrl: request.spotify_url,
          trackId: request.spotify_track_id,
          artworkUrl: request.album_artwork_url,
          status: request.playlist_status,
        })),
      },
      { headers: privateHeaders },
    );
  } catch {
    return NextResponse.json({ error: "service_unavailable" }, { status: 503, headers: privateHeaders });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  if (!isSameOriginMutation(request)) return invalidOriginResponse();
  if (!isJsonRequest(request)) {
    return NextResponse.json({ error: "invalid_content_type" }, { status: 415, headers: privateHeaders });
  }

  const { token } = await context.params;

  try {
    const client = createSupabaseAdminClient();
    const invitation = await findActiveInvitation(client, token);
    if (!invitation) {
      return NextResponse.json({ error: "not_found" }, { status: 404, headers: privateHeaders });
    }

    const isAllowed = await consumeInvitationRateLimit(client, invitation.id, "songs", 5, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: privateHeaders });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "invalid_request" }, { status: 400, headers: privateHeaders });
    }

    const result = spotifySongSubmissionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "invalid_request" }, { status: 422, headers: privateHeaders });
    }

    const playlist = getSpotifyPlaylistConfig();
    if (!playlist) throw new SpotifyUnavailableError();

    const tracks = await Promise.all(result.data.trackIds.map(getSpotifyTrack));
    const existingTrackIds = await getSpotifyPlaylistTrackIds(playlist.id);
    const results: Array<{ trackId: string; title: string; artist: string; status: string }> = [];

    for (const track of tracks) {
      const { data, error } = await client.rpc("reserve_spotify_song_request", {
        p_invitation_id: invitation.id,
        p_track: track,
        p_existing_track_ids: existingTrackIds.has(track.id) ? [track.id] : [],
      });
      if (error) throw new Error("Spotify song reservation failed.");

      const reservation = reservationResultSchema.safeParse(data);
      if (!reservation.success) throw new Error("Spotify song reservation response was invalid.");
      let status: string = reservation.data.status;

      if (status === "reserved") {
        const reservationId = reservation.data.reservationId;
        if (!reservationId) throw new Error("Spotify reservation identifier was missing.");

        try {
          await addSpotifyTrackToPlaylist(playlist.id, track.id);
        } catch {
          await client.rpc("release_spotify_song_request", {
            p_invitation_id: invitation.id,
            p_track_id: track.id,
            p_reservation_id: reservationId,
          });
          status = "failed";
        }

        if (status === "reserved") {
          const { data: completed, error: completionError } = await client.rpc("complete_spotify_song_request", {
            p_invitation_id: invitation.id,
            p_track_id: track.id,
            p_reservation_id: reservationId,
          });
          if (completionError || completed !== true) throw new Error("Spotify song completion failed.");
          status = "added";
        }
      }

      results.push({ trackId: track.id, title: track.title, artist: track.artist, status });
    }

    if (results.some((item) => item.status === "added" || item.status === "already_in_playlist")) {
      await recordInvitationEvent(client, {
        invitationId: invitation.id,
        eventType: "SONG_REQUESTED",
        locale: result.data.language,
      }).catch(() => undefined);
    }

    if (results.every((item) => item.status === "failed" || item.status === "busy")) {
      return NextResponse.json({ error: "spotify_unavailable", results }, { status: 503, headers: privateHeaders });
    }

    return NextResponse.json({ results }, { headers: privateHeaders });
  } catch (error) {
    const code = error instanceof SpotifyUnavailableError ? "spotify_unavailable" : "service_unavailable";
    return NextResponse.json({ error: code }, { status: 503, headers: privateHeaders });
  }
}
