import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { supportedLocales, type Locale } from "@/lib/wedding-config";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Ruben & Andrea — Wedding Celebration (Vienna 2027)",
    description: "Private digital wedding invitation for Ruben & Andrea. Please use your personal invitation link.",
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

  const [messages, navigation, gate] = await Promise.all([
    getMessages({ locale }),
    getTranslations({ locale, namespace: "navigation" }),
    getTranslations({ locale, namespace: "gate" }),
  ]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <main className="guest-gate" id="main">
        <div aria-hidden="true" className="guest-gate__atmosphere">
          <span className="guest-gate__glow guest-gate__glow--rose" />
          <span className="guest-gate__glow guest-gate__glow--matcha" />
        </div>

        <section className="guest-gate__card" style={{ maxWidth: "520px", textAlign: "center", padding: "3rem 2rem" }}>
          {/* Handcrafted Monogram Wax Seal */}
          <div style={{ width: "90px", height: "90px", margin: "0 auto 1.5rem" }}>
            <Image
              src="/orchids/seal-monogram.svg"
              alt="Ruben & Andrea Monogram"
              width={90}
              height={90}
              priority
            />
          </div>

          <p className="section-label" style={{ letterSpacing: "0.2em", textTransform: "uppercase", fontSize: "0.8rem", color: "#8E696E" }}>
            {gate.has("eyebrow") ? gate("eyebrow") : "A Private Invitation"}
          </p>

          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 5vw, 2.6rem)", margin: "0.5rem 0 1rem", color: "#2E2426" }}>
            Ruben <i>&</i> Andrea
          </h1>

          <p style={{ fontFamily: "var(--font-body)", color: "#55644E", fontSize: "0.95rem", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "1.5rem" }}>
            02 · 10 · 2027 · VIENNA
          </p>

          <div style={{ height: "1px", width: "4rem", background: "linear-gradient(90deg, transparent, #CCA468, transparent)", margin: "0 auto 1.5rem" }} />

          <p style={{ color: "#5C5052", fontSize: "0.95rem", lineHeight: 1.65, marginBottom: "1.75rem" }}>
            {gate.has("instruction") ? gate("instruction") : "This celebration is strictly by personal invitation. Each guest receives a unique, private link directly from Ruben and Andrea to open their interactive invitation."}
          </p>

          <div style={{ background: "rgba(247, 243, 239, 0.8)", border: "1px solid #E4DBD3", borderRadius: "8px", padding: "1.25rem 1rem", marginBottom: "2rem" }}>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "#6A5D60", lineHeight: 1.5 }}>
              💌 {gate.has("personalNotice") ? gate("personalNotice") : "Please use the personal invitation link provided to you in WhatsApp, email, or your printed card to access your RSVP and wedding details."}
            </p>
          </div>

          {/* Language Switcher Bar */}
          <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#8A7D80" }}>
              {navigation("language")}:
            </span>
            {supportedLocales.map((loc) => (
              <a
                key={loc}
                href={`/?lang=${loc}`}
                style={{
                  fontSize: "0.8rem",
                  fontWeight: loc === locale ? "700" : "400",
                  textDecoration: loc === locale ? "underline" : "none",
                  color: loc === locale ? "#8C2836" : "#6E6264",
                  padding: "0.2rem 0.4rem",
                }}
              >
                {loc === "de-AT" ? "AT" : loc.toUpperCase()}
              </a>
            ))}
          </div>
        </section>
      </main>

      <footer className="guest-gate__footer">
        <Link href="/privacy">{navigation("privacy")}</Link>
      </footer>
    </NextIntlClientProvider>
  );
}