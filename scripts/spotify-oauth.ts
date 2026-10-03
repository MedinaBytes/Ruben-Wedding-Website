import { timingSafeEqual, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { loadEnvConfig } from "@next/env";
import { z } from "zod";

loadEnvConfig(process.cwd());

const tokenResponseSchema = z.object({ access_token: z.string(), refresh_token: z.string().min(1) });
const redirectUri = process.env.SPOTIFY_REDIRECT_URI ?? "http://127.0.0.1:8888/callback";
const redirect = new URL(redirectUri);
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

if (!clientId || !clientSecret) throw new Error("Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.local first.");
if (redirect.protocol !== "http:" || redirect.hostname !== "127.0.0.1" || redirect.pathname !== "/callback" || !redirect.port) {
  throw new Error("SPOTIFY_REDIRECT_URI must use http://127.0.0.1:<port>/callback.");
}

const state = randomBytes(32).toString("base64url");
const authorizationUrl = new URL("https://accounts.spotify.com/authorize");
authorizationUrl.search = new URLSearchParams({
  client_id: clientId,
  response_type: "code",
  redirect_uri: redirectUri,
  scope: "user-read-private playlist-modify-public playlist-read-private",
  state,
}).toString();

function matchesState(received: string | null) {
  if (!received) return false;
  const actual = Buffer.from(received);
  const expected = Buffer.from(state);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

async function requestRefreshToken() {
  return new Promise<string>((resolveToken, rejectToken) => {
    const server = createServer((request, response) => {
      const callback = new URL(request.url ?? "/", redirect);
      if (callback.pathname !== redirect.pathname) {
        response.writeHead(404).end("Not found");
        return;
      }

      if (!matchesState(callback.searchParams.get("state"))) {
        response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" }).end("Spotify authorization could not be verified. You may close this window.");
        finish(new Error("OAuth state validation failed."));
        return;
      }

      const authorizationError = callback.searchParams.get("error");
      const code = callback.searchParams.get("code");
      if (authorizationError || !code) {
        response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" }).end("Spotify authorization was not completed. You may close this window.");
        finish(new Error("Spotify authorization was not completed."));
        return;
      }

      void exchangeCode(code).then((refreshToken) => {
        response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" }).end("Spotify is connected. You may close this window and return to the terminal.");
        finish(undefined, refreshToken);
      }).catch((error: unknown) => {
        response.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" }).end("Spotify could not be connected. Check the terminal for details.");
        finish(error instanceof Error ? error : new Error("Spotify token exchange failed."));
      });
    });

    let settled = false;
    const timeout = setTimeout(() => finish(new Error("Spotify authorization timed out.")), 5 * 60 * 1000);

    function finish(error?: Error, refreshToken?: string) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      server.close();
      if (error) rejectToken(error);
      else if (refreshToken) resolveToken(refreshToken);
      else rejectToken(new Error("Spotify did not return a refresh token."));
    }

    server.once("error", (error) => finish(error));
    server.listen(Number(redirect.port), "127.0.0.1", () => {
      console.log("Open this URL to authorize playlist access:");
      console.log(authorizationUrl.toString());
    });
  });
}

async function exchangeCode(code: string) {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error("Spotify rejected the authorization code. Check the app redirect URI and try again.");

  const result = tokenResponseSchema.safeParse(await response.json());
  if (!result.success) throw new Error("Spotify did not return a refresh token.");
  return result.data.refresh_token;
}

async function saveRefreshToken(refreshToken: string) {
  const envPath = resolve(process.cwd(), ".env.local");
  const existing = await readFile(envPath, "utf8").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return "";
    throw error;
  });
  const tokenLine = `SPOTIFY_REFRESH_TOKEN=${refreshToken}`;
  const updated = /^SPOTIFY_REFRESH_TOKEN=.*$/m.test(existing)
    ? existing.replace(/^SPOTIFY_REFRESH_TOKEN=.*$/m, tokenLine)
    : `${existing.replace(/\s*$/, "")}${existing.trim() ? "\n" : ""}${tokenLine}\n`;
  await writeFile(envPath, updated, { encoding: "utf8", mode: 0o600 });
}

async function main() {
  const refreshToken = await requestRefreshToken();
  await saveRefreshToken(refreshToken);
  console.log("Spotify refresh token saved to ignored .env.local. Add the same value to your deployment's secret environment variables.");
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Spotify authorization failed.");
  process.exitCode = 1;
});