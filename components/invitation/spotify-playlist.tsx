"use client";

import { useState } from "react";
import { useLocale } from "next-intl";

import { recordInvitationInteraction } from "@/lib/client/invitation-events";
import type { Locale } from "@/lib/wedding-config";

function getSpotifyEmbedUrl(value: string | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "open.spotify.com") return null;
    const [type, id] = url.pathname.split("/").filter(Boolean);
    if (type !== "playlist" || !id || !/^[A-Za-z0-9]+$/.test(id)) return null;
    return `https://open.spotify.com/embed/playlist/${id}`;
  } catch {
    return null;
  }
}

export function SpotifyPlaylist({
  title,
  playLabel,
  fallback,
  invitation,
}: {
  title: string;
  playLabel: string;
  fallback: string;
  invitation?: { id: string; token: string };
}) {
  const locale = useLocale() as Locale;
  const [isOpen, setIsOpen] = useState(false);
  const embedUrl = getSpotifyEmbedUrl(process.env.NEXT_PUBLIC_SPOTIFY_PLAYLIST_URL);

  if (!embedUrl) return <p className="music-note__pending">{fallback}</p>;

  return isOpen ? (
    <iframe
      allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      className="spotify-embed"
      loading="lazy"
      src={embedUrl}
      title={title}
    />
  ) : (
    <button
      className="text-button"
      onClick={() => {
        if (invitation) {
          recordInvitationInteraction({
            invitationId: invitation.id,
            token: invitation.token,
            eventType: "PLAYLIST_OPENED",
            locale,
          });
        }
        setIsOpen(true);
      }}
      type="button"
    >
      {playLabel}
    </button>
  );
}