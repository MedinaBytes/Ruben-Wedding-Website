import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  addSingleSongRequest,
  consumeInvitationRateLimit,
  deleteSongRequest,
  DEMO_INVITATION,
  findActiveInvitationByToken,
  recordInvitationEvent,
} from "@/lib/invitations/store";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { invalidOriginResponse, isJsonRequest, isSameOriginMutation, privateApiHeaders } from "@/lib/security/request";
import {
  isManualSongRequestPayload,
  isSingleSongSubmissionPayload,
  isSpotifySongSubmissionPayload,
  singleSongSubmissionSchema,
  songRequestPayloadSchema,
  spotifySongSubmissionSchema,
} from "@/lib/validation/guest";
import {
  addSpotifyTrackToPlaylist,
  getSpotifyPlaylistConfig,
  getSpotifyTrack,
} from "@/lib/spotify/api";
import { resilientStore } from "@/lib/storage/resilient-store";

const privateHeaders = privateApiHeaders();

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

    // 1. Demo invitation always resolves from local resilient store
    if (invitation.id === DEMO_INVITATION.id) {
      const local = resilientStore.getSongRequests(invitation.id);
      return NextResponse.json(
        {
          requests: local.map((req) => ({
            id: req.id ?? `req-${req.slot}`,
            slot: req.slot,
            title: req.song_title,
            artist: req.artist ?? "",
            spotifyUrl: req.spotify_url ?? "",
            trackId: req.spotify_track_id ?? req.id ?? `req-${req.slot}`,
            artworkUrl: req.album_artwork_url ?? null,
            status: "added",
          })),
        },
        { headers: privateHeaders },
      );
    }

    // 2. Real guest: try Supabase first
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("song_requests")
          .select("id, song_title, artist, spotify_url, spotify_track_id, album_artwork_url, playlist_status, slot")
          .eq("invitation_id", invitation.id)
          .order("slot");

        if (!error && data && data.length > 0) {
          return NextResponse.json(
            {
              requests: data.map((request) => ({
                id: String(request.id),
                slot: request.slot,
                title: request.song_title,
                artist: request.artist ?? "",
                spotifyUrl: request.spotify_url ?? "",
                trackId: request.spotify_track_id ?? String(request.id),
                artworkUrl: request.album_artwork_url ?? null,
                status: request.playlist_status,
              })),
            },
            { headers: privateHeaders },
          );
        }
      } catch {}
    }

    // 3. Fallback to resilient store
    const local = resilientStore.getSongRequests(invitation.id);
    return NextResponse.json(
      {
        requests: local.map((req) => ({
          id: req.id ?? `req-${req.slot}`,
          slot: req.slot,
          title: req.song_title,
          artist: req.artist ?? "",
          spotifyUrl: req.spotify_url ?? "",
          trackId: req.spotify_track_id ?? req.id ?? `req-${req.slot}`,
          artworkUrl: req.album_artwork_url ?? null,
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
      const isAllowed = await consumeInvitationRateLimit(client, invitation.id, "songs", 30, 60);
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

    const currentSongs = resilientStore.getSongRequests(invitation.id);

    // 1. Single Song Auto-Save (Realtime selection from search or manual form)
    if (isSingleSongSubmissionPayload(body)) {
      const payload = singleSongSubmissionSchema.parse(body);
      if (currentSongs.length >= 3) {
        return NextResponse.json({ error: "maximum_reached" }, { status: 409, headers: privateHeaders });
      }

      const saveResult = await addSingleSongRequest(client, invitation.id, {
        title: payload.song.title,
        artist: payload.song.artist,
        spotifyUrl: payload.song.spotifyUrl,
        trackId: payload.song.trackId,
        artworkUrl: payload.song.artworkUrl,
      });

      if (!saveResult.success) {
        return NextResponse.json({ error: saveResult.error || "failed" }, { status: 422, headers: privateHeaders });
      }

      if (client) {
        await recordInvitationEvent(client, {
          invitationId: invitation.id,
          eventType: "SONG_REQUESTED",
          locale: payload.language,
        }).catch(() => undefined);
      }

      const playlist = getSpotifyPlaylistConfig();
      if (playlist && payload.song.trackId && /^[A-Za-z0-9]{22}$/.test(payload.song.trackId)) {
        addSpotifyTrackToPlaylist(playlist.id, payload.song.trackId).catch(() => undefined);
      }

      return NextResponse.json(
        {
          success: true,
          song: {
            id: saveResult.song?.id ?? `song-${invitation.id}`,
            slot: saveResult.song?.slot ?? currentSongs.length + 1,
            title: payload.song.title,
            artist: payload.song.artist || "",
            spotifyUrl: payload.song.spotifyUrl || "",
            trackId: payload.song.trackId || null,
            artworkUrl: payload.song.artworkUrl || null,
            status: "added",
          },
        },
        { headers: privateHeaders },
      );
    }

    // 2. Manual song request payload (Multi-request)
    if (isManualSongRequestPayload(body)) {
      const payload = songRequestPayloadSchema.parse(body);
      const remainingSlots = 3 - currentSongs.length;
      if (remainingSlots <= 0) {
        return NextResponse.json({ error: "maximum_reached" }, { status: 409, headers: privateHeaders });
      }

      const requestsToAdd = payload.requests.slice(0, remainingSlots);
      const addedResults = [];

      for (const req of requestsToAdd) {
        const res = await addSingleSongRequest(client, invitation.id, {
          title: req.title,
          artist: req.artist ?? "",
          spotifyUrl: req.spotifyUrl,
        });
        if (res.success) {
          addedResults.push({
            title: req.title,
            artist: req.artist ?? "",
            status: "added",
            spotifyUrl: req.spotifyUrl ?? null,
          });
        }
      }

      if (client) {
        await recordInvitationEvent(client, {
          invitationId: invitation.id,
          eventType: "SONG_REQUESTED",
          locale: payload.language,
        }).catch(() => undefined);
      }

      return NextResponse.json({ results: addedResults }, { headers: privateHeaders });
    }

    // 3. Spotify Song Submission with trackIds
    if (isSpotifySongSubmissionPayload(body)) {
      const result = spotifySongSubmissionSchema.parse(body);
      const remainingSlots = 3 - currentSongs.length;
      if (remainingSlots <= 0) {
        return NextResponse.json({ error: "maximum_reached" }, { status: 409, headers: privateHeaders });
      }

      const playlist = getSpotifyPlaylistConfig();
      const trackIdsToProcess = result.trackIds.slice(0, remainingSlots);
      const results: Array<{ trackId: string; title: string; artist: string; status: string }> = [];

      for (const trackId of trackIdsToProcess) {
        let t: { id: string; title: string; artist: string; spotifyUrl: string; artworkUrl: string | null };
        try {
          t = await getSpotifyTrack(trackId);
        } catch {
          t = {
            id: trackId,
            title: `Song (${trackId})`,
            artist: "Guest Request",
            spotifyUrl: `https://open.spotify.com/track/${trackId}`,
            artworkUrl: null,
          };
        }

        await addSingleSongRequest(client, invitation.id, {
          title: t.title,
          artist: t.artist,
          spotifyUrl: t.spotifyUrl,
          trackId: t.id,
          artworkUrl: t.artworkUrl,
        });

        if (playlist && /^[A-Za-z0-9]{22}$/.test(trackId)) {
          addSpotifyTrackToPlaylist(playlist.id, trackId).catch(() => undefined);
        }

        results.push({ trackId: t.id, title: t.title, artist: t.artist, status: "added" });
      }

      return NextResponse.json({ results }, { headers: privateHeaders });
    }

    return NextResponse.json({ error: "invalid_request" }, { status: 422, headers: privateHeaders });
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400, headers: privateHeaders });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  if (!isSameOriginMutation(request)) return invalidOriginResponse();

  const { token } = await context.params;

  try {
    const invitation = await findActiveInvitationByToken(token);
    if (!invitation) {
      return NextResponse.json({ error: "not_found" }, { status: 404, headers: privateHeaders });
    }

    const url = new URL(request.url);
    const idFromQuery = url.searchParams.get("id");
    const slotFromQuery = url.searchParams.get("slot");

    let identifier: string | number | null = slotFromQuery
      ? Number(slotFromQuery)
      : idFromQuery;

    if (!identifier && isJsonRequest(request)) {
      try {
        const body = (await request.json()) as { id?: string; slot?: number };
        identifier = typeof body.slot === "number" ? body.slot : body.id || null;
      } catch {}
    }

    if (!identifier) {
      return NextResponse.json({ error: "missing_identifier" }, { status: 400, headers: privateHeaders });
    }

    const client = getSupabaseClient();
    await deleteSongRequest(client, invitation.id, identifier);

    return NextResponse.json({ success: true }, { headers: privateHeaders });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500, headers: privateHeaders });
  }
}
