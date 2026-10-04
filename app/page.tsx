import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";

import { InvitationLookupCard } from "@/components/invitation/invitation-lookup-card";
import { supportedLocales, type Locale } from "@/lib/wedding-config";

export const dynamic = "force-dynamic";

// The public entry is a private gate: it must not reveal the couple, date, or venue
// before a guest has identified themselves and confirmed their invitation.
export async function generateMetadata(): Promise<Metadata> {
  const gate = await getTranslations("gate");

  return {
    title: gate("metaTitle"),
    description: gate("metaDescription"),
    robots: { index: false, follow: false },
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string }>;
} = {}) {
  const [params, requestLocale, cookieStore] = await Promise.all([
    searchParams,
    getLocale(),
    cookies(),
  ]);
  const queryLocale = params?.lang;
  const manualLocale = cookieStore.get("wedding_manual_locale")?.value;
  const locale: Locale = supportedLocales.includes(queryLocale as Locale)
    ? (queryLocale as Locale)
    : supportedLocales.includes(manualLocale as Locale)
      ? (manualLocale as Locale)
      : (requestLocale as Locale);

  const [messages, navigation, footer] = await Promise.all([
    getMessages({ locale }),
    getTranslations({ locale, namespace: "navigation" }),
    getTranslations({ locale, namespace: "footer" }),
  ]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <main className="guest-gate" id="main">
        <div aria-hidden="true" className="guest-gate__atmosphere">
          <span className="guest-gate__glow guest-gate__glow--rose" />
          <span className="guest-gate__glow guest-gate__glow--matcha" />
        </div>
        <InvitationLookupCard currentLocale={locale} />
      </main>
      <footer className="guest-gate__footer">
        <a href="/privacy">{navigation("privacy")}</a>
        <span aria-hidden="true">·</span>
        <a
          className="site-footer__credit"
          href="https://www.sevensides.technology/"
          rel="noreferrer"
          target="_blank"
        >
          {footer.rich("credit", {
            heart: (children) => (
              <>
                <span aria-hidden="true" className="site-footer__heart">♥</span>
                <span className="visually-hidden">{children}</span>
              </>
            ),
          })}
        </a>
      </footer>
    </NextIntlClientProvider>
  );
}