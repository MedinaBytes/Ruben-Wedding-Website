import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";

import { HeroPhotoMotion } from "@/components/invitation/hero-photo-motion";
import { InvitationLookupCard } from "@/components/invitation/invitation-lookup-card";
import { SiteHeader } from "@/components/invitation/site-header";
import { WeddingPhoto } from "@/components/invitation/wedding-photo";
import { getWeddingDateLabel } from "@/lib/event-time";
import { supportedLocales, weddingConfig, type Locale } from "@/lib/wedding-config";

export const dynamic = "force-dynamic";

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

  const [messages, navigation, hero, wedding, footer] = await Promise.all([
    getMessages({ locale }),
    getTranslations({ locale, namespace: "navigation" }),
    getTranslations({ locale, namespace: "hero" }),
    getTranslations({ locale, namespace: "wedding" }),
    getTranslations({ locale, namespace: "footer" }),
  ]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SiteHeader
        detailsLabel={navigation("lookup")}
        detailsHref="#lookup-section"
        privacyLabel={navigation("privacy")}
        languageLabel={navigation("language")}
        mainNavigationLabel={navigation("main")}
        showDetailsLink={false}
        showLanguageSwitcher={false}
      />
      <main className="guest-entry" id="main">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__inner">
            <div className="hero__copy">
              <p className="hero__eyebrow">{hero("eyebrow")}</p>
              <h1 className="hero__names" id="hero-title">
                {weddingConfig.couple.displayNames}
              </h1>
              <p className="hero__statement">{hero("statement")}</p>
              <p className="hero__place">{hero("place")}</p>
              <a className="hero__link" href="#lookup-section">
                <span>{hero("detailsLink")}</span>
                <span aria-hidden="true">↓</span>
              </a>
              <InvitationLookupCard currentLocale={locale} />
            </div>
            <figure className="hero__portrait">
              <HeroPhotoMotion>
                <WeddingPhoto
                  id="formal-staircase-hero"
                  alt={wedding("photos.formalStaircasePortrait")}
                  sizes="(max-width: 760px) 100vw, 53vw"
                  preload
                  className="hero__image"
                />
              </HeroPhotoMotion>
              <figcaption>{hero("portraitCaption")}</figcaption>
            </figure>
          </div>
          <p className="hero__date">
            <span>{getWeddingDateLabel(locale, true)}</span>
            <span aria-hidden="true">·</span>
            <span>{weddingConfig.event.city}</span>
          </p>
        </section>

      </main>
      <footer className="site-footer">
        <span>{weddingConfig.couple.displayNames}</span>
        <a href="/privacy">{navigation("privacy")}</a>
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