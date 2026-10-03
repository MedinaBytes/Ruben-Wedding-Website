"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { issueInvitationUrl, lookupInvitation } from "@/app/actions/lookup-invitation";
import { setManualLocale } from "@/app/actions/set-locale";
import { InvitationIntro } from "@/components/invitation/invitation-intro";
import { getWeddingDateLabel } from "@/lib/event-time";
import type { Locale } from "@/lib/wedding-config";
import type { LookupResult } from "@/app/actions/lookup-invitation";

const languages: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "de-AT", label: "Deutsch (Österreich)" },
  { code: "hu", label: "Magyar" },
];

type MatchedInvitation = Extract<LookupResult, { success: true }>;

export function InvitationLookupCard({
  currentLocale,
}: {
  currentLocale: Locale;
}) {
  const router = useRouter();
  const lookupText = useTranslations("lookup");
  const introText = useTranslations("intro");
  const [stage, setStage] = useState<"language" | "identify" | "confirm" | "animation">("language");
  const [selectedLocale, setSelectedLocale] = useState(currentLocale);
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "invalid" | "not_found" | "rate_limited" | "error">("idle");
  const [matchedInvitation, setMatchedInvitation] = useState<MatchedInvitation | null>(null);
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleLanguageSelect(locale: Locale) {
    setSelectedLocale(locale);
    setStage("identify");
    startTransition(async () => {
      await setManualLocale(locale);
      router.replace(`/?lang=${locale}`, { scroll: false });
    });
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim().length < 2) {
      setStatus("invalid");
      return;
    }

    setStatus("loading");
    try {
      const result = await lookupInvitation(searchQuery, selectedLocale);
      if (!result.success) {
        setStatus(result.reason === "rate_limited" ? "rate_limited" : result.reason === "invalid" ? "invalid" : result.reason);
        return;
      }

      setStatus("idle");
      setMatchedInvitation(result);
      setStage("confirm");
    } catch {
      setStatus("error");
    }
  }

  async function confirmInvitation() {
    if (!matchedInvitation) return;
    setStatus("loading");

    try {
      const result = await issueInvitationUrl();
      if (!result.success) {
        setStatus(result.reason === "not_found" ? "not_found" : "error");
        return;
      }

      const seenKey = `wedding-intro-seen:${matchedInvitation.invitationId}`;
      try {
        if (sessionStorage.getItem(seenKey) === "true") {
          router.replace(result.url);
          return;
        }
      } catch {
        // The invitation remains available if session storage is unavailable.
      }

      setInvitationUrl(result.url);
      setStatus("idle");
      setStage("animation");
    } catch {
      setStatus("error");
    }
  }

  function rejectMatchedName() {
    setMatchedInvitation(null);
    setInvitationUrl(null);
    setSearchQuery("");
    setStatus("idle");
    setStage("identify");
  }

  return (
    <section className="lookup-section" id="lookup-section" aria-labelledby="lookup-title">
      <div className="lookup-card">
        {stage === "language" ? (
          <div className="lookup-card__stage" aria-labelledby="lookup-title">
            <div className="lookup-card__header">
              <span className="section-label">{lookupText("languageTitle")}</span>
              <h2 id="lookup-title" className="lookup-card__title">{lookupText("languageDescription")}</h2>
            </div>
            <div aria-label={lookupText("languageLabel")} className="lookup-card__language-options" role="group">
              {languages.map(({ code, label }) => (
                <button
                  aria-pressed={selectedLocale === code}
                  className={`lookup-lang-btn ${selectedLocale === code ? "is-active" : ""}`}
                  disabled={isPending}
                  key={code}
                  onClick={() => handleLanguageSelect(code)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : stage === "identify" ? (
          <div className="lookup-card__stage" aria-labelledby="lookup-title">
            <div className="lookup-card__header">
              <button className="lookup-card__change-language" onClick={() => setStage("language")} type="button">
                {lookupText("changeLanguage")}
              </button>
              <span className="section-label">{languages.find(({ code }) => code === selectedLocale)?.label}</span>
              <h2 id="lookup-title" className="lookup-card__title">{lookupText("identifyTitle")}</h2>
              <p className="lookup-card__desc">{lookupText("identifyDescription")}</p>
            </div>
            <form onSubmit={handleSearch} className="lookup-card__form">
              <div className="field-group">
                <label className="visually-hidden" htmlFor="invitation-lookup-input">{lookupText("inputLabel")}</label>
                <input
                  autoComplete="name"
                  className="lookup-card__input"
                  id="invitation-lookup-input"
                  maxLength={100}
                  minLength={2}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={lookupText("inputPlaceholder")}
                  required
                  type="text"
                  value={searchQuery}
                />
              </div>
              <button className="text-button" disabled={status === "loading" || isPending || !searchQuery.trim()} type="submit">
                {status === "loading" ? lookupText("searching") : lookupText("submit")}
              </button>
            </form>
            {status !== "idle" && status !== "loading" && (
              <p className="lookup-message is-error" role="alert">
                {lookupText(status === "rate_limited" ? "rateLimited" : status === "error" ? "lookupError" : status === "invalid" ? "invalidInput" : "notFound")}
              </p>
            )}
          </div>
        ) : stage === "confirm" && matchedInvitation ? (
          <div className="lookup-card__stage" aria-labelledby="lookup-title">
            <div className="lookup-card__header">
              <span className="section-label">{lookupText("confirmLabel")}</span>
              <h2 id="lookup-title" className="lookup-card__title">{lookupText("confirmTitle")}</h2>
              <p className="lookup-card__desc">
                {lookupText("confirmDescription", { name: matchedInvitation.displayName })}
              </p>
            </div>
            <div className="lookup-card__confirm-actions">
              <button className="text-button text-button--quiet" disabled={status === "loading"} onClick={rejectMatchedName} type="button">
                {lookupText("confirmNo")}
              </button>
              <button className="text-button" disabled={status === "loading"} onClick={() => void confirmInvitation()} type="button">
                {status === "loading" ? lookupText("searching") : lookupText("confirmYes")}
              </button>
            </div>
            {status !== "idle" && status !== "loading" && (
              <p className="lookup-message is-error" role="alert">
                {lookupText(status === "not_found" ? "notFound" : "lookupError")}
              </p>
            )}
          </div>
        ) : null}
      </div>
      {stage === "animation" && matchedInvitation && invitationUrl && (
        <InvitationIntro
          date={getWeddingDateLabel(selectedLocale, true)}
          greeting={matchedInvitation.greetingOverride ?? introText("greeting", { name: matchedInvitation.displayName })}
          invitationId={matchedInvitation.invitationId}
          onComplete={() => router.replace(invitationUrl)}
          openLabel={introText("open")}
          skipLabel={introText("skip")}
          soundOffLabel={introText("soundOff")}
          soundOnLabel={introText("soundOn")}
        />
      )}
    </section>
  );
}
