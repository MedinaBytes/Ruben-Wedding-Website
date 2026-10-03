"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { setManualLocale } from "@/app/actions/set-locale";
import { supportedLocales, type Locale } from "@/lib/wedding-config";

const localeLabels: Record<Locale, string> = {
  en: "English",
  es: "Español",
  de: "Deutsch",
  hu: "Magyar",
};

const localeCodes: Record<Locale, string> = {
  en: "EN",
  es: "ES",
  de: "DE",
  hu: "HU",
};

export function LanguageSwitcher({ label }: { label: string }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function selectLocale(nextLocale: Locale) {
    await setManualLocale(nextLocale);
    startTransition(() => router.refresh());
  }

  return (
    <div className="language-switcher" role="group" aria-label={label}>
      {supportedLocales.map((option) => (
        <button
          aria-current={locale === option ? "true" : undefined}
          aria-label={localeLabels[option]}
          className="language-switcher__option"
          disabled={isPending || locale === option}
          key={option}
          onClick={() => void selectLocale(option)}
          type="button"
        >
          {localeCodes[option]}
        </button>
      ))}
    </div>
  );
}