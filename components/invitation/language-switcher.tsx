"use client";

import { useLocale } from "next-intl";

import { setManualLocale } from "@/app/actions/set-locale";
import { recordInvitationInteraction } from "@/lib/client/invitation-events";
import { supportedLocales, type Locale } from "@/lib/wedding-config";

const localeLabels: Record<Locale, string> = {
  en: "English",
  es: "Español",
  "de-AT": "Deutsch (Österreich)",
  hu: "Magyar",
};

const localeCodes: Record<Locale, string> = {
  en: "EN",
  es: "ES",
  "de-AT": "AT",
  hu: "HU",
};

function persistClientLocaleCookie(cookieName: string, locale: Locale) {
  if (typeof document !== "undefined") {
    document.cookie = `${cookieName}=${locale}; path=/; max-age=15811200; SameSite=Lax`;
  }
}

export function LanguageSwitcher({
  label,
  invitation,
}: {
  label: string;
  invitation?: { id: string; token: string };
}) {
  const locale = useLocale() as Locale;

  function onSelect(nextLocale: Locale) {
    const cookieName = invitation ? `wedding_manual_locale_${invitation.id}` : "wedding_manual_locale";
    persistClientLocaleCookie(cookieName, nextLocale);
    persistClientLocaleCookie("wedding_manual_locale", nextLocale);

    if (invitation) {
      recordInvitationInteraction({
        invitationId: invitation.id,
        token: invitation.token,
        eventType: "LANGUAGE_CHANGED",
        locale: nextLocale,
      });
    }

    void setManualLocale(nextLocale, invitation?.id).catch(() => {});
  }

  function handleSelect(e: React.MouseEvent<HTMLAnchorElement>, nextLocale: Locale) {
    e.preventDefault();
    onSelect(nextLocale);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("lang", nextLocale);
      window.location.href = url.toString();
    }
  }

  return (
    <div className="language-switcher" role="group" aria-label={label}>
      {supportedLocales.map((option) => (
        <a
          aria-current={locale === option ? "true" : undefined}
          aria-label={localeLabels[option]}
          className="language-switcher__option"
          href={`?lang=${option}`}
          key={option}
          onClick={(e) => handleSelect(e, option)}
          role="button"
        >
          {localeCodes[option]}
        </a>
      ))}
    </div>
  );
}