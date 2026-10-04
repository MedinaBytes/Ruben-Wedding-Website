"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import type { Locale } from "@/lib/wedding-config";

type SpotifyTrack = {
  id: string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  spotifyUrl: string;
};

type SubmittedSong = SpotifyTrack & { status: string };

async function readErrorCode(response: Response) {
  const body: unknown = await response.json().catch(() => null);
  if (typeof body !== "object" || body === null || !("error" in body)) return "service_unavailable";
  return typeof body.error === "string" ? body.error : "service_unavailable";
}

function normalizeSubmittedSongs(value: unknown): SubmittedSong[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item): SubmittedSong[] => {
    if (typeof item !== "object" || item === null || !("title" in item) || typeof item.title !== "string") return [];
    const request = item as {
      title: string;
      artist?: string | null;
      trackId?: string | null;
      artworkUrl?: string | null;
      spotifyUrl?: string | null;
      status?: string;
    };
    return [{
      id: request.trackId ?? `saved-${request.title}`,
      title: request.title,
      artist: request.artist ?? "",
      artworkUrl: request.artworkUrl ?? null,
      spotifyUrl: request.spotifyUrl ?? "",
      status: request.status ?? "legacy",
    }];
  });
}

export function SpotifySongRequests({ token, playlistUrl }: { token: string; playlistUrl: string | null }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("music");
  const songFormT = useTranslations("songForm");
  const endpoint = `/api/invitation/${encodeURIComponent(token)}/songs`;
  const searchEndpoint = `/api/invitation/${encodeURIComponent(token)}/spotify/search`;
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [selected, setSelected] = useState<SpotifyTrack[]>([]);
  const [submitted, setSubmitted] = useState<SubmittedSong[]>([]);
  const [isLoadingSubmitted, setIsLoadingSubmitted] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchError, setSearchError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [manualSong, setManualSong] = useState({ title: "", artist: "", spotifyUrl: "" });
  const [manualError, setManualError] = useState("");
  const hasReachedMaximum = submitted.length + selected.length >= 3;

  useEffect(() => {
    const controller = new AbortController();

    async function loadSubmittedSongs() {
      try {
        const response = await fetch(endpoint, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("load_failed");
        const body: unknown = await response.json();
        if (typeof body !== "object" || body === null || !("requests" in body)) return;
        setSubmitted(normalizeSubmittedSongs(body.requests));
      } catch {
        if (!controller.signal.aborted) setErrorMessage(t("loadRequestsError"));
      } finally {
        if (!controller.signal.aborted) setIsLoadingSubmitted(false);
      }
    }

    void loadSubmittedSongs();
    return () => controller.abort();
  }, [endpoint, t]);

  useEffect(() => {
    const query = searchQuery.trim();
    const controller = new AbortController();

    if (query.length < 2) {
      return () => controller.abort();
    }

    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`${searchEndpoint}?q=${encodeURIComponent(query)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          const code = await readErrorCode(response);
          setSearchError(code === "rate_limited" ? t("rateLimitError") : t("spotifyUnavailable"));
          setSearchResults([]);
          return;
        }

        const body: unknown = await response.json();
        if (typeof body !== "object" || body === null || !("tracks" in body) || !Array.isArray(body.tracks)) {
          throw new Error("invalid_search_response");
        }
        setSearchResults(body.tracks as SpotifyTrack[]);
      } catch {
        if (!controller.signal.aborted) {
          setSearchError(t("spotifyUnavailable"));
          setSearchResults([]);
        }
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [searchEndpoint, searchQuery, t]);

  function addTrack(track: SpotifyTrack) {
    if (hasReachedMaximum || selected.some((item) => item.id === track.id) || submitted.some((item) => item.id === track.id)) return;
    setSelected((current) => [...current, track]);
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function refreshSubmittedSongs() {
    const response = await fetch(endpoint, { cache: "no-store" });
    if (!response.ok) return;
    const body: unknown = await response.json();
    if (typeof body !== "object" || body === null || !("requests" in body)) return;
    setSubmitted(normalizeSubmittedSongs(body.requests));
  }

  async function submitManualSong() {
    const title = manualSong.title.trim();
    const artist = manualSong.artist.trim();
    const spotifyUrl = manualSong.spotifyUrl.trim();

    if (!title) {
      setManualError(songFormT("titleLabel"));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
    setManualError("");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [{ title, artist: artist || undefined, spotifyUrl: spotifyUrl || undefined }],
          language: locale,
        }),
      });

      if (!response.ok) {
        const code = await readErrorCode(response);
        if (code === "rate_limited") setErrorMessage(t("rateLimitError"));
        else if (code === "invalid_request") setErrorMessage(songFormT("invalidUrl"));
        else setErrorMessage(t("submissionError"));
        return;
      }

      const body: unknown = await response.json();
      if (typeof body !== "object" || body === null || !("results" in body) || !Array.isArray(body.results)) {
        throw new Error("invalid_submission_response");
      }

      const nextSong: SubmittedSong = {
        id: `manual-${Date.now()}`,
        title,
        artist,
        artworkUrl: null,
        spotifyUrl: spotifyUrl || "",
        status: "submitted",
      };
      setSubmitted((current) => [...current, nextSong]);
      setManualSong({ title: "", artist: "", spotifyUrl: "" });
      setSuccessMessage(t("submissionSuccess"));
    } catch {
      setErrorMessage(t("submissionError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitSongs() {
    if (selected.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackIds: selected.map((track) => track.id), language: locale }),
      });

      if (!response.ok) {
        const code = await readErrorCode(response);
        if (code === "spotify_unavailable") setErrorMessage(t("spotifyUnavailable"));
        else if (code === "rate_limited") setErrorMessage(t("rateLimitError"));
        else if (code === "invalid_request") setErrorMessage(t("invalidSelection"));
        else setErrorMessage(t("submissionError"));
        return;
      }

      const body: unknown = await response.json();
      if (typeof body !== "object" || body === null || !("results" in body) || !Array.isArray(body.results)) {
        throw new Error("invalid_submission_response");
      }

      const results = body.results as Array<{ trackId: string; status: string }>;
      const resolvedStatuses = new Set(["added", "already_in_playlist", "already_submitted"]);
      const addedTracks = selected.filter((track) => results.some((result) => result.trackId === track.id && resolvedStatuses.has(result.status)));

      setSubmitted((current) => [
        ...current,
        ...addedTracks.map((track) => ({
          id: track.id,
          title: track.title,
          artist: track.artist,
          artworkUrl: track.artworkUrl ?? null,
          spotifyUrl: track.spotifyUrl,
          status: "added" as const,
        })),
      ]);
      setSelected((current) => current.filter((track) => !results.some((result) => result.trackId === track.id && resolvedStatuses.has(result.status))));

      try {
        await refreshSubmittedSongs();
      } catch {}

      if (results.some((result) => ["failed", "busy", "maximum_reached"].includes(result.status))) {
        setErrorMessage(results.some((result) => result.status === "maximum_reached") ? t("maximumReached") : t("partialFailure"));
      } else if (results.some((result) => result.status === "added" || result.status === "already_in_playlist")) {
        setSuccessMessage(t("submissionSuccess"));
      }
    } catch {
      setErrorMessage(t("submissionError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="song-request" aria-busy={isSubmitting || isLoadingSubmitted}>
      <form
        className="song-request__manual-form"
        onSubmit={(event) => {
          event.preventDefault();
          void submitManualSong();
        }}
      >
        <label htmlFor="song-title-input">{songFormT("titleLabel")}</label>
        <input
          id="song-title-input"
          onChange={(event) => setManualSong((current) => ({ ...current, title: event.target.value }))}
          placeholder={songFormT("titleLabel")}
          type="text"
          value={manualSong.title}
        />

        <label htmlFor="song-artist-input">{songFormT("artistLabel")}</label>
        <input
          id="song-artist-input"
          onChange={(event) => setManualSong((current) => ({ ...current, artist: event.target.value }))}
          placeholder={songFormT("artistLabel")}
          type="text"
          value={manualSong.artist}
        />

        <label htmlFor="song-link-input">{songFormT("spotifyLabel")}</label>
        <input
          id="song-link-input"
          onChange={(event) => setManualSong((current) => ({ ...current, spotifyUrl: event.target.value }))}
          placeholder="https://"
          type="url"
          value={manualSong.spotifyUrl}
        />

        <button disabled={isSubmitting || hasReachedMaximum || !manualSong.title.trim()} type="submit">
          {songFormT("addSong")}
        </button>
        {manualError && <p className="form-message form-message--error" role="alert">{manualError}</p>}
      </form>

      <div className="song-request__search">
        <label htmlFor="spotify-track-search">{t("searchLabel")}</label>
        <input
          autoComplete="off"
          disabled={hasReachedMaximum || isLoadingSubmitted}
          id="spotify-track-search"
          onChange={(event) => {
            const value = event.target.value;
            setSearchQuery(value);
            setSearchError("");
            if (value.trim().length < 2) {
              setSearchResults([]);
              setIsSearching(false);
            } else {
              setIsSearching(true);
            }
          }}
          placeholder={t("searchPlaceholder")}
          type="search"
          value={searchQuery}
        />
        <p className="song-request__count" aria-live="polite">
          {t("selectedCount", { count: submitted.length + selected.length })}
        </p>
        {hasReachedMaximum && <p className="song-request__limit" role="status">{t("maximumReached")}</p>}
        {searchError && <p className="form-message form-message--error" role="alert">{searchError}</p>}
        {isSearching && <p className="song-request__hint" role="status">{t("searching")}</p>}
        {!isSearching && searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
          <p className="song-request__hint">{t("searchMinimum")}</p>
        )}
        {!isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0 && !searchError && (
          <p className="song-request__hint" role="status">{t("noResults")}</p>
        )}
        {searchResults.length > 0 && (
          <ul className="song-request__results" aria-label={t("searchResultsLabel")}>
            {searchResults.map((track) => {
              const alreadyAdded = selected.some((item) => item.id === track.id) || submitted.some((item) => item.id === track.id);
              return (
                <li key={track.id}>
                  <button
                    className="song-request__result"
                    disabled={hasReachedMaximum || alreadyAdded || isSubmitting}
                    onClick={() => addTrack(track)}
                    type="button"
                  >
                    {track.artworkUrl ? (
                      <Image alt="" className="song-request__artwork" height={52} src={track.artworkUrl} unoptimized width={52} />
                    ) : <span aria-hidden="true" className="song-request__artwork song-request__artwork--empty" />}
                    <span className="song-request__track-copy">
                      <strong>{track.title}</strong>
                      <span>{track.artist}</span>
                    </span>
                    <span className="song-request__add-label">{alreadyAdded ? t("alreadyAdded") : t("addTrack")}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <section className="song-request__selection" aria-labelledby="selected-songs-title">
        <h4 id="selected-songs-title">{t("selectedTitle")}</h4>
        {selected.length === 0 && !isLoadingSubmitted && <p className="song-request__hint">{t("emptySelection")}</p>}
        <ul className="song-request__selected">
          {selected.map((track) => (
            <li className="song-request__selected-item" key={track.id}>
              {track.artworkUrl ? (
                <Image alt="" className="song-request__artwork" height={52} src={track.artworkUrl} unoptimized width={52} />
              ) : <span aria-hidden="true" className="song-request__artwork song-request__artwork--empty" />}
              <span className="song-request__track-copy">
                <strong>{track.title}</strong>
                <span>{track.artist}</span>
              </span>
              <button
                aria-label={t("removeTrack", { title: track.title })}
                className="song-request__remove"
                disabled={isSubmitting}
                onClick={() => setSelected((current) => current.filter((item) => item.id !== track.id))}
                type="button"
              >
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
        <button
          className="text-button song-request__submit"
          disabled={selected.length === 0 || isSubmitting || isLoadingSubmitted}
          onClick={() => void submitSongs()}
          type="button"
        >
          {isSubmitting ? t("addingSongs") : t("addMySongs")}
        </button>
        {errorMessage && <p className="form-message form-message--error" role="alert">{errorMessage}</p>}
        {successMessage && (
          <div className="song-request__success" role="status">
            <p>{successMessage}</p>
            {playlistUrl && <a href={playlistUrl} rel="noreferrer" target="_blank">{t("viewPlaylist")}</a>}
          </div>
        )}
      </section>

      {submitted.length > 0 && (
        <section className="song-request__submitted" aria-labelledby="submitted-songs-title">
          <h4 id="submitted-songs-title">{t("submittedTitle")}</h4>
          <ul className="song-request__selected">
            {submitted.map((track) => (
              <li className="song-request__selected-item" key={track.id}>
                {track.artworkUrl ? (
                  <Image alt="" className="song-request__artwork" height={52} src={track.artworkUrl} unoptimized width={52} />
                ) : <span aria-hidden="true" className="song-request__artwork song-request__artwork--empty" />}
                <span className="song-request__track-copy">
                  <strong>{track.title}</strong>
                  <span>{track.artist}</span>
                </span>
                <span aria-hidden="true" className="song-request__submitted-mark">✓</span>
                <span className="visually-hidden">{track.status === "already_in_playlist" ? t("alreadyInPlaylist") : t("submitted")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}