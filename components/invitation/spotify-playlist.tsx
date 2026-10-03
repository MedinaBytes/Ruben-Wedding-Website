"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";

import { recordInvitationInteraction } from "@/lib/client/invitation-events";
import type { Locale } from "@/lib/wedding-config";

export function SpotifyPlaylist({
  title,
  loadingLabel,
  fallback,
  openSpotifyLabel,
  embedUrl,
  openUrl,
  invitation,
}: {
  title: string;
  loadingLabel: string;
  fallback: string;
  openSpotifyLabel: string;
  embedUrl: string | null;
  openUrl: string | null;
  invitation?: { id: string; token: string };
}) {
  const locale = useLocale() as Locale;
  const playerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    if (!embedUrl || !playerRef.current) return;
    if (typeof window.IntersectionObserver === "undefined") {
      const frame = window.requestAnimationFrame(() => setShouldLoad(true));
      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShouldLoad(true);
        observer.disconnect();
      }
    }, { rootMargin: "120px 0px" });
    observer.observe(playerRef.current);
    return () => observer.disconnect();
  }, [embedUrl]);

  useEffect(() => {
    if (!shouldLoad || hasLoaded) return;
    const timeout = window.setTimeout(() => setHasFailed(true), 15_000);
    return () => window.clearTimeout(timeout);
  }, [hasLoaded, shouldLoad]);

  function handleLoad() {
    setHasLoaded(true);
    if (invitation) {
      recordInvitationInteraction({
        invitationId: invitation.id,
        token: invitation.token,
        eventType: "PLAYLIST_OPENED",
        locale,
      });
    }
  }

  return (
    <div className="spotify-player" data-state={hasFailed ? "unavailable" : hasLoaded ? "ready" : "loading"} ref={playerRef}>
      {!embedUrl ? (
        <p className="spotify-player__message">{fallback}</p>
      ) : hasFailed ? (
        <p className="spotify-player__message" role="status">{fallback}</p>
      ) : (
        <>
          {!hasLoaded && <p className="spotify-player__loading" role="status">{loadingLabel}</p>}
          {shouldLoad && (
            <iframe
              allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              className="spotify-embed"
              loading="lazy"
              onError={() => setHasFailed(true)}
              onLoad={handleLoad}
              src={embedUrl}
              title={title}
            />
          )}
        </>
      )}
      {openUrl && (
        <a className="spotify-player__open" href={openUrl} rel="noreferrer" target="_blank">
          {openSpotifyLabel}
          <span aria-hidden="true">↗</span>
        </a>
      )}
    </div>
  );
}