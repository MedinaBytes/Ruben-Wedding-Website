import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";

import { OrchidBranch } from "@/components/invitation/orchid-branch";
import { SiteHeader } from "@/components/invitation/site-header";
import { WeddingPhoto } from "@/components/invitation/wedding-photo";
import { WeddingSections } from "@/components/invitation/wedding-sections";
import { getWeddingDateLabel } from "@/lib/event-time";
import { weddingConfig } from "@/lib/wedding-config";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [locale, messages, navigation, hero, event, wedding] = await Promise.all([
    getLocale(),
    getMessages(),
    getTranslations("navigation"),
    getTranslations("hero"),
    getTranslations("event"),
    getTranslations("wedding"),
  ]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SiteHeader
        detailsLabel={navigation("details")}
        privacyLabel={navigation("privacy")}
        languageLabel={navigation("language")}
        mainNavigationLabel={navigation("main")}
      />
      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__inner">
            <div className="hero__copy">
              <p className="hero__eyebrow">{hero("eyebrow")}</p>
              <h1 className="hero__names" id="hero-title">
                {weddingConfig.couple.displayNames}
              </h1>
              <p className="hero__statement">{hero("statement")}</p>
              <p className="hero__place">{hero("place")}</p>
              <a className="hero__link" href="#event-note">
                <span>{hero("detailsLink")}</span>
                <span aria-hidden="true">↓</span>
              </a>
            </div>
            <figure className="hero__portrait">
              <WeddingPhoto
                id="formal-staircase-hero"
                alt={wedding("photos.formalStaircasePortrait")}
                sizes="(max-width: 760px) 100vw, 53vw"
                preload
                className="hero__image"
              />
              <OrchidBranch className="hero__orchid" />
              <figcaption>{hero("portraitCaption")}</figcaption>
            </figure>
          </div>
          <p className="hero__date">
            <span>{getWeddingDateLabel(locale, true)}</span>
            <span aria-hidden="true">·</span>
            <span>{weddingConfig.event.city}</span>
          </p>
        </section>

        <section className="arrival-note" aria-labelledby="arrival-title">
          <div className="arrival-note__heading">
            <p className="section-label">{event("dayLabel")}</p>
            <h2 id="arrival-title">{event("arrivalTitle")}</h2>
          </div>
          <div className="arrival-note__times">
            <div>
              <span className="arrival-note__label">{event("pleaseArrive")}</span>
              <strong>{weddingConfig.ceremony.guestArrival}</strong>
            </div>
            <div>
              <span className="arrival-note__label">{event("ceremonyBegins")}</span>
              <strong>{weddingConfig.ceremony.time}</strong>
            </div>
          </div>
        </section>
        <WeddingSections />
      </main>
      <footer className="site-footer">
        <span>{weddingConfig.couple.displayNames}</span>
        <a href="/privacy">{navigation("privacy")}</a>
      </footer>
    </NextIntlClientProvider>
  );
}