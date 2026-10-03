import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const spotifyAccountsUrl = "https://accounts.spotify.com";
const spotifyApiUrl = "https://api.spotify.com/v1";
const refreshTokenSettingKey = "spotify_refresh_token";
const requiredScopes = ["playlist-read-private", "playlist-modify-public", "user-read-private"];

export type SpotifyTrack = {
  id: string;
  title: string;
  artist: string;
  album: string;
  artworkUrl: string | null;
  spotifyUrl: string;
};

export class SpotifyServiceError extends Error {
  constructor(
    public readonly code: "not_configured" | "reauthorization_required" | "forbidden" | "rate_limited" | "unavailable",
    public readonly retryAfterSeconds?: number,
  ) {
    super(code);
    this.name = "SpotifyServiceError";
  }
}

type SpotifyConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

type CachedAccessToken = {
  value: string;
  expiresAt: number;
};

type SpotifyTokenResponse = {
  access_token?: unknown;
  expires_in?: unknown;
  refresh_token?: unknown;
  scope?: unknown;
  error?: unknown;
};

let cachedAccessToken: CachedAccessToken | null = null;
let refreshInFlight: Promise<string> | null = null;
let currentRefreshToken: string | null = null;

function getSpotifyConfig(): SpotifyConfig {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new SpotifyServiceError("not_configured");
  }

  let parsedRedirectUri: URL;
  try {
    parsedRedirectUri = new URL(redirectUri);
  } catch {
    throw new SpotifyServiceError("not_configured");
  }

  const isLocalRedirect = ["localhost", "127.0.0.1"].includes(parsedRedirectUri.hostname);
  if (parsedRedirectUri.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && isLocalRedirect)) {
    throw new SpotifyServiceError("not_configured");
  }

  return { clientId, clientSecret, redirectUri: parsedRedirectUri.toString() };
}

export function getSpotifyPlaylistId() {
  const configuredId = process.env.SPOTIFY_PLAYLIST_ID?.trim();
  if (configuredId && /^[A-Za-z0-9]{22}$/.test(configuredId)) return configuredId;

  const configuredUrl = process.env.NEXT_PUBLIC_SPOTIFY_PLAYLIST_URL;
  if (!configuredUrl) return null;

  try {
    const url = new URL(configuredUrl);
    const [type, id] = url.pathname.split("/").filter(Boolean);
    return url.protocol === "https:" && url.hostname === "open.spotify.com" && type === "playlist" && /^[A-Za-z0-9]{22}$/.test(id ?? "")
      ? id
      : null;
  } catch {
    return null;
  }
}

export function getSpotifyPlaylistUrl() {
  const playlistId = getSpotifyPlaylistId();
  return playlistId ? `https://open.spotify.com/playlist/${playlistId}` : null;
}

export function createSpotifyAuthorizationUrl(state: string) {
  const config = getSpotifyConfig();
  const url = new URL("/authorize", spotifyAccountsUrl);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("scope", requiredScopes.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("show_dialog", "true");
  return url;
}

function tokenAuthorizationHeader(config: SpotifyConfig) {
  return `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`;
}

async function requestSpotifyToken(body: URLSearchParams): Promise<SpotifyTokenResponse> {
  const config = getSpotifyConfig();
  let response: Response;

  try {
    response = await fetch(`${spotifyAccountsUrl}/api/token`, {
      method: "POST",
      headers: {
        Authorization: tokenAuthorizationHeader(config),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    });
  } catch {
    throw new SpotifyServiceError("unavailable");
  }

  const data = await response.json().catch(() => null) as SpotifyTokenResponse | null;
  if (!response.ok || !data || typeof data.access_token !== "string") {
    if (data?.error === "invalid_grant") throw new SpotifyServiceError("reauthorization_required");
    throw new SpotifyServiceError("unavailable");
  }
  return data;
}

async function saveRefreshToken(refreshToken: string) {
  const client = createSupabaseAdminClient();
  const { error } = await client.from("site_settings").upsert({
    key: refreshTokenSettingKey,
    value: { refreshToken },
    updated_at: new Date().toISOString(),
  });
  if (error) throw new SpotifyServiceError("unavailable");
  currentRefreshToken = refreshToken;
}

async function getRefreshToken() {
  if (currentRefreshToken) return currentRefreshToken;

  try {
    const client = createSupabaseAdminClient();
    const { data, error } = await client
      .from("site_settings")
      .select("value")
      .eq("key", refreshTokenSettingKey)
      .maybeSingle();
    const stored = data?.value;
    if (!error && typeof stored === "object" && stored !== null && "refreshToken" in stored && typeof stored.refreshToken === "string") {
      currentRefreshToken = stored.refreshToken;
      return currentRefreshToken;
    }
  } catch {
    // An environment secret can bootstrap the connection if the settings row is not available yet.
  }

  const environmentToken = process.env.SPOTIFY_REFRESH_TOKEN;
  if (environmentToken) {
    currentRefreshToken = environmentToken;
    return environmentToken;
  }
  throw new SpotifyServiceError("reauthorization_required");
}

export async function exchangeSpotifyAuthorizationCode(code: string) {
  const config = getSpotifyConfig();
  const response = await requestSpotifyToken(new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
  }));
  const scopes = typeof response.scope === "string" ? response.scope.split(" ") : [];
  if (!requiredScopes.every((scope) => scopes.includes(scope))) {
    throw new SpotifyServiceError("forbidden");
  }
  if (typeof response.refresh_token !== "string") throw new SpotifyServiceError("unavailable");

  await saveRefreshToken(response.refresh_token);
  cachedAccessToken = {
    value: response.access_token as string,
    expiresAt: Date.now() + (typeof response.expires_in === "number" ? response.expires_in : 3600) * 1000 - 30_000,
  };
}

