import "server-only";

import { NextResponse } from "next/server";

const privateHeaders = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

function configuredSiteOrigin() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return null;

  try {
    return new URL(siteUrl).origin;
  } catch {
    return null;
  }
}

export function privateApiHeaders() {
  return privateHeaders;
}

export function invalidOriginResponse() {
  return NextResponse.json({ error: "invalid_origin" }, { status: 403, headers: privateHeaders });
}

/**
 * Invitation tokens are bearer credentials. Mutations must also originate from this site so a
 * third-party page cannot silently alter a guest's reply with a leaked URL.
 */
export function isSameOriginMutation(request: Request) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  const requestOrigin = new URL(request.url).origin;
  const allowedOrigin = configuredSiteOrigin();

  if (origin) {
    return origin === requestOrigin || (allowedOrigin !== null && origin === allowedOrigin);
  }

  return fetchSite === "same-origin" || fetchSite === "same-site";
}

export function isJsonRequest(request: Request) {
  return request.headers.get("content-type")?.toLowerCase().startsWith("application/json") ?? false;
}
