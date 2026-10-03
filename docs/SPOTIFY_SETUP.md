# Spotify Setup

The public playlist player and playlist editing use separate Spotify features. The player is Spotify's official iframe embed and loads when the Music section approaches the viewport. Search and playlist updates run through server-side Spotify Web API requests; guests never authorize Spotify.

## Environment

Set these server-side values in ignored `.env.local` and in the deployment's encrypted environment configuration:

```dotenv
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_PLAYLIST_ID=
SPOTIFY_REFRESH_TOKEN=
SPOTIFY_REDIRECT_URI=http://127.0.0.1:8888/callback
```

`SPOTIFY_PLAYLIST_ID` is the public wedding playlist's 22-character ID. If it is omitted, the site also accepts the existing `NEXT_PUBLIC_SPOTIFY_PLAYLIST_URL` setting and extracts its playlist ID. The public playlist ID and embed URL are not credentials. Never prefix OAuth secrets with `NEXT_PUBLIC_` or commit `.env.local`.

For an existing database, apply `supabase/migrations/20261003000400_spotify_song_requests.sql` before using search or song requests. It adds request metadata, server-only OAuth token storage for Spotify token rotation, global playlist duplicate tracking, and atomic reservation functions. For a fresh database, `supabase/schema_all.sql` includes the same tables, policies, and functions; do not apply migration `004` again after running that full snapshot.

## Spotify Developer App

1. Create a Spotify Developer app and set its redirect URI to exactly `http://127.0.0.1:8888/callback`.
2. Put the app's client ID and client secret in `.env.local`.
3. Ensure the Spotify account used for authorization owns or can edit the public wedding playlist.
4. Set `SPOTIFY_PLAYLIST_ID` to the ID from the public playlist URL.
5. Run `npm run spotify:authorize`, then open the URL printed in the terminal and approve access as the playlist editor.
6. The loopback callback verifies a random OAuth `state`, exchanges the code server-side, and writes the refresh token into ignored `.env.local`. Copy that value to `SPOTIFY_REFRESH_TOKEN` in the deployment environment.

The setup command requests `user-read-private` (required by Spotify Search), `playlist-modify-public`, and `playlist-read-private`. The server exchanges the refresh token for short-lived access tokens, retries once after an expired-token response, and never sends client secrets or access/refresh tokens to the browser. If Spotify rotates the refresh token, the replacement is stored in a row protected by RLS and service-role-only database access. Spotify documents refresh-token expiry after six months; reauthorize the app if the token expires or is revoked.

## Request Flow

- Search: `GET /api/invitation/[token]/spotify/search?q=...` validates the active opaque invitation, applies an invitation-scoped rate limit, and returns normalized Spotify track IDs, titles, artists, and album images.
- Submit: `POST /api/invitation/[token]/songs` accepts 1–3 distinct Spotify IDs. The server refetches track details, reads the playlist, and uses atomic Supabase functions to reserve the guest's remaining slots and deduplicate tracks across guests.
- Add: Each reserved track is sent to Spotify's `POST /v1/playlists/{playlist_id}/items` endpoint. Successful requests become permanent invitation slots; already-present tracks are reported without another playlist write; failed Spotify writes release their reservation so the guest can retry.
- Read back: `GET /api/invitation/[token]/songs` returns submitted tracks for the invitation. The admin dashboard continues to read the existing `song_requests` table.

The database invitation lock and the three unique request slots enforce the maximum across page refreshes and concurrent submissions. A separate global track registry prevents concurrent guests from adding the same track twice. Search traffic is limited to 20 requests per invitation per minute, and submissions use the existing invitation-scoped rate limit.

## Verification

After applying the migration and configuring Spotify:

1. Open an invitation and scroll to Music. Confirm the embed starts without a click, displays a loading state, and has an Open in Spotify fallback/action.
2. Search for a song, add it, remove it, and select up to three different tracks.
3. Submit one or more tracks. Confirm they appear in the public playlist and in the submitted list.
4. Submit an already-present playlist track and confirm the page reports that it was already there without adding a duplicate.
5. Submit three tracks, refresh, and confirm search/add remains disabled with the maximum reached message.
6. Temporarily unset the refresh token or block Spotify requests. Confirm the friendly fallback appears and selected songs remain available to retry.
7. Repeat on a 320px mobile viewport and check that the player, album artwork, search, and remove buttons fit without horizontal scrolling.

Official references: [Authorization Code Flow](https://developer.spotify.com/documentation/web-api/tutorials/code-flow), [Refreshing Tokens](https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens), [Search](https://developer.spotify.com/documentation/web-api/reference/search), [Add Items to Playlist](https://developer.spotify.com/documentation/web-api/reference/add-items-to-playlist), and [Spotify Embeds](https://developer.spotify.com/documentation/embeds).
