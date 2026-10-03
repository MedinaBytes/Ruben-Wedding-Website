import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import type { Locale } from "@/lib/wedding-config";
import { supportedLocales } from "@/lib/wedding-config";

const localeSet = new Set<string>(supportedLocales);

const messageLoaders = {
  en: () => import("@/locales/en/common.json"),
  es: () => import("@/locales/es/common.json"),
  de: () => import("@/locales/de/common.json"),
  hu: () => import("@/locales/hu/common.json"),
} satisfies Record<Locale, () => Promise<{ default: unknown }>>;

function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && localeSet.has(value);
}

export default getRequestConfig(async ({ requestLocale }) => {
  const [requestedLocale, cookieStore, headerStore] = await Promise.all([
    requestLocale,
    cookies(),
    headers(),
  ]);
  const manualLocale = cookieStore.get("wedding_manual_locale")?.value;
  const referer = headerStore.get("referer");
  let refererLang: string | undefined;
  if (referer) {
    try {
      refererLang = new URL(referer).searchParams.get("lang") ?? undefined;
    } catch {}
  }
  const browserLocales = headerStore
    .get("accept-language")
    ?.split(",")
    .map((language) => language.trim().split(/[-;]/, 1)[0]?.toLowerCase());
  const browserLocale = browserLocales?.find(isLocale);

  // The invitation route will explicitly set its stored locale before loading messages.
  const locale = isLocale(manualLocale)
    ? manualLocale
    : isLocale(refererLang)
      ? refererLang
      : isLocale(requestedLocale)
        ? requestedLocale
        : browserLocale ?? "en";

  return {
    locale,
    messages: (await messageLoaders[locale]()).default,
  };
});