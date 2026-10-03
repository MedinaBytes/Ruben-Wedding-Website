"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { lookupInvitation } from "@/app/actions/lookup-invitation";
import { setManualLocale } from "@/app/actions/set-locale";
import type { Locale } from "@/lib/wedding-config";

const languages: { code: Locale; label: string }[] = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
];

export function InvitationLookupCard({ currentLocale }: { currentLocale: Locale }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "found" | "not_found" | "error">("idle");
  const [foundName, setFoundName] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleLanguageChange(locale: Locale) {
    startTransition(async () => {
      await setManualLocale(locale);
      router.refresh();
    });
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;

    setStatus("loading");
    const result = await lookupInvitation(searchQuery);

    if (result.success) {
      setStatus("found");
      setFoundName(result.displayName);
      setTimeout(() => {
        router.push(result.url);
      }, 1000);
    } else {
      setStatus("not_found");
    }
  }

  return (
    <section className="lookup-section" aria-labelledby="lookup-title">
      <div className="lookup-card">
        <div className="lookup-card__header">
          <span className="section-label">
            {currentLocale === "es"
              ? "Invitación personalizada"
              : currentLocale === "de"
              ? "Persönliche Einladung"
              : "Personalized Invitation"}
          </span>
          <h2 id="lookup-title" className="lookup-card__title">
            {currentLocale === "es"
              ? "Encuentra tu Invitación"
              : currentLocale === "de"
              ? "Finde deine Einladung"
              : "Find Your Invitation"}
          </h2>
          <p className="lookup-card__desc">
            {currentLocale === "es"
              ? "Ingresa tu nombre o apellido para abrir tu invitación personalizada con confirmación RSVP:"
              : currentLocale === "de"
              ? "Gib deinen Vor- oder Nachnamen ein, um deine persönliche Einladung und RSVP zu öffnen:"
              : "Enter your first or last name to access your personalized invitation and RSVP:"}
          </p>
        </div>

        {/* Quick Language Switcher */}
        <div className="lookup-card__lang-row" role="group" aria-label="Select Language">
          {languages.map(({ code, label }) => (
            <button
              key={code}
              type="button"
              className={`lookup-lang-btn ${currentLocale === code ? "is-active" : ""}`}
              onClick={() => handleLanguageChange(code)}
              disabled={isPending}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="lookup-card__form">
          <div className="field-group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                currentLocale === "es"
                  ? "Ej. Juan Pérez o Familia García"
                  : currentLocale === "de"
                  ? "z. B. Max Mustermann"
                  : "e.g. John Doe or Garcia Family"
              }
              className="lookup-card__input"
              required
            />
          </div>

          <button
            type="submit"
            className="text-button"
            disabled={status === "loading" || !searchQuery.trim()}
          >
            {status === "loading"
              ? currentLocale === "es"
                ? "Buscando..."
                : currentLocale === "de"
                ? "Suche..."
                : "Searching..."
              : currentLocale === "es"
              ? "Abrir Invitación"
              : currentLocale === "de"
              ? "Einladung öffnen"
              : "Open Invitation"}
          </button>
        </form>

        {status === "found" && (
          <div className="lookup-message is-success" role="status">
            ✓{" "}
            {currentLocale === "es"
              ? `¡Invitación encontrada para ${foundName}! Abriendo...`
              : currentLocale === "de"
              ? `Einladung für ${foundName} gefunden! Öffne...`
              : `Invitation found for ${foundName}! Opening...`}
          </div>
        )}

        {status === "not_found" && (
          <div className="lookup-message is-error" role="alert">
            {currentLocale === "es"
              ? "No encontramos una invitación con ese nombre. Por favor intenta con tu nombre completo o contacta a los novios."
              : currentLocale === "de"
              ? "Keine Einladung unter diesem Namen gefunden. Bitte versuche deinen vollständigen Namen."
              : "No invitation found matching that name. Please check spelling or explore below."}
          </div>
        )}
      </div>
    </section>
  );
}