async function refreshSpotifyAccessToken(): Promise<string> {
  const refreshToken = await getRefreshToken();
  const response = await requestSpotifyToken(new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  }));
  if (typeof response.refresh_token === "string" && response.refresh_token !== refreshToken) {
    await saveRefreshToken(response.refresh_token);
  }
  const accessToken = response.access_token as string;
  const expiresIn = typeof response.expires_in === "number" ? response.expires_in : 3600;
  cachedAccessToken = { value: accessToken, expiresAt: Date.now() + expiresIn * 1000 - 30_000 };
  return accessToken;
}

async function getAccessToken() {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) return cachedAccessToken.value;
  if (!refreshInFlight) {
    refreshInFlight = refreshSpotifyAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function spotifyApiRequest<T>(path: string, init: RequestInit = {}, canRetry = true): Promise<T> {
  const token = await getAccessToken();
  let response: Response;

  try {
    response = await fetch(`${spotifyApiUrl}${path}`, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    throw new SpotifyServiceError("unavailable");
  }

  if (response.status === 401 && canRetry) {
    cachedAccessToken = null;
    return spotifyApiRequest<T>(path, init, false);
  }
  if (response.status === 403) throw new SpotifyServiceError("forbidden");
  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("retry-after"));
    throw new SpotifyServiceError("rate_limited", Number.isFinite(retryAfter) ? retryAfter : undefined);
  }
  if (!response.ok) throw new SpotifyServiceError("unavailable");

  return response.status === 204 ? undefined as T : await response.json() as T;
}

type SpotifyApiTrack = {
  id: string;
  name: string;
  uri: string;
  external_urls?: { spotify?: string };
  artists?: Array<{ name: string }>;
  album?: { name?: string; images?: Array<{ url: string }> };
};

function toSpotifyTrack(track: SpotifyApiTrack): SpotifyTrack {
  return {
    id: track.id,
    title: track.name,
    artist: track.artists?.map((artist) => artist.name).join(", ") ?? "",
    album: track.album?.name ?? "",
    artworkUrl: track.album?.images?.[0]?.url ?? null,
    spotifyUrl: track.external_urls?.spotify ?? `https://open.spotify.com/track/${track.id}`,
  };
}

export async function searchSpotifyTracks(query: string) {
  const params = new URLSearchParams({ q: query, type: "track", limit: "8", market: "AT" });
  const result = await spotifyApiRequest<{ tracks?: { items?: SpotifyApiTrack[] } }>(`/search?${params}`);
  return (result.tracks?.items ?? []).map(toSpotifyTrack);
}

export async function getSpotifyTrack(trackId: string) {
  const result = await spotifyApiRequest<SpotifyApiTrack>(`/tracks/${encodeURIComponent(trackId)}?market=AT`);
  return toSpotifyTrack(result);
}

export async function getWeddingPlaylistTrackIds() {
  const playlistId = getSpotifyPlaylistId();
  if (!playlistId) throw new SpotifyServiceError("not_configured");

  const trackIds = new Set<string>();
  let offset = 0;
  const limit = 50;

  while (true) {
    const params = new URLSearchParams({
      fields: "items(item(id,type)),next",
      limit: String(limit),
      offset: String(offset),
    });
    const page = await spotifyApiRequest<{
      items?: Array<{ item?: { id?: string | null; type?: string } | null }>;
      next?: string | null;
    }>(`/playlists/${encodeURIComponent(playlistId)}/items?${params}`);

    for (const entry of page.items ?? []) {
      if (entry.item?.type === "track" && entry.item.id) trackIds.add(entry.item.id);
    }
    if (!page.next) return trackIds;
    offset += limit;
  }
}

export async function addTrackToWeddingPlaylist(trackId: string) {
  const playlistId = getSpotifyPlaylistId();
  if (!playlistId) throw new SpotifyServiceError("not_configured");

  await spotifyApiRequest<void>(`/playlists/${encodeURIComponent(playlistId)}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uris: [`spotify:track:${trackId}`] }),
  });
}