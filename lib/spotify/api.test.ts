import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getSpotifyPlaylistConfig } from "./api";

describe("Spotify API configuration & playlist parsing", () => {
  it("correctly parses open.spotify.com playlist URL", () => {
    process.env.NEXT_PUBLIC_SPOTIFY_PLAYLIST_URL = "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M";
    const config = getSpotifyPlaylistConfig();
    expect(config).not.toBeNull();
    expect(config?.id).toBe("37i9dQZF1DXcBWIGoYBM5M");
    expect(config?.embedUrl).toBe("https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M");
  });

  it("rejects invalid or non-playlist URLs", () => {
    process.env.NEXT_PUBLIC_SPOTIFY_PLAYLIST_URL = "https://malicious.example.com/playlist/bad";
    delete process.env.SPOTIFY_PLAYLIST_ID;
    const config = getSpotifyPlaylistConfig();
    expect(config).toBeNull();
  });
});
