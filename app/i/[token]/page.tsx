import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";

import { InvitationIntro } from "@/components/invitation/invitation-intro";
import { InviteOpenTracker } from "@/components/invitation/invite-open-tracker";
import { OrchidBranch } from "@/components/invitation/orchid-branch";
import { SiteHeader } from "@/components/invitation/site-header";
import { WeddingPhoto } from "@/components/invitation/wedding-photo";
import { WeddingSections } from "@/components/invitation/wedding-sections";
import { findActiveInvitationByToken } from "@/lib/invitations/store";
import { getWeddingDateLabel } from "@/lib/event-time";
import { weddingConfig, type Locale } from "@/lib/wedding-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let invitation;

  try {
    invitation = await findActiveInvitationByToken(token);
  } catch {
    notFound();
  }

  if (!invitation) notFound();

  const requestLocale = await getLocale();
  const locale = (invitation.language ?? requestLocale) as Locale;
  const [messages, navigation, hero, intro, wedding] = await Promise.all([
    getMessages({ locale }),
    getTranslations({ locale, namespace: "navigation" }),
    getTranslations({ locale, namespace: "hero" }),
    getTranslations({ locale, namespace: "intro" }),
    getTranslations({ locale, namespace: "wedding" }),
  ]);
  const greeting = invitation.greeting_override ?? intro("greeting", { name: invitation.display_name });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SiteHeader
        detailsLabel={navigation("details")}
        privacyLabel={navigation("privacy")}
        languageLabel={navigation("language")}
        mainNavigationLabel={navigation("main")}
      />
      <InvitationIntro
        invitationId={invitation.id}
        greeting={greeting}
        date={getWeddingDateLabel(locale, true)}
        openLabel={intro("open")}
        skipLabel={intro("skip")}
      />
      <main id="main">
        <InviteOpenTracker invitationId={invitation.id} token={token} />
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__inner">
            <div className="hero__copy">
              <p className="hero__eyebrow">{hero("eyebrow")}</p>
              <h1 className="hero__names" id="hero-title">
                {weddingConfig.couple.displayNames}
              </h1>
              <p className="hero__statement">{hero("statement")}</p>
              <p className="hero__guest-greeting">{greeting}</p>
              <p className="hero__place">{hero("place")}</p>
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
        <WeddingSections
          locale={locale}
          invitation={{
            token,
            displayName: invitation.display_name,
            maxGuests: invitation.max_guests,
            plusOneAllowed: invitation.plus_one_allowed,
            locale,
          }}
        />
      </main>
      <footer className="site-footer">
        <span>{weddingConfig.couple.displayNames}</span>
        <a href="/privacy">{navigation("privacy")}</a>
      </footer>
    </NextIntlClientProvider>
  );
}