import "server-only";

import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const spotifyApiOrigin = "https://api.spotify.com/v1";
const trackIdPattern = /^[A-Za-z0-9]{22}$/;

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
  refresh_token: z.string().min(1).optional(),
});

const trackSchema = z.object({
  id: z.string().regex(trackIdPattern),
  name: z.string().min(1),
  artists: z.array(z.object({ name: z.string() })),
  album: z.object({ images: z.array(z.object({ url: z.string().url() })) }),
});

const playlistPageSchema = z.object({
  items: z.array(z.object({
    item: z.object({ id: z.string().nullable() }).nullable().optional(),
    track: z.object({ id: z.string().nullable() }).nullable().optional(),
  }).passthrough()),
  next: z.string().url().nullable().optional(),
}).passthrough();

export type SpotifyTrack = {
  id: string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  spotifyUrl: string;
};

export class SpotifyUnavailableError extends Error {
  constructor() {
    super("Spotify is unavailable or not configured.");
    this.name = "SpotifyUnavailableError";
  }
}

let cachedAccessToken: { value: string; expiresAt: number } | null = null;
let cachedRefreshToken: string | null = null;

async function getRefreshToken() {
  if (cachedRefreshToken) return cachedRefreshToken;
  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from("spotify_oauth_credentials")
    .select("refresh_token")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new SpotifyUnavailableError();

  cachedRefreshToken = data?.refresh_token ?? process.env.SPOTIFY_REFRESH_TOKEN ?? null;
  if (!cachedRefreshToken) throw new SpotifyUnavailableError();
  return cachedRefreshToken;
}

export function getSpotifyPlaylistConfig() {
  const configuredId = process.env.SPOTIFY_PLAYLIST_ID;
  if (configuredId) {
    if (!trackIdPattern.test(configuredId)) return null;
    return {
      id: configuredId,
      openUrl: `https://open.spotify.com/playlist/${configuredId}`,
      embedUrl: `https://open.spotify.com/embed/playlist/${configuredId}`,
    };
  }

  const configuredUrl = process.env.NEXT_PUBLIC_SPOTIFY_PLAYLIST_URL;
  if (!configuredUrl) return null;

  try {
    const url = new URL(configuredUrl);
    const [type, id] = url.pathname.split("/").filter(Boolean);
    if (url.protocol !== "https:" || url.hostname !== "open.spotify.com" || type !== "playlist" || !id || !trackIdPattern.test(id)) {
      return null;
    }
    return {
      id,
      openUrl: `https://open.spotify.com/playlist/${id}`,
      embedUrl: `https://open.spotify.com/embed/playlist/${id}`,
    };
  } catch {
    return null;
  }
}

async function refreshAccessToken(force = false) {
  if (!force && cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 30_000) {
    return cachedAccessToken.value;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new SpotifyUnavailableError();

  try {
    const refreshToken = await getRefreshToken();
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new SpotifyUnavailableError();

    const result = tokenResponseSchema.safeParse(await response.json());
    if (!result.success) throw new SpotifyUnavailableError();

    if (result.data.refresh_token && result.data.refresh_token !== refreshToken) {
      const client = createSupabaseAdminClient();
      const { error: persistError } = await client.from("spotify_oauth_credentials").upsert({
        id: 1,
        refresh_token: result.data.refresh_token,
        updated_at: new Date().toISOString(),
      });
      if (persistError) throw new SpotifyUnavailableError();
      cachedRefreshToken = result.data.refresh_token;
    }

    cachedAccessToken = {
      value: result.data.access_token,
      expiresAt: Date.now() + result.data.expires_in * 1000,
    };
    return result.data.access_token;
  } catch {
    cachedAccessToken = null;
    throw new SpotifyUnavailableError();
  }
}

async function spotifyApiFetch(path: string, init?: RequestInit) {
  const url = path.startsWith("https:") ? new URL(path) : new URL(path, spotifyApiOrigin);
  if (url.origin !== spotifyApiOrigin) throw new SpotifyUnavailableError();

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const accessToken = await refreshAccessToken(attempt > 0);
    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        headers: { ...init?.headers, Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
        signal: AbortSignal.timeout(12_000),
      });
    } catch {
      throw new SpotifyUnavailableError();
    }

    if (response.status === 401 && attempt === 0) continue;
    if (!response.ok) throw new SpotifyUnavailableError();
    return response;
  }

  throw new SpotifyUnavailableError();
}

function normalizeTrack(value: unknown): SpotifyTrack | null {
  const parsed = trackSchema.safeParse(value);
  if (!parsed.success) return null;

  const track = parsed.data;
  return {
    id: track.id,
    title: track.name,
    artist: track.artists.map((artist) => artist.name).join(", "),
    artworkUrl: track.album.images[0]?.url ?? null,
    spotifyUrl: `https://open.spotify.com/track/${track.id}`,
  };
}

export async function searchSpotifyTracks(query: string) {
  const search = new URLSearchParams({ q: query, type: "track", limit: "8", market: "AT" });
  const response = await spotifyApiFetch(`/search?${search}`);
  const body = await response.json() as { tracks?: { items?: unknown[] } };
  return (body.tracks?.items ?? []).flatMap((item) => {
    const track = normalizeTrack(item);
    return track ? [track] : [];
  });
}

export async function getSpotifyTrack(id: string) {
  if (!trackIdPattern.test(id)) throw new SpotifyUnavailableError();
  const response = await spotifyApiFetch(`/tracks/${encodeURIComponent(id)}?market=AT`);
  const track = normalizeTrack(await response.json());
  if (!track) throw new SpotifyUnavailableError();
  return track;
}

export async function getSpotifyPlaylistTrackIds(playlistId: string) {
  const ids = new Set<string>();
  const firstPage = new URL(`/playlists/${encodeURIComponent(playlistId)}/items`, spotifyApiOrigin);
  firstPage.searchParams.set("limit", "50");
  firstPage.searchParams.set("market", "AT");
  let nextUrl: string | null = firstPage.toString();

  while (nextUrl) {
    const response = await spotifyApiFetch(nextUrl);
    const page = playlistPageSchema.safeParse(await response.json());
    if (!page.success) throw new SpotifyUnavailableError();

    for (const entry of page.data.items) {
      const trackId = entry.item?.id ?? entry.track?.id;
      if (trackId && trackIdPattern.test(trackId)) ids.add(trackId);
    }

    nextUrl = page.data.next ?? null;
  }

  return ids;
}

export async function addSpotifyTrackToPlaylist(playlistId: string, trackId: string) {
  if (!trackIdPattern.test(trackId)) throw new SpotifyUnavailableError();
  await spotifyApiFetch(`/playlists/${encodeURIComponent(playlistId)}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uris: [`spotify:track:${trackId}`] }),
  });
}