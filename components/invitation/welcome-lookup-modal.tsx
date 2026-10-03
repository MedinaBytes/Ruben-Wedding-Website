"use client";

import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { setManualLocale } from "@/app/actions/set-locale";
import type { Locale } from "@/lib/wedding-config";

const languages: { code: Locale; label: string }[] = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "hu", label: "Magyar" },
];

export function WelcomeLookupModal({ currentLocale }: { currentLocale: Locale }) {
  const router = useRouter();
  const t = useTranslations("welcome");
  const navigation = useTranslations("navigation");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
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
      router.replace("/", { scroll: false });
    });
  }

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="invitation-intro"
      aria-labelledby="welcome-modal-title"
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

        <div className="welcome-modal__lang-selector" role="group" aria-label={navigation("language")}>
          {languages.map(({ code, label }) => (
            <button
              aria-pressed={currentLocale === code}
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

        <h2 className="welcome-modal__title" id="welcome-modal-title">{t("title")}</h2>
        <p className="welcome-modal__subtitle">{t("message")}</p>

        <div className="welcome-modal__footer">
          <button className="text-button" onClick={handleDismiss} type="button">
            {t("continue")}
          </button>
        </div>
      </motion.div>
    </dialog>
  );
}
