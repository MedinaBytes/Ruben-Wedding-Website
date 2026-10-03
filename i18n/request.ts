import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import type { Locale } from "@/lib/wedding-config";
import { supportedLocales } from "@/lib/wedding-config";

const messageLoaders = {
  en: () => import("@/locales/en/common.json"),
  es: () => import("@/locales/es/common.json"),
  "de-AT": () => import("@/locales/de/common.json"),
  hu: () => import("@/locales/hu/common.json"),
} satisfies Record<Locale, () => Promise<{ default: unknown }>>;

function resolveLocale(value: string | undefined): Locale | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase().replaceAll("_", "-");
  if (normalized === "de" || normalized.startsWith("de-")) return "de-AT";
  const base = normalized.split("-", 1)[0];
  return supportedLocales.find((locale) => locale === base);
}

export default getRequestConfig(async ({ requestLocale }) => {
  const [requestedLocale, cookieStore, headerStore] = await Promise.all([
    requestLocale,
    cookies(),
    headers(),
  ]);
  const manualLocale = resolveLocale(cookieStore.get("wedding_manual_locale")?.value);
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
    .map((language) => resolveLocale(language.trim().split(";", 1)[0]));
  const browserLocale = browserLocales?.find((locale): locale is Locale => locale !== undefined);

  // The invitation route will explicitly set its stored locale before loading messages.
  const locale = manualLocale
    ? manualLocale
    : resolveLocale(refererLang)
      ? resolveLocale(refererLang)!
      : resolveLocale(requestedLocale)
        ? resolveLocale(requestedLocale)!
        : browserLocale ?? "en";

  return {
    locale,
    messages: (await messageLoaders[locale]()).default,
  };
});