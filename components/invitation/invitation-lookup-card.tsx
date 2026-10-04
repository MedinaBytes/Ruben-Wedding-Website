"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";

import { issueInvitationUrl, lookupInvitation } from "@/app/actions/lookup-invitation";
import { setManualLocale } from "@/app/actions/set-locale";
import { InvitationIntro } from "@/components/invitation/invitation-intro";
import { getWeddingDateLabel } from "@/lib/event-time";
import type { Locale } from "@/lib/wedding-config";
import type { LookupResult } from "@/app/actions/lookup-invitation";

const languages: { code: Locale; label: string; hint: string }[] = [
  { code: "en", label: "English", hint: "EN" },
  { code: "es", label: "Español", hint: "ES" },
  { code: "de-AT", label: "Deutsch (Österreich)", hint: "DE" },
  { code: "hu", label: "Magyar", hint: "HU" },
];

type Stage = "language" | "identify" | "confirm" | "animation";
type Status = "idle" | "loading" | "invalid" | "not_found" | "rate_limited" | "error";
type MatchedInvitation = Extract<LookupResult, { success: true }>;

const steps = ["language", "identify", "confirm"] as const;

function GateOrnament() {
  return (
    <svg aria-hidden="true" className="gate-card__ornament" fill="none" viewBox="0 0 120 24">
      <path d="M2 12h44" stroke="currentColor" strokeLinecap="round" strokeWidth="0.75" />
      <path d="M74 12h44" stroke="currentColor" strokeLinecap="round" strokeWidth="0.75" />
      <path
        d="M60 3c3.5 3.2 5.2 6.2 5.2 9s-1.7 5.8-5.2 9c-3.5-3.2-5.2-6.2-5.2-9S56.5 6.2 60 3Z"
        stroke="currentColor"
        strokeWidth="0.75"
      />
      <circle cx="50" cy="12" fill="currentColor" r="1.1" />
      <circle cx="70" cy="12" fill="currentColor" r="1.1" />
    </svg>
  );
}

