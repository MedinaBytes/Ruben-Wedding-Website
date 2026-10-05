import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import type { Locale } from "@/lib/wedding-config";
import { resolveLocale } from "@/lib/wedding-config";

const messageLoaders = {
  en: () => import("@/locales/en/common.json"),
  es: () => import("@/locales/es/common.json"),
  "de-AT": () => import("@/locales/de/common.json"),
  hu: () => import("@/locales/hu/common.json"),
} satisfies Record<Locale, () => Promise<{ default: unknown }>>;

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedRaw = await requestLocale;
  const requested = resolveLocale(requestedRaw);
  if (requested) {
    return {
      locale: requested,
      messages: (await messageLoaders[requested]()).default,
    };
  }

  const [cookieStore, headerStore] = await Promise.all([
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

  const locale = manualLocale
    ?? resolveLocale(refererLang)
    ?? browserLocale
    ?? "en";

  return {
    locale,
    messages: (await messageLoaders[locale]()).default,
  };
});