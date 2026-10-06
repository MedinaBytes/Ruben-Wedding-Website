import { NextResponse } from "next/server";

const privateHeaders = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

function configuredSiteOrigin() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) return null;
  const siteUrl = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `http://${raw}`;

  try {
    return new URL(siteUrl).origin;
  } catch {
    return null;
  }
}

function normalizeOrigin(originStr: string) {
  try {
    const url = new URL(originStr);
    const host = (url.hostname === "127.0.0.1" || url.hostname === "localhost") ? "localhost" : url.hostname;
    return `${url.protocol}//${host}${url.port ? `:${url.port}` : ""}`;
  } catch {
    return originStr;
  }
}

export function privateApiHeaders() {
  return privateHeaders;
}

export function invalidOriginResponse() {
  return NextResponse.json({ error: "invalid_origin" }, { status: 403, headers: privateHeaders });
}

function isKnownProductionHost(hostname: string): boolean {
  const clean = hostname.toLowerCase().split(":")[0];
  return (
    clean === "theandyrubenwedding.website" ||
    clean.endsWith(".theandyrubenwedding.website") ||
    clean.endsWith(".vercel.app")
  );
}

/**
 * Invitation tokens are bearer credentials. Mutations must also originate from this site so a
 * third-party page cannot silently alter a guest's reply with a leaked URL.
 */
export function isSameOriginMutation(request: Request) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const fetchSite = request.headers.get("sec-fetch-site");
  const requestOrigin = new URL(request.url).origin;
  const allowedOrigin = configuredSiteOrigin();
  const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");

  if (origin) {
    if (normalizeOrigin(origin) === normalizeOrigin(requestOrigin)) return true;
    if (allowedOrigin !== null && normalizeOrigin(origin) === normalizeOrigin(allowedOrigin)) return true;

    if (forwardedHost) {
      try {
        const originHost = new URL(origin).host;
        if (normalizeOrigin(`https://${originHost}`) === normalizeOrigin(`https://${forwardedHost}`)) return true;
      } catch {}
    }

    try {
      const originHostname = new URL(origin).hostname;
      if (isKnownProductionHost(originHostname)) return true;
    } catch {}
  }

  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (normalizeOrigin(refererOrigin) === normalizeOrigin(requestOrigin)) return true;
      if (allowedOrigin !== null && normalizeOrigin(refererOrigin) === normalizeOrigin(allowedOrigin)) return true;

      const refererHostname = new URL(referer).hostname;
      if (isKnownProductionHost(refererHostname)) return true;
    } catch {}
  }

  return fetchSite === "same-origin" || fetchSite === "same-site";
}

export function isJsonRequest(request: Request) {
  return request.headers.get("content-type")?.toLowerCase().startsWith("application/json") ?? false;
}
