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

  const [entryMode, setEntryMode] = useState<"search" | "manual">("search");
  const [isEditing, setIsEditing] = useState(false);
  const totalCount = submitted.length + selected.length;
  const isAllSubmitted = totalCount >= 3 && selected.length === 0;

  return (
    <div className="song-request" aria-busy={isSubmitting || isLoadingSubmitted}>
      <div className="song-request__container">
        {/* Header & Status Counter */}
        <div className="song-request__header">
          <div className="song-request__header-info">
            <h3 className="song-request__title">{t("requestsTitle")}</h3>
            <p className="song-request__subtitle">{t("requestsIntro")}</p>
          </div>
          <div className="song-request__counter-cluster">
            <div className="song-request__dots" aria-hidden="true">
              {[0, 1, 2].map((idx) => (
                <span
                  className={`song-dot ${idx < totalCount ? "is-filled" : ""}`}
                  key={idx}
                />
              ))}
            </div>
            <span className="song-request__counter-pill">
              {t("selectedCount", { count: totalCount })}
            </span>
          </div>
        </div>

        {/* Success / Error alerts */}
        {errorMessage && (
          <div className="form-message form-message--error" role="alert">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="form-message form-message--success" role="status">
            {successMessage}
          </div>
        )}

        {/* Maximum Reached Banner */}
        {hasReachedMaximum && (
          <div className="song-request__max-banner">
            <span className="song-request__max-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
            <span>{t("maximumReached")}</span>
          </div>
        )}

        {/* Confirmed / Submitted Tracks Showcase (Full Width) */}
        {submitted.length > 0 && (
          <div className="song-request__showcase-section">
            <div className="song-request__section-top">
              <h4 className="song-request__section-heading">{t("submittedTitle")}</h4>
              <span className="song-request__count-badge">{submitted.length}</span>
            </div>
            <ul className="song-request__track-list">
              {submitted.map((track) => (
                <li className="song-request__track-row is-confirmed" key={track.id}>
                  {track.artworkUrl ? (
                    <Image
                      alt=""
                      className="song-request__artwork"
                      height={48}
                      src={track.artworkUrl}
                      unoptimized
                      width={48}
                    />
                  ) : (
                    <span aria-hidden="true" className="song-request__artwork song-request__artwork--empty">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </span>
                  )}
                  <div className="song-request__track-copy">
                    <strong className="song-request__track-title">{track.title}</strong>
                    <span className="song-request__track-artist">{track.artist || "—"}</span>
                  </div>
                  <div className="song-request__confirmed-status">
                    <span className="song-request__check-pill" title={track.status === "already_in_playlist" ? t("alreadyInPlaylist") : t("submitted")}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{t("submitted")}</span>
                    </span>
                    {track.spotifyUrl && (
                      <a
                        aria-label="Open track on Spotify"
                        className="song-request__spotify-link"
                        href={track.spotifyUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Staged Tracks waiting to be submitted */}
        {selected.length > 0 && (
          <div className="song-request__staged-section">
            <div className="song-request__section-top">
              <h4 className="song-request__section-heading">{t("queueTitle")}</h4>
              <span className="song-request__count-badge">{selected.length}</span>
            </div>
            <ul className="song-request__track-list">
              {selected.map((track) => (
                <li className="song-request__track-row is-staged" key={track.id}>
                  {track.artworkUrl ? (
                    <Image
                      alt=""
                      className="song-request__artwork"
                      height={48}
                      src={track.artworkUrl}
                      unoptimized
                      width={48}
                    />
                  ) : (
                    <span aria-hidden="true" className="song-request__artwork song-request__artwork--empty">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </span>
                  )}
                  <div className="song-request__track-copy">
                    <strong className="song-request__track-title">{track.title}</strong>
                    <span className="song-request__track-artist">{track.artist || "—"}</span>
                  </div>
                  <button
                    aria-label={t("removeTrack", { title: track.title })}
                    className="song-request__delete-btn"
                    disabled={isSubmitting}
                    onClick={() => setSelected((current) => current.filter((item) => item.id !== track.id))}
                    type="button"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
            <div className="song-request__submit-bar">
              <button
                className="song-request__confirm-btn"
                disabled={selected.length === 0 || isSubmitting || isLoadingSubmitted}
                onClick={() => void submitSongs()}
                type="button"
              >
                {isSubmitting ? t("addingSongs") : t("addMySongs")}
              </button>
            </div>
          </div>
        )}

        {/* When 3 songs are submitted and user is not editing, show action footer */}
        {isAllSubmitted && !isEditing ? (
          <div className="song-request__footer-actions">
            {playlistUrl && (
              <a href={playlistUrl} rel="noreferrer" target="_blank" className="song-request__open-playlist-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
                <span>{t("viewPlaylist")}</span>
                <span aria-hidden="true">↗</span>
              </a>
            )}
            <button
              type="button"
              className="song-request__edit-toggle-btn"
              onClick={() => setIsEditing(true)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span>{t("tabSearch")}</span>
            </button>
          </div>
        ) : (
          /* Search & Add Panel (Shows when < 3 songs OR when user clicks to search/edit) */
          <div className="song-request__finder-panel">
            <div className="song-request__finder-header">
              <div className="song-request__nav" role="tablist" aria-label={t("requestsTitle")}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={entryMode === "search"}
                  className={`song-request__tab ${entryMode === "search" ? "is-active" : ""}`}
                  onClick={() => setEntryMode("search")}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span>{t("tabSearch")}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={entryMode === "manual"}
                  className={`song-request__tab ${entryMode === "manual" ? "is-active" : ""}`}
                  onClick={() => setEntryMode("manual")}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  <span>{t("tabManual")}</span>
                </button>
              </div>

              {isEditing && (
                <button
                  type="button"
                  className="song-request__close-edit-btn"
                  onClick={() => setIsEditing(false)}
                >
                  ✕
                </button>
              )}
            </div>

            {entryMode === "search" ? (
              <div className="song-request__search-body" role="tabpanel">
                <div className="song-request__search-bar">
                  <span className="song-request__search-icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
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
                    placeholder={hasReachedMaximum ? t("maximumReached") : t("searchPlaceholder")}
                    type="search"
                    value={searchQuery}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="song-request__clear-btn"
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults([]);
                        setIsSearching(false);
                      }}
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>

                {searchError && <p className="form-message form-message--error" role="alert">{searchError}</p>}
                {isSearching && <p className="song-request__hint" role="status">{t("searching")}</p>}
                {!isSearching && searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
                  <p className="song-request__hint">{t("searchMinimum")}</p>
                )}
                {!isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0 && !searchError && (
                  <p className="song-request__hint" role="status">{t("noResults")}</p>
                )}

                {/* Live Search Results */}
                {searchResults.length > 0 && (
                  <ul className="song-request__results-list" role="listbox">
                    {searchResults.map((track) => {
                      const isSelected = selected.some((item) => item.id === track.id);
                      const isSubmitted = submitted.some((item) => item.id === track.id);
                      const isUnavailable = isSelected || isSubmitted || hasReachedMaximum;

                      return (
                        <li className="song-request__result-item" key={track.id}>
                          {track.artworkUrl ? (
                            <Image alt="" className="song-request__artwork" height={44} src={track.artworkUrl} unoptimized width={44} />
                          ) : (
                            <span aria-hidden="true" className="song-request__artwork song-request__artwork--empty">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </span>
                          )}
                          <div className="song-request__track-copy">
                            <strong className="song-request__track-title">{track.title}</strong>
                            <span className="song-request__track-artist">{track.artist}</span>
                          </div>
                          <button
                            className="song-request__add-btn"
                            disabled={isUnavailable}
                            onClick={() => addTrack(track)}
                            type="button"
                          >
                            {isSelected || isSubmitted ? t("alreadyAdded") : `+ ${t("addTrack")}`}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : (
              /* Manual Entry */
              <form
                className="song-request__manual-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitManualSong();
                }}
              >
                <p className="song-request__manual-note">{t("manualNote")}</p>
                <div className="song-request__manual-fields">
                  <div className="field-group">
                    <label htmlFor="manual-song-title">{songFormT("titleLabel")}</label>
                    <input
                      autoComplete="off"
                      disabled={hasReachedMaximum || isSubmitting}
                      id="manual-song-title"
                      onChange={(event) => setManualSong((current) => ({ ...current, title: event.target.value }))}
                      placeholder={songFormT("titlePlaceholder")}
                      required
                      value={manualSong.title}
                    />
                  </div>
                  <div className="field-group">
                    <label htmlFor="manual-song-artist">{songFormT("artistLabel")}</label>
                    <input
                      autoComplete="off"
                      disabled={hasReachedMaximum || isSubmitting}
                      id="manual-song-artist"
                      onChange={(event) => setManualSong((current) => ({ ...current, artist: event.target.value }))}
                      placeholder={songFormT("artistPlaceholder")}
                      value={manualSong.artist}
                    />
                  </div>
                  <div className="field-group">
                    <label htmlFor="manual-song-url">{songFormT("spotifyUrlLabel")}</label>
                    <input
                      autoComplete="off"
                      disabled={hasReachedMaximum || isSubmitting}
                      id="manual-song-url"
                      onChange={(event) => setManualSong((current) => ({ ...current, spotifyUrl: event.target.value }))}
                      placeholder={songFormT("spotifyUrlPlaceholder")}
                      type="url"
                      value={manualSong.spotifyUrl}
                    />
                  </div>
                </div>
                {manualError && <p className="form-message form-message--error" role="alert">{manualError}</p>}
                <button
                  className="song-request__manual-submit-btn"
                  disabled={hasReachedMaximum || isSubmitting || !manualSong.title.trim()}
                  type="submit"
                >
                  {isSubmitting ? t("addingSongs") : t("addTrack")}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}