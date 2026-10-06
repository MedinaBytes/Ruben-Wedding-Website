"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setManualLocale } from "@/app/actions/set-locale";
import { supportedLocales, type Locale } from "@/lib/wedding-config";

interface GateLanguageSwitcherProps {
  currentLocale: Locale;
  label: string;
}

const localeLabels: Record<Locale, string> = {
  en: "English",
  es: "Español",
  "de-AT": "Deutsch",
  hu: "Magyar",
};

function persistClientLocaleCookie(locale: Locale) {
  if (typeof document !== "undefined") {
    document.cookie = `wedding_manual_locale=${locale}; path=/; max-age=15811200; SameSite=Lax`;
  }
}

export function GateLanguageSwitcher({ currentLocale, label }: GateLanguageSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSelect = (loc: Locale) => {
    if (loc === currentLocale) return;

    persistClientLocaleCookie(loc);

    startTransition(async () => {
      try {
        await setManualLocale(loc);
      } catch {}
      router.push(`/?lang=${loc}`);
      router.refresh();
    });
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "0.5rem",
        alignItems: "center",
        flexWrap: "wrap",
        opacity: isPending ? 0.6 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      <span
        style={{
          fontSize: "0.72rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "#8A7D80",
          marginRight: "0.25rem",
        }}
      >
        {label}:
      </span>
      {supportedLocales.map((loc) => {
        const isSelected = loc === currentLocale;
        return (
          <button
            key={loc}
            type="button"
            onClick={() => handleSelect(loc)}
            title={localeLabels[loc]}
            style={{
              background: isSelected ? "rgba(140, 40, 54, 0.08)" : "transparent",
              border: isSelected ? "1px solid #8C2836" : "1px solid transparent",
              borderRadius: "4px",
              padding: "0.25rem 0.55rem",
              fontSize: "0.8rem",
              fontWeight: isSelected ? 700 : 500,
              color: isSelected ? "#8C2836" : "#6E6264",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {loc === "de-AT" ? "AT" : loc.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
