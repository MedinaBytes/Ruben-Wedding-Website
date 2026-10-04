import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";

import { HeroPhotoMotion } from "@/components/invitation/hero-photo-motion";
import { InviteOpenTracker } from "@/components/invitation/invite-open-tracker";
import { SiteHeader } from "@/components/invitation/site-header";
import { WeddingPhoto } from "@/components/invitation/wedding-photo";
import { WeddingSections } from "@/components/invitation/wedding-sections";
import { findActiveInvitationByToken } from "@/lib/invitations/store";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWeddingDateLabel } from "@/lib/event-time";
import { SoundProvider } from "@/lib/sound";
import { supportedLocales, weddingConfig, type Locale } from "@/lib/wedding-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ruben & Andrea — Wedding Invitation",
  robots: { index: false, follow: false },
};

export default async function MainInvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ lang?: string }>;
}) {
  const [{ token }, sParams] = await Promise.all([params, searchParams]);
  let invitation;

  try {
    invitation = await findActiveInvitationByToken(token);
  } catch {
    notFound();
  }

  if (!invitation) notFound();

  const [requestLocale, cookieStore] = await Promise.all([getLocale(), cookies()]);
  const queryLocale = sParams?.lang;
  const manualLocale = cookieStore.get(`wedding_manual_locale_${invitation.id}`)?.value;
  const candidateLocale = (queryLocale && supportedLocales.includes(queryLocale as Locale))
    ? queryLocale
    : (manualLocale && supportedLocales.includes(manualLocale as Locale))
    ? manualLocale
    : (invitation.language && supportedLocales.includes(invitation.language as Locale))
    ? invitation.language
    : requestLocale;
  const locale: Locale = supportedLocales.includes(candidateLocale as Locale)
    ? (candidateLocale as Locale)
    : "en";

  if (queryLocale && queryLocale !== manualLocale) {
    try {
      cookieStore.set(`wedding_manual_locale_${invitation.id}`, locale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 183,
        sameSite: "lax",
      });
      cookieStore.set("wedding_manual_locale", locale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 183,
        sameSite: "lax",
      });
    } catch {}
  }

  // Fetch site settings for bank disclosures & private address
  let siteSettings = undefined;
  try {
    const supabase = createSupabaseAdminClient();
    const { data: settingsRows } = await supabase.from("site_settings").select("key, value");
    if (settingsRows) {
      const s = new Map(settingsRows.map((r) => [r.key, r.value]));
      siteSettings = {
        showGiftDetails: Boolean(s.get("showGiftDetails")),
        bankName: s.get("bankName") ? String(s.get("bankName")) : undefined,
        accountHolder: s.get("accountHolder") ? String(s.get("accountHolder")) : undefined,
        iban: s.get("iban") ? String(s.get("iban")) : undefined,
        bic: s.get("bic") ? String(s.get("bic")) : undefined,
        giftNote: s.get("giftNote") ? String(s.get("giftNote")) : undefined,
        showPrivateAddress: Boolean(s.get("showPrivateAddress")),
        privateStreet: s.get("privateStreet") ? String(s.get("privateStreet")) : undefined,
        privateCity: s.get("privateCity") ? String(s.get("privateCity")) : undefined,
        privateAccessNotes: s.get("privateAccessNotes") ? String(s.get("privateAccessNotes")) : undefined,
        contactPhone: s.get("contactPhone") ? String(s.get("contactPhone")) : undefined,
        contactEmail: s.get("contactEmail") ? String(s.get("contactEmail")) : undefined,
      };
    }
  } catch {
    siteSettings = undefined;
  }

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
      <SoundProvider>
        <SiteHeader
          detailsLabel={navigation("details")}
          venuesLabel={navigation("venues")}
          storyLabel={navigation("story")}
          musicLabel={navigation("music")}
          rsvpLabel={navigation("rsvp")}
          privacyLabel={navigation("privacy")}
          languageLabel={navigation("language")}
          mainNavigationLabel={navigation("main")}
          invitation={{ id: invitation.id, token }}
          soundOnLabel={intro("soundOn")}
          soundOffLabel={intro("soundOff")}
        />
        <main id="main">
          <InviteOpenTracker invitationId={invitation.id} token={token} />

          {/* Editorial Hero Section */}
          <section className="hero" aria-labelledby="hero-title">
            <div className="hero__inner">
              <div className="hero__copy">
                <p className="hero__eyebrow">{hero("eyebrow")}</p>
                <h1 className="hero__names" id="hero-title">
                  {weddingConfig.couple.displayNames}
                </h1>
                <p className="hero__statement">{hero("statement")}</p>

                {/* Personalized Luxury Invitation Card */}
                <div className="hero__invitation-card">
                  <p className="hero__guest-greeting">{greeting}</p>
                  <p className="hero__invitation-celebrate">{intro("celebrate")}</p>
                </div>

                {/* Unified Date & City Meta Lockup (Single instance, fully localized) */}
                <div className="hero__event-meta">
                  <span className="hero__meta-date">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <time dateTime="2027-10-02">{getWeddingDateLabel(locale, true)}</time>
                  </span>
                  <span className="hero__meta-sep" aria-hidden="true">·</span>
                  <span className="hero__meta-city">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span>{hero("place")}</span>
                  </span>
                </div>

                {/* Quick Navigation Action Buttons */}
                <div className="hero__quick-actions">
                  <a href="#event-note" className="hero__action-btn hero__action-btn--primary">
                    <span>{navigation("details")}</span>
                    <span aria-hidden="true" style={{ fontSize: "0.9em" }}>↓</span>
                  </a>
                  <a href="#rsvp" className="hero__action-btn hero__action-btn--secondary">
                    <span>{navigation("rsvp")}</span>
                  </a>
                </div>
              </div>

              {/* Portrait Figure without redundant caption name stamping */}
              <figure className="hero__portrait">
                <HeroPhotoMotion>
                  <WeddingPhoto
                    id="formal-staircase-hero"
                    alt={wedding("photos.formalStaircasePortrait")}
                    sizes="(max-width: 760px) 100vw, 50vw"
                    preload
                    className="hero__image"
                  />
                </HeroPhotoMotion>
              </figure>
            </div>
          </section>

          {/* Full Wedding Sections Suite */}
          <WeddingSections
            locale={locale}
            siteSettings={siteSettings}
            invitation={{
              id: invitation.id,
              token,
              displayName: invitation.display_name,
              maxGuests: invitation.max_guests,
              plusOneAllowed: invitation.plus_one_allowed,
              locale,
              personalMessage: invitation.personal_message,
            }}
          />
        </main>
        <footer className="site-footer">
          <span>{weddingConfig.couple.displayNames}</span>
          <a href="/privacy">{navigation("privacy")}</a>
        </footer>
      </SoundProvider>
    </NextIntlClientProvider>
  );
}
