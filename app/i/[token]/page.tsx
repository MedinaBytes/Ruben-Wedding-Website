import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";

import { EnvelopeIntro } from "@/components/invitation/envelope-intro";
import { findActiveInvitationByToken } from "@/lib/invitations/store";
import { getWeddingDateLabel } from "@/lib/event-time";
import { SoundProvider } from "@/lib/sound";
import { resolveLocale, weddingConfig, type Locale } from "@/lib/wedding-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ruben & Andrea — Wedding Invitation",
  robots: { index: false, follow: false },
};

export default async function InvitationIntroPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ lang?: string }>;
}) {
  const { token } = await params;
  const sp = searchParams ? await searchParams : undefined;
  let invitation;

  try {
    invitation = await findActiveInvitationByToken(token);
  } catch {
    invitation = null;
  }

  // Elegant, generic error page if token is invalid, revoked, or non-existent
  if (!invitation) {
    return (
      <main className="guest-gate" id="main" style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: "460px", padding: "2.5rem 1.5rem" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", color: "#8C2836", display: "block", marginBottom: "1rem" }}>
            R <i>&</i> A
          </span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", color: "#2B2425", margin: "0 0 1rem 0" }}>
            Invitation Link Not Found
          </h1>
          <p style={{ color: "#6B5E60", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "1.75rem" }}>
            This invitation link is inactive, incomplete, or has expired. Please check your personal invitation message or reach out directly to Ruben &amp; Andrea.
          </p>
          <Link
            href="/"
            style={{
              display: "inline-block",
              background: "#8C2836",
              color: "#FFFFFF",
              borderRadius: "999px",
              padding: "0.65rem 1.5rem",
              textDecoration: "none",
              fontSize: "0.85rem",
              fontWeight: 500,
            }}
          >
            Return to Home
          </Link>
        </div>
      </main>
    );
  }

  const [requestLocale, cookieStore] = await Promise.all([getLocale(), cookies()]);
  const queryLocale = resolveLocale(sp?.lang);
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

  const [messages, intro] = await Promise.all([
    getMessages({ locale }),
    getTranslations({ locale, namespace: "intro" }),
  ]);

  const { resilientStore } = await import("@/lib/storage/resilient-store");
  const siteSettings = resilientStore.getSettings();
  const enableCalligraphy = siteSettings.enableEnvelopeCalligraphy !== false;

  const greeting = (token === "demo" ? null : invitation.greeting_override)
    ?? intro("greeting", { name: invitation.display_name });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SoundProvider>
        <main id="main">
          <EnvelopeIntro
            token={token}
            invitationId={invitation.id}
            currentLocale={locale}
            displayName={invitation.display_name}
            greeting={greeting}
            dateLabel={getWeddingDateLabel(locale, true)}
            cityLabel={weddingConfig.event.city}
            openPrompt={intro("open")}
            skipPrompt={intro("skip")}
            enterPrompt={intro("enter")}
            celebratePrompt={intro("celebrate")}
            soundPrompt={intro("soundOn")}
            soundOffPrompt={intro("soundOff")}
            previouslyOpenedPrompt={intro("alreadySeen")}
            continueDirectlyPrompt={intro("continueDirectly")}
            sealMonogramAlt={intro("sealMonogram")}
            envelopeRegionLabel={intro("envelopeRegion")}
            introControlsLabel={intro("introControls")}
            enableCalligraphy={enableCalligraphy}
          />
        </main>
      </SoundProvider>
    </NextIntlClientProvider>
  );
}
