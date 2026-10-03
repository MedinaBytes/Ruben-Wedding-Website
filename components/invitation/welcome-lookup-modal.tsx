"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { lookupInvitation } from "@/app/actions/lookup-invitation";
import { setManualLocale } from "@/app/actions/set-locale";
import type { Locale } from "@/lib/wedding-config";

const languages: { code: Locale; label: string }[] = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
];

export function WelcomeLookupModal({ currentLocale }: { currentLocale: Locale }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "found" | "not_found" | "error">("idle");
  const [foundName, setFoundName] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    try {
      const seen = sessionStorage.getItem("wedding_welcome_seen");
      if (!seen) {
        setIsOpen(true);
      }
    } catch {
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && dialog && !dialog.open) {
      dialog.showModal();
    }
  }, [isOpen]);

  function handleDismiss() {
    try {
      sessionStorage.setItem("wedding_welcome_seen", "true");
    } catch {}
    setIsOpen(false);
    dialogRef.current?.close();
  }

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
      try {
        sessionStorage.setItem("wedding_welcome_seen", "true");
      } catch {}
      setTimeout(() => {
        router.push(result.url);
      }, 1200);
    } else {
      setStatus("not_found");
    }
  }

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="invitation-intro"
      aria-label="Welcome & Invitation Lookup"
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          handleDismiss();
        }
      }}
      onCancel={(e) => {
        e.preventDefault();
        handleDismiss();
      }}
    >
      <motion.div
        className="invitation-intro__paper welcome-modal__paper"
        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <span aria-hidden="true" className="invitation-intro__edition">
          Ruben & Andrea · 02 · 10 · 2027
        </span>
        <span aria-hidden="true" className="invitation-intro__ornament">
          R <span>&</span> A
        </span>

        {/* Language Selection */}
        <div className="welcome-modal__lang-selector" role="group" aria-label="Select Language">
          {languages.map(({ code, label }) => (
            <button
              key={code}
              type="button"
              className={`welcome-modal__lang-btn ${currentLocale === code ? "is-active" : ""}`}
              onClick={() => handleLanguageChange(code)}
              disabled={isPending}
            >
              {label}
            </button>
          ))}
        </div>

        <h2 className="welcome-modal__title">
          {currentLocale === "es"
            ? "Encuentra tu Invitación"
            : currentLocale === "de"
            ? "Finde deine Einladung"
            : "Find Your Invitation"}
        </h2>

        <p className="welcome-modal__subtitle">
          {currentLocale === "es"
            ? "Ingresa tu nombre o apellido para abrir tu invitación personalizada:"
            : currentLocale === "de"
            ? "Gib deinen Namen ein, um deine persönliche Einladung zu öffnen:"
            : "Enter your full name or family name to open your personalized invitation:"}
        </p>

        <form onSubmit={handleSearch} className="welcome-modal__form">
          <div className="field-group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                currentLocale === "es"
                  ? "Ej. Juan Pérez o Familia Rodríguez"
                  : currentLocale === "de"
                  ? "z. B. Max Mustermann"
                  : "e.g. John Doe or Garcia Family"
              }
              className="welcome-modal__input"
              autoFocus
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
              ? "Buscar Invitación"
              : currentLocale === "de"
              ? "Einladung öffnen"
              : "Search Invitation"}
          </button>
        </form>

        {status === "found" && (
          <div className="welcome-modal__message is-success" role="status">
            ✓{" "}
            {currentLocale === "es"
              ? `¡Invitación encontrada para ${foundName}! Abriendo...`
              : currentLocale === "de"
              ? `Einladung für ${foundName} gefunden! Öffne...`
              : `Invitation found for ${foundName}! Opening...`}
          </div>
        )}

        {status === "not_found" && (
          <div className="welcome-modal__message is-error" role="alert">
            {currentLocale === "es"
              ? "No encontramos una invitación con ese nombre. Prueba con tu nombre completo o explora la web."
              : currentLocale === "de"
              ? "Keine Einladung unter diesem Namen gefunden. Bitte überprüfe die Schreibweise."
              : "No invitation found matching that name. Try your full name or continue below."}
          </div>
        )}

        <div className="welcome-modal__footer">
          <button
            type="button"
            className="text-button text-button--quiet"
            onClick={handleDismiss}
          >
            {currentLocale === "es"
              ? "Continuar a los detalles generales →"
              : currentLocale === "de"
              ? "Weiter zu den Hochzeitsdetails →"
              : "Continue to Wedding Details →"}
          </button>
        </div>
      </motion.div>
    </dialog>
  );
}
