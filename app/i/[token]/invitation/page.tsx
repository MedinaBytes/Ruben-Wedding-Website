import type { Metadata } from "next";
import Image from "next/image";
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
import { resolveLocale, weddingConfig, type Locale } from "@/lib/wedding-config";

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
  const queryLocale = resolveLocale(sParams?.lang);
  const manualLocale = resolveLocale(cookieStore.get(`wedding_manual_locale_${invitation.id}`)?.value)
    ?? resolveLocale(cookieStore.get("wedding_manual_locale")?.value);
  const locale: Locale = queryLocale
    ?? manualLocale
    ?? (token === "demo" ? undefined : resolveLocale(invitation.language))
    ?? resolveLocale(requestLocale)
    ?? "en";

  if (queryLocale && queryLocale !== manualLocale) {
    try {
      cookieStore.set(`wedding_manual_locale_${invitation.id}`, queryLocale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 183,
        sameSite: "lax",
      });
      cookieStore.set("wedding_manual_locale", queryLocale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 183,
        sameSite: "lax",
      });
    } catch {}
  }

  // Fetch site settings and feature switches
  const { resilientStore } = await import("@/lib/storage/resilient-store");
  const localSettings = resilientStore.getSettings();
  const s = new Map<string, unknown>(Object.entries(localSettings));
  try {
    const supabase = createSupabaseAdminClient();
    const { data: settingsRows } = await supabase.from("site_settings").select("key, value");
    if (settingsRows) {
      for (const row of settingsRows) {
        s.set(row.key, row.value);
      }
    }
  } catch {}

  const siteSettings = {
    showGiftDetails: Boolean(s.get("showGiftDetails")),
    enableBankTransfer: s.has("enableBankTransfer") ? Boolean(s.get("enableBankTransfer")) : true,
    bankName: s.get("bankName") ? String(s.get("bankName")) : undefined,
    accountHolder: s.get("accountHolder") ? String(s.get("accountHolder")) : undefined,
    iban: s.get("iban") ? String(s.get("iban")) : undefined,
    bic: s.get("bic") ? String(s.get("bic")) : undefined,
    giftNote: s.get("giftNote") ? String(s.get("giftNote")) : undefined,
    enableRevolut: s.has("enableRevolut") ? Boolean(s.get("enableRevolut")) : true,
    revolutTag: s.get("revolutTag") ? String(s.get("revolutTag")) : undefined,
    revolutNote: s.get("revolutNote") ? String(s.get("revolutNote")) : undefined,
    enableWise: s.has("enableWise") ? Boolean(s.get("enableWise")) : true,
    wiseTag: s.get("wiseTag") ? String(s.get("wiseTag")) : undefined,
    wiseNote: s.get("wiseNote") ? String(s.get("wiseNote")) : undefined,
    enableCash: s.has("enableCash") ? Boolean(s.get("enableCash")) : true,
    cashNote: s.get("cashNote") ? String(s.get("cashNote")) : undefined,
    showPrivateAddress: Boolean(s.get("showPrivateAddress")),
    privateStreet: s.get("privateStreet") ? String(s.get("privateStreet")) : undefined,
    privateCity: s.get("privateCity") ? String(s.get("privateCity")) : undefined,
    privateAccessNotes: s.get("privateAccessNotes") ? String(s.get("privateAccessNotes")) : undefined,
    contactPhone: s.get("contactPhone") ? String(s.get("contactPhone")) : undefined,
    contactEmail: s.get("contactEmail") ? String(s.get("contactEmail")) : undefined,
    enableCalendarSync: s.has("enableCalendarSync") ? Boolean(s.get("enableCalendarSync")) : true,
    enableEnvelopeCalligraphy: s.has("enableEnvelopeCalligraphy") ? Boolean(s.get("enableEnvelopeCalligraphy")) : true,
    enableMealSelection: s.has("enableMealSelection") ? Boolean(s.get("enableMealSelection")) : true,
    enableTravelConcierge: s.has("enableTravelConcierge") ? Boolean(s.get("enableTravelConcierge")) : true,
    enableDayOfTimeline: s.has("enableDayOfTimeline") ? Boolean(s.get("enableDayOfTimeline")) : false,
    enableGuestbook: s.has("enableGuestbook") ? Boolean(s.get("enableGuestbook")) : false,
    enableTablePlanner: s.has("enableTablePlanner") ? Boolean(s.get("enableTablePlanner")) : true,
    enableQrCheckin: s.has("enableQrCheckin") ? Boolean(s.get("enableQrCheckin")) : false,
    enableRsvpReminders: s.has("enableRsvpReminders") ? Boolean(s.get("enableRsvpReminders")) : true,
  };

  const [messages, navigation, hero, intro, wedding] = await Promise.all([
    getMessages({ locale }),
    getTranslations({ locale, namespace: "navigation" }),
    getTranslations({ locale, namespace: "hero" }),
    getTranslations({ locale, namespace: "intro" }),
    getTranslations({ locale, namespace: "wedding" }),
  ]);

  const demoPersonalMessages: Record<Locale, string> = {
    en: "We would be absolutely thrilled to celebrate this unforgettable day in Vienna with you!",
    es: "¡Nos haría una ilusión inmensa celebrar este día tan especial e inolvidable en Viena contigo!",
    "de-AT": "Wir würden uns riesig freuen, diesen unvergesslichen Tag in Wien gemeinsam mit Dir zu feiern!",
    hu: "Végtelenül boldogok lennénk, ha velünk ünnepelnéd ezt a felejthetetlen napot Bécsben!",
  };

  const personalMessage = token === "demo"
    ? demoPersonalMessages[locale]
    : invitation.personal_message;

  const greeting = (token === "demo" ? null : invitation.greeting_override)
    ?? intro("greeting", { name: invitation.display_name });

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
                  <div className="hero__invitation-card-botanical" aria-hidden="true">
                    <Image
                      src="/orchids/orchid-spray-horizontal.webp"
                      alt=""
                      width={100}
                      height={76}
                      className="hero__invitation-card-botanical-img"
                    />
                  </div>
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
              personalMessage,
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
