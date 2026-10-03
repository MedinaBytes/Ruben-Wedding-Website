"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { setManualLocale } from "@/app/actions/set-locale";
import { recordInvitationInteraction } from "@/lib/client/invitation-events";
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function selectLocale(nextLocale: Locale) {
    const cookieName = invitation ? `wedding_manual_locale_${invitation.id}` : "wedding_manual_locale";
    persistClientLocaleCookie(cookieName, nextLocale);

    if (invitation) {
      recordInvitationInteraction({
        invitationId: invitation.id,
        token: invitation.token,
        eventType: "LANGUAGE_CHANGED",
        locale: nextLocale,
      });
    }

    startTransition(async () => {
      await setManualLocale(nextLocale, invitation?.id);
      router.refresh();
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    });
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