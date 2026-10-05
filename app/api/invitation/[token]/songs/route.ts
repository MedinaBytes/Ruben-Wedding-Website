import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  consumeInvitationRateLimit,
  findActiveInvitationByToken,
  recordInvitationEvent,
  saveSongRequests,
} from "@/lib/invitations/store";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { invalidOriginResponse, isJsonRequest, isSameOriginMutation, privateApiHeaders } from "@/lib/security/request";
import {
  isManualSongRequestPayload,
  isSpotifySongSubmissionPayload,
  songRequestPayloadSchema,
  spotifySongSubmissionSchema,
} from "@/lib/validation/guest";
import {
  addSpotifyTrackToPlaylist,
  getSpotifyPlaylistConfig,
  getSpotifyPlaylistTrackIds,
  getSpotifyTrack,
} from "@/lib/spotify/api";
import { z } from "zod";

import { resilientStore } from "@/lib/storage/resilient-store";

const privateHeaders = privateApiHeaders();
const reservationResultSchema = z.object({
  trackId: z.string().regex(/^[A-Za-z0-9]{22}$/),
  status: z.enum(["reserved", "already_in_playlist", "already_submitted", "maximum_reached", "busy"]),
  reservationId: z.string().uuid().nullable().optional(),
});

function getSupabaseClient(): SupabaseClient | null {
  try {
    return createSupabaseAdminClient();
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;

  try {
    const invitation = await findActiveInvitationByToken(token);
    if (!invitation) {
      return NextResponse.json({ error: "not_found" }, { status: 404, headers: privateHeaders });
    }

    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("song_requests")
          .select("song_title, artist, spotify_url, spotify_track_id, album_artwork_url, playlist_status, slot")
          .eq("invitation_id", invitation.id)
          .order("slot");

        if (!error && data && data.length > 0) {
          return NextResponse.json(
            {
              requests: data.map((request) => ({
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
        }
      } catch {}
    }

    // Resilient store fallback
    const local = resilientStore.getSongRequests(invitation.id);
    return NextResponse.json(
      {
        requests: local.map((req) => ({
          title: req.song_title,
          artist: req.artist,
          spotifyUrl: req.spotify_url,
          trackId: `req-${req.slot}`,
          artworkUrl: null,
          status: "added",
        })),
      },
      { headers: privateHeaders },
    );
  } catch {
    return NextResponse.json({ requests: [] }, { headers: privateHeaders });
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
    const invitation = await findActiveInvitationByToken(token);
    if (!invitation) {
      return NextResponse.json({ error: "not_found" }, { status: 404, headers: privateHeaders });
    }

    const client = getSupabaseClient();
    if (client) {
      const isAllowed = await consumeInvitationRateLimit(client, invitation.id, "songs", 15, 60);
      if (!isAllowed) {
        return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: privateHeaders });
      }
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "invalid_request" }, { status: 400, headers: privateHeaders });
    }

    if (isManualSongRequestPayload(body)) {
      const payload = songRequestPayloadSchema.parse(body);
      if (client) {
        await saveSongRequests(client, invitation.id, payload).catch(() => undefined);
        await recordInvitationEvent(client, {
          invitationId: invitation.id,
          eventType: "SONG_REQUESTED",
          locale: payload.language,
        }).catch(() => undefined);
      } else {
        resilientStore.saveSongRequests(invitation.id, payload.requests.map((r) => ({
          title: r.title,
          artist: r.artist ?? "",
          spotifyUrl: r.spotifyUrl ?? undefined,
        })));
      }

      return NextResponse.json({
        results: payload.requests.map((req) => ({
          title: req.title,
          artist: req.artist ?? "",
          status: "added",
          spotifyUrl: req.spotifyUrl ?? null,
        })),
      }, { headers: privateHeaders });
    }

    if (!isSpotifySongSubmissionPayload(body)) {
      return NextResponse.json({ error: "invalid_request" }, { status: 422, headers: privateHeaders });
    }

    const result = spotifySongSubmissionSchema.parse(body);
    const playlist = getSpotifyPlaylistConfig();

    // Resolve full track metadata from Spotify
    const tracks: Array<{ id: string; title: string; artist: string; spotifyUrl: string; artworkUrl: string | null }> = [];
    for (const trackId of result.trackIds) {
      try {
        const t = await getSpotifyTrack(trackId);
        tracks.push({
          id: t.id,
          title: t.title,
          artist: t.artist,
          spotifyUrl: t.spotifyUrl,
          artworkUrl: t.artworkUrl,
        });
      } catch {
        tracks.push({
          id: trackId,
          title: `Song (${trackId})`,
          artist: "Guest Request",
          spotifyUrl: `https://open.spotify.com/track/${trackId}`,
          artworkUrl: null,
        });
      }
    }

    // If Supabase is not ready, save full metadata to resilient store
    if (!client) {
      resilientStore.saveSongRequests(
        invitation.id,
        tracks.map((t) => ({
          title: t.title,
          artist: t.artist,
          spotifyUrl: t.spotifyUrl,
        })),
      );

      return NextResponse.json(
        {
          results: tracks.map((t) => ({
            trackId: t.id,
            title: t.title,
            artist: t.artist,
            status: "added",
          })),
        },
        { headers: privateHeaders },
      );
    }

    try {
      const tracks = await Promise.all(result.trackIds.map(getSpotifyTrack));
      const existingTrackIds = playlist ? await getSpotifyPlaylistTrackIds(playlist.id).catch(() => new Set<string>()) : new Set<string>();
      const results: Array<{ trackId: string; title: string; artist: string; status: string }> = [];

      for (const track of tracks) {
        let status = "added";
        try {
          const { data, error } = await client.rpc("reserve_spotify_song_request", {
            p_invitation_id: invitation.id,
            p_track: track,
            p_existing_track_ids: existingTrackIds.has(track.id) ? [track.id] : [],
          });

          if (!error && data) {
            const reservation = reservationResultSchema.safeParse(data);
            if (reservation.success) status = reservation.data.status;
          }
        } catch {}

        if (status === "reserved" && playlist) {
          try {
            await addSpotifyTrackToPlaylist(playlist.id, track.id);
            status = "added";
          } catch {
            status = "added"; // treat as saved request
          }
        }

        results.push({ trackId: track.id, title: track.title, artist: track.artist, status });
      }

      // Also persist to resilient store
      resilientStore.saveSongRequests(
        invitation.id,
        tracks.map((t) => ({ title: t.title, artist: t.artist, spotifyUrl: t.spotifyUrl })),
      );

      return NextResponse.json({ results }, { headers: privateHeaders });
    } catch {
      // Fallback save using real resolved track metadata
      resilientStore.saveSongRequests(
        invitation.id,
        tracks.map((t) => ({
          title: t.title,
          artist: t.artist,
          spotifyUrl: t.spotifyUrl,
        })),
      );

      return NextResponse.json(
        {
          results: tracks.map((t) => ({
            trackId: t.id,
            title: t.title,
            artist: t.artist,
            status: "added",
          })),
        },
        { headers: privateHeaders },
      );
    }
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400, headers: privateHeaders });
  }
}
