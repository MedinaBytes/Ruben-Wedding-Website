"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { lookupInvitation } from "@/app/actions/lookup-invitation";
import { setManualLocale } from "@/app/actions/set-locale";
import type { Locale } from "@/lib/wedding-config";

const languages: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "hu", label: "Magyar" },
];

export function InvitationLookupCard({ currentLocale }: { currentLocale: Locale }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "found" | "not_found">("idle");
  const [foundName, setFoundName] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleLanguageChange(locale: Locale) {
    startTransition(async () => {
      await setManualLocale(locale);
      router.replace(`/?lang=${locale}`, { scroll: false });
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
                : currentLocale === "hu"
                  ? "Személyre szabott meghívó"
                  : "Personalized Invitation"}
          </span>
          <h2 id="lookup-title" className="lookup-card__title">
            {currentLocale === "es"
              ? "Encuentra tu Invitación"
              : currentLocale === "de"
                ? "Finde deine Einladung"
                : currentLocale === "hu"
                  ? "Találd meg a meghívód"
                  : "Find Your Invitation"}
          </h2>
          <p className="lookup-card__desc">
            {currentLocale === "es"
              ? "Ingresa tu nombre, correo o teléfono para abrir tu invitación personalizada y confirmar tu asistencia:"
              : currentLocale === "de"
                ? "Gib deinen Namen, deine E-Mail oder deine Telefonnummer ein, um deine persönliche Einladung zu öffnen und deine RSVP zu bestätigen:"
                : currentLocale === "hu"
                  ? "Írd be a neved, e-mail címed vagy telefonszámod, hogy megnyisd a személyre szabott meghívót és igazold a részvételi szándékodat:"
                  : "Enter your name, email, or phone number to open your personalized invitation and RSVP:"}
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
                  ? "Ej. Juan Pérez, juan@example.com o +34 600 123 456"
                  : currentLocale === "de"
                    ? "z. B. Max Mustermann, max@example.com oder +43 660 123 4567"
                    : currentLocale === "hu"
                      ? "pl. Kovács Anna, anna@example.com vagy +36 20 123 4567"
                      : "e.g. John Doe, john@example.com or +1 555 123 4567"
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
                  : currentLocale === "hu"
                    ? "Keresés..."
                    : "Searching..."
              : currentLocale === "es"
                ? "Abrir Invitación"
                : currentLocale === "de"
                  ? "Einladung öffnen"
                  : currentLocale === "hu"
                    ? "Meghívó megnyitása"
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
                : currentLocale === "hu"
                  ? `${foundName} meghívója megtalálva! Megnyitás...`
                  : `Invitation found for ${foundName}! Opening...`}
          </div>
        )}

        {status === "not_found" && (
          <div className="lookup-message is-error" role="alert">
            {currentLocale === "es"
              ? "No encontramos una invitación con esos datos. Comprueba el nombre, correo o teléfono y vuelve a intentarlo."
              : currentLocale === "de"
                ? "Mit diesen Angaben wurde keine Einladung gefunden. Bitte prüfe deinen Namen, deine E-Mail oder deine Telefonnummer."
                : currentLocale === "hu"
                  ? "Ezzel az adatbázissal nem találtunk meghívót. Ellenőrizd a nevet, e-mailt vagy telefonszámot, és próbáld újra."
                  : "We couldn’t find an invitation for that information. Please check the name, email, or phone number and try again."}
          </div>
        )}
      </div>
    </section>
  );
}