export function InvitationLookupCard({
  currentLocale,
}: {
  currentLocale: Locale;
}) {
  const router = useRouter();
  const lookupText = useTranslations("lookup");
  const gateText = useTranslations("gate");
  const introText = useTranslations("intro");
  const [stage, setStage] = useState<Stage>("language");
  const [selectedLocale, setSelectedLocale] = useState(currentLocale);
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [matchedInvitation, setMatchedInvitation] = useState<MatchedInvitation | null>(null);
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasInteracted = useRef(false);

  // Move focus to the new stage heading so screen-reader and keyboard users follow the flow.
  useEffect(() => {
    if (!hasInteracted.current || stage === "animation") return;
    headingRef.current?.focus({ preventScroll: true });
  }, [stage]);

  function goTo(next: Stage) {
    hasInteracted.current = true;
    setStage(next);
  }

  function handleLanguageSelect(locale: Locale) {
    setSelectedLocale(locale);
    setStatus("idle");
    goTo("identify");
    startTransition(async () => {
      await setManualLocale(locale);
      router.replace(`/?lang=${locale}`, { scroll: false });
    });
  }

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    if (searchQuery.trim().length < 2) {
      setStatus("invalid");
      return;
    }

    setStatus("loading");
    try {
      const result = await lookupInvitation(searchQuery, selectedLocale);
      if (!result.success) {
        setStatus(result.reason);
        return;
      }

      setStatus("idle");
      setMatchedInvitation(result);
      goTo("confirm");
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
      goTo("animation");
    } catch {
      setStatus("error");
    }
  }

  function rejectMatchedName() {
    setMatchedInvitation(null);
    setInvitationUrl(null);
    setSearchQuery("");
    setStatus("idle");
    goTo("identify");
  }

  const currentStepIndex = stage === "animation" ? steps.length : steps.indexOf(stage);
  const errorKey =
    status === "rate_limited" ? "rateLimited"
      : status === "error" ? "lookupError"
        : status === "invalid" ? "invalidInput"
          : "notFound";

  return (
    <section aria-labelledby="gate-title" className="gate" id="lookup-section">
      <div className="gate-card" data-stage={stage}>
        <GateOrnament />
        <p className="gate-card__eyebrow">{gateText("eyebrow")}</p>

        <ol aria-label={gateText("progressLabel")} className="gate-steps">
          {steps.map((step, index) => (
            <li
              aria-current={index === currentStepIndex ? "step" : undefined}
              className={`gate-steps__item${index < currentStepIndex ? " is-complete" : ""}${index === currentStepIndex ? " is-current" : ""}`}
              key={step}
            >
              <span aria-hidden="true" className="gate-steps__dot" />
              <span className="gate-steps__label">{gateText(`steps.${step}`)}</span>
            </li>
          ))}
        </ol>

        {stage === "language" && (
          <div className="gate-card__stage" key="language">
            <h1 className="gate-card__title" id="gate-title" ref={headingRef} tabIndex={-1}>
              {lookupText("languageTitle")}
            </h1>
            <p className="gate-card__desc">{lookupText("languageDescription")}</p>
            <div aria-label={lookupText("languageLabel")} className="gate-languages" role="group">
              {languages.map(({ code, label, hint }) => (
                <button
                  aria-pressed={selectedLocale === code}
                  className={`gate-language${selectedLocale === code ? " is-active" : ""}`}
                  disabled={isPending}
                  key={code}
                  lang={code}
                  onClick={() => handleLanguageSelect(code)}
                  type="button"
                >
                  <span className="gate-language__label">{label}</span>
                  <span aria-hidden="true" className="gate-language__hint">{hint}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {stage === "identify" && (
          <div className="gate-card__stage" key="identify">
            <h1 className="gate-card__title" id="gate-title" ref={headingRef} tabIndex={-1}>
              {lookupText("identifyTitle")}
            </h1>
            <p className="gate-card__desc">{lookupText("identifyDescription")}</p>
            <form className="gate-form" noValidate onSubmit={handleSearch}>
              <label className="gate-form__label" htmlFor="invitation-lookup-input">
                {lookupText("inputLabel")}
              </label>
              <input
                aria-describedby={status !== "idle" && status !== "loading" ? "gate-message" : undefined}
                aria-invalid={status === "invalid" || status === "not_found" ? true : undefined}
                autoCapitalize="words"
                autoComplete="name"
                autoFocus
                className="gate-form__input"
                enterKeyHint="search"
                id="invitation-lookup-input"
                maxLength={100}
                minLength={2}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  if (status !== "loading") setStatus("idle");
                }}
                placeholder={lookupText("inputPlaceholder")}
                required
                spellCheck={false}
                type="text"
                value={searchQuery}
              />
              <button
                className="gate-button"
                disabled={status === "loading" || isPending || !searchQuery.trim()}
                type="submit"
              >
                {status === "loading" && <span aria-hidden="true" className="gate-button__spinner" />}
                <span>{status === "loading" ? lookupText("searching") : lookupText("submit")}</span>
              </button>
            </form>
            {status !== "idle" && status !== "loading" && (
              <p className="gate-message" id="gate-message" role="alert">
                {lookupText(errorKey)}
              </p>
            )}
            <button className="gate-link" onClick={() => goTo("language")} type="button">
              <span aria-hidden="true">←</span> {lookupText("changeLanguage")}
            </button>
          </div>
        )}

        {stage === "confirm" && matchedInvitation && (
          <div className="gate-card__stage" key="confirm">
            <h1 className="gate-card__title" id="gate-title" ref={headingRef} tabIndex={-1}>
              {lookupText("confirmTitle")}
            </h1>
            <p className="gate-card__desc">{lookupText("confirmDescription")}</p>
            <p className="gate-card__name">{matchedInvitation.displayName}</p>
            <div className="gate-actions">
              <button
                className="gate-button"
                disabled={status === "loading"}
                onClick={() => void confirmInvitation()}
                type="button"
              >
                {status === "loading" && <span aria-hidden="true" className="gate-button__spinner" />}
                <span>{status === "loading" ? lookupText("opening") : lookupText("confirmYes")}</span>
              </button>
              <button
                className="gate-button gate-button--ghost"
                disabled={status === "loading"}
                onClick={rejectMatchedName}
                type="button"
              >
                {lookupText("confirmNo")}
              </button>
            </div>
            {status !== "idle" && status !== "loading" && (
              <p className="gate-message" role="alert">
                {lookupText(status === "not_found" ? "notFound" : "lookupError")}
              </p>
            )}
          </div>
        )}

        <p className="gate-card__privacy">{gateText("privacyNote")}</p>
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
