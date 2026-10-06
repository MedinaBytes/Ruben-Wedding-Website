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

type SubmittedSong = SpotifyTrack & {
  slot?: number;
  status: string;
};

async function readErrorCode(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  if (typeof body !== "object" || body === null || !("error" in body)) return "service_unavailable";
  return typeof body.error === "string" ? body.error : "service_unavailable";
}

function normalizeSubmittedSongs(value: unknown): SubmittedSong[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item, idx): SubmittedSong[] => {
    if (typeof item !== "object" || item === null || !("title" in item) || typeof item.title !== "string") return [];
    const request = item as {
      id?: string | null;
      slot?: number | null;
      title: string;
      artist?: string | null;
      trackId?: string | null;
      artworkUrl?: string | null;
      spotifyUrl?: string | null;
      status?: string;
    };
    return [
      {
        id: request.id ?? request.trackId ?? `saved-${idx + 1}-${request.title}`,
        slot: request.slot ?? idx + 1,
        title: request.title,
        artist: request.artist ?? "",
        artworkUrl: request.artworkUrl ?? null,
        spotifyUrl: request.spotifyUrl ?? "",
        status: request.status ?? "added",
      },
    ];
  });
}

export function SpotifySongRequests({ token, playlistUrl }: { token: string; playlistUrl: string | null }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("music");
  const songFormT = useTranslations("songForm");
  const endpoint = `/api/invitation/${encodeURIComponent(token)}/songs`;
  const searchEndpoint = `/api/invitation/${encodeURIComponent(token)}/spotify/search`;

  const [submitted, setSubmitted] = useState<SubmittedSong[]>([]);
  const [isLoadingSubmitted, setIsLoadingSubmitted] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [savingTrackId, setSavingTrackId] = useState<string | null>(null);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [searchError, setSearchError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [manualSong, setManualSong] = useState({ title: "", artist: "", spotifyUrl: "" });
  const [manualError, setManualError] = useState("");
  const [entryMode, setEntryMode] = useState<"search" | "manual">("search");

  const totalCount = submitted.length;
  const hasReachedMaximum = totalCount >= 3;

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

  async function addTrack(track: SpotifyTrack) {
    if (submitted.length >= 3) {
      setErrorMessage(t("maximumReached"));
      return;
    }
    const isAlreadyAdded = submitted.some(
      (item) =>
        (item.id && item.id === track.id) ||
        (item.title.toLowerCase().trim() === track.title.toLowerCase().trim() &&
          item.artist.toLowerCase().trim() === track.artist.toLowerCase().trim()),
    );
    if (isAlreadyAdded) return;

    setSavingTrackId(track.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          song: {
            title: track.title,
            artist: track.artist || undefined,
            spotifyUrl: track.spotifyUrl || undefined,
            trackId: track.id,
            artworkUrl: track.artworkUrl || undefined,
          },
          language: locale,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        if (body?.error === "maximum_reached") {
          setErrorMessage(t("maximumReached"));
        } else if (body?.error === "rate_limited") {
          setErrorMessage(t("rateLimitError"));
        } else {
          setErrorMessage(t("submissionError"));
        }
        return;
      }

      const body = (await response.json().catch(() => null)) as { song?: SubmittedSong } | null;
      const newSong: SubmittedSong = {
        id: body?.song?.id ?? track.id,
        slot: body?.song?.slot ?? submitted.length + 1,
        title: track.title,
        artist: track.artist,
        artworkUrl: track.artworkUrl,
        spotifyUrl: track.spotifyUrl,
        status: "added",
      };

      setSubmitted((current) => [...current, newSong]);
      setSearchQuery("");
      setSearchResults([]);
      setSuccessMessage(t("submissionSuccess"));
    } catch {
      setErrorMessage(t("submissionError"));
    } finally {
      setSavingTrackId(null);
    }
  }

  async function submitManualSong() {
    const title = manualSong.title.trim();
    const artist = manualSong.artist.trim();
    const spotifyUrl = manualSong.spotifyUrl.trim();

    if (!title) {
      setManualError(songFormT("titleRequired"));
      return;
    }

    if (submitted.length >= 3) {
      setErrorMessage(t("maximumReached"));
      return;
    }

    setIsSubmittingManual(true);
    setErrorMessage("");
    setSuccessMessage("");
    setManualError("");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          song: {
            title,
            artist: artist || undefined,
            spotifyUrl: spotifyUrl || undefined,
          },
          language: locale,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        if (body?.error === "maximum_reached") {
          setErrorMessage(t("maximumReached"));
        } else if (body?.error === "rate_limited") {
          setErrorMessage(t("rateLimitError"));
        } else {
          setErrorMessage(t("submissionError"));
        }
        return;
      }

      const body = (await response.json().catch(() => null)) as { song?: SubmittedSong } | null;
      const nextSong: SubmittedSong = {
        id: body?.song?.id ?? `manual-${Date.now()}`,
        slot: body?.song?.slot ?? submitted.length + 1,
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
      setIsSubmittingManual(false);
    }
  }

  async function removeSong(trackId: string) {
    setDeletingId(trackId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`${endpoint}?id=${encodeURIComponent(trackId)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setErrorMessage(t("submissionError"));
        return;
      }

      setSubmitted((current) => current.filter((s) => s.id !== trackId));
      setSuccessMessage(
        locale.startsWith("es")
          ? "Canción eliminada. Puedes añadir otra sugerencia."
          : "Song removed. You can now add another request.",
      );
    } catch {
      setErrorMessage(t("submissionError"));
    } finally {
      setDeletingId(null);
    }
  }

  const isBusy = Boolean(savingTrackId) || isSubmittingManual || Boolean(deletingId);

  return (
    <div className="song-request" aria-busy={isBusy || isLoadingSubmitted}>
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
                <span className={`song-dot ${idx < totalCount ? "is-filled" : ""}`} key={idx} />
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

        {/* Confirmed / Submitted Tracks Showcase */}
        {submitted.length > 0 && (
          <div className="song-request__showcase-section">
            <div className="song-request__section-top">
              <h4 className="song-request__section-heading">{t("submittedTitle")}</h4>
              <span className="song-request__count-badge">{submitted.length} / 3</span>
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
                    <span
                      className="song-request__check-pill"
                      title={track.status === "already_in_playlist" ? t("alreadyInPlaylist") : t("submitted")}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{t("submitted")}</span>
                    </span>
                    {track.spotifyUrl && (
                      <a
                        aria-label={t("openSpotify")}
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
                    <button
                      type="button"
                      className="song-request__delete-btn"
                      disabled={deletingId === track.id || isBusy}
                      onClick={() => void removeSong(track.id)}
                      aria-label={t("removeTrack", { title: track.title })}
                      title={t("removeTrack", { title: track.title })}
                    >
                      {deletingId === track.id ? (
                        <span style={{ fontSize: "0.75rem" }}>…</span>
                      ) : (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      )}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* When 3 songs are completed */}
        {hasReachedMaximum ? (
          <div className="song-request__max-banner">
            <span className="song-request__max-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <div style={{ flex: 1 }}>
              <strong style={{ display: "block", color: "#55644E" }}>{t("maximumReached")}</strong>
              <span style={{ fontSize: "0.85rem", color: "#544648" }}>
                {locale.startsWith("es")
                  ? "Si quieres cambiar alguna canción, pulsa la '✕' en la lista superior para eliminarla y añadir una nueva."
                  : "If you wish to change a song, click '✕' on any item above to remove it and choose another."}
              </span>
            </div>
            {playlistUrl && (
              <a href={playlistUrl} rel="noreferrer" target="_blank" className="song-request__open-playlist-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
                <span>{t("viewPlaylist")}</span>
              </a>
            )}
          </div>
        ) : (
          /* Search & Add Panel (Active whenever totalCount < 3) */
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
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
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
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  <span>{t("tabManual")}</span>
                </button>
              </div>
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
                    disabled={hasReachedMaximum || isLoadingSubmitted || isBusy}
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
                      aria-label={t("clearSearch")}
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

                {/* Live Search Results with instant 1-click Auto-Save */}
                {searchResults.length > 0 && (
                  <ul className="song-request__results-list" role="listbox">
                    {searchResults.map((track) => {
                      const isAlreadyAdded = submitted.some(
                        (item) =>
                          (item.id && item.id === track.id) ||
                          (item.title.toLowerCase().trim() === track.title.toLowerCase().trim() &&
                            item.artist.toLowerCase().trim() === track.artist.toLowerCase().trim()),
                      );
                      const isThisSaving = savingTrackId === track.id;

                      return (
                        <li className="song-request__result-item" key={track.id}>
                          {track.artworkUrl ? (
                            <Image
                              alt=""
                              className="song-request__artwork"
                              height={44}
                              src={track.artworkUrl}
                              unoptimized
                              width={44}
                            />
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
                            disabled={isAlreadyAdded || hasReachedMaximum || isBusy}
                            onClick={() => void addTrack(track)}
                            type="button"
                          >
                            {isThisSaving ? "…" : isAlreadyAdded ? t("alreadyAdded") : `+ ${t("addTrack")}`}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : (
              /* Manual Entry with instant Auto-Save */
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
                      disabled={hasReachedMaximum || isSubmittingManual || isBusy}
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
                      disabled={hasReachedMaximum || isSubmittingManual || isBusy}
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
                      disabled={hasReachedMaximum || isSubmittingManual || isBusy}
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
                  disabled={hasReachedMaximum || isSubmittingManual || isBusy || !manualSong.title.trim()}
                  type="submit"
                >
                  {isSubmittingManual ? "…" : `+ ${t("addTrack")}`}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}