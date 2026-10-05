"use client";

import { useState } from "react";
import { submitGuestWishAction } from "@/app/actions/guestbook";
import type { StoredWish } from "@/lib/storage/resilient-store";
import type { Locale } from "@/lib/wedding-config";

interface GuestbookSectionProps {
  invitationId: string;
  defaultGuestName?: string;
  initialWishes?: StoredWish[];
  locale?: Locale | string;
}

const guestbookI18n: Record<string, {
  eyebrow: string;
  title: string;
  subtitle: string;
  nameLabel: string;
  messageLabel: string;
  messagePlaceholder: string;
  submitButton: string;
  submitting: string;
  successTitle: string;
  successMsg: string;
  noWishesYet: string;
}> = {
  en: {
    eyebrow: "MEMORIES & BLESSINGS",
    title: "Digital Guestbook",
    subtitle: "Leave a heartfelt note, wedding wish, or favorite memory for Ruben & Andrea.",
    nameLabel: "Your Name",
    messageLabel: "Your Message for the Couple",
    messagePlaceholder: "Dear Ruben & Andrea, we are overjoyed to celebrate your wedding day in Vienna...",
    submitButton: "Sign Guestbook →",
    submitting: "Sending wish...",
    successTitle: "Thank you for your warm words!",
    successMsg: "Your message has been added to our wedding book.",
    noWishesYet: "Be the first to sign Ruben & Andrea's digital guestbook!",
  },
  es: {
    eyebrow: "RECUERDOS Y BENDICIONES",
    title: "Libro de Firmas Digital",
    subtitle: "Deja un mensaje especial, deseos de felicidad o un recuerdo inolvidable para Ruben y Andrea.",
    nameLabel: "Tu Nombre",
    messageLabel: "Tu Mensaje para los Novios",
    messagePlaceholder: "Queridos Ruben y Andrea, ¡estamos felices de celebrar este gran día con ustedes en Viena!...",
    submitButton: "Firmar Libro de Visitas →",
    submitting: "Enviando mensaje...",
    successTitle: "¡Muchas gracias por tus hermosas palabras!",
    successMsg: "Tu dedicatoria ha sido añadida a nuestro libro de bodas.",
    noWishesYet: "¡Sé el primero en firmar el libro de firmas de Ruben y Andrea!",
  },
  "de-AT": {
    eyebrow: "ERINNERUNGEN & GLÜCKWÜNSCHE",
    title: "Digitales Gästebuch",
    subtitle: "Hinterlasst Ruben & Andrea eine herzliche Botschaft, liebevolle Segenswünsche oder eine gemeinsame Anekdote.",
    nameLabel: "Euer Name",
    messageLabel: "Eure Glückwünsche für das Brautpaar",
    messagePlaceholder: "Liebe Andrea, lieber Ruben, wir freuen uns von ganzem Herzen auf euren großen Tag in Wien...",
    submitButton: "Gästebuch signieren →",
    submitting: "Wird gesendet...",
    successTitle: "Herzlichen Dank für die lieben Worte!",
    successMsg: "Eure Botschaft wurde liebevoll im Gästebuch verewigt.",
    noWishesYet: "Seid die Ersten, die sich im Gästebuch von Ruben & Andrea verewigen!",
  },
  hu: {
    eyebrow: "EMLÉKEK ÉS JÓKÍVÁNSÁGOK",
    title: "Digitális Vendégkönyv",
    subtitle: "Hagyj egy szívhez szóló üzenetet vagy jókívánságot Ruben és Andrea számára.",
    nameLabel: "Neved",
    messageLabel: "Üzeneted az ifjú párnak",
    messagePlaceholder: "Kedves Ruben és Andrea! Nagyon boldogok vagyunk, hogy veletek ünnepelhetünk Bécsben...",
    submitButton: "Vendégkönyv aláírása →",
    submitting: "Küldés folyamatban...",
    successTitle: "Köszönjük a kedves szavakat!",
    successMsg: "Üzeneted bekerült az esküvői vendégkönyvünkbe.",
    noWishesYet: "Legyél te az első, aki üzenetet hagy Ruben és Andrea vendégkönyvében!",
  },
};

export function GuestbookSection({
  invitationId,
  defaultGuestName = "",
  initialWishes = [],
  locale = "en",
}: GuestbookSectionProps) {
  const [wishes, setWishes] = useState<StoredWish[]>(initialWishes);
  const [guestName, setGuestName] = useState(defaultGuestName);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const langKey = locale.startsWith("de") ? "de-AT" : locale.startsWith("es") ? "es" : locale.startsWith("hu") ? "hu" : "en";
  const texts = guestbookI18n[langKey] || guestbookI18n.en;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await submitGuestWishAction({
        invitationId,
        guestName,
        message,
        locale,
      });

      if (res.success && res.wish) {
        setWishes((prev) => [res.wish!, ...prev]);
        setMessage("");
        setSuccess(true);
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(res.error || "Failed to submit message.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="wedding-guestbook" style={{ margin: "4rem auto", maxWidth: "900px", padding: "0 1.25rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <div style={{ fontSize: "0.75rem", letterSpacing: "2.5px", color: "#8C2836", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem" }}>
          {texts.eyebrow}
        </div>
        <h2 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "2.2rem", color: "#2B2425", margin: "0 0 0.75rem 0", fontWeight: "normal" }}>
          {texts.title}
        </h2>
        <p style={{ color: "#6A5D60", fontSize: "0.95rem", maxWidth: "600px", margin: "0 auto", lineHeight: 1.6 }}>
          {texts.subtitle}
        </p>
      </div>

      {/* Submission Form */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E6DED8", borderRadius: "12px", padding: "2rem", marginBottom: "3rem", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#2B2425", marginBottom: "0.35rem" }}>
              {texts.nameLabel}
            </label>
            <input
              type="text"
              required
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="e.g. Maria & Thomas"
              style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.9rem" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#2B2425", marginBottom: "0.35rem" }}>
              {texts.messageLabel}
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={texts.messagePlaceholder}
              style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem", fontFamily: "inherit", lineHeight: 1.5 }}
            />
          </div>

          {error && (
            <div style={{ color: "#8C2836", fontSize: "0.85rem", background: "rgba(140, 40, 54, 0.08)", padding: "0.6rem 0.85rem", borderRadius: "6px" }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ color: "#2E6B47", fontSize: "0.85rem", background: "#F0F7F2", border: "1px solid #CFE6D7", padding: "0.6rem 0.85rem", borderRadius: "6px" }}>
              <strong>{texts.successTitle}</strong> {texts.successMsg}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={submitting}
              style={{
                background: "#8C2836",
                color: "#FFFFFF",
                border: 0,
                borderRadius: "6px",
                padding: "0.75rem 1.75rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 3px 12px rgba(140, 40, 54, 0.2)",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? texts.submitting : texts.submitButton}
            </button>
          </div>
        </form>
      </div>

      {/* Wishes Display Wall */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1.3rem", color: "#8C2836", margin: 0 }}>
            💌 Wishes &amp; Blessings ({wishes.length})
          </h3>
        </div>

        {wishes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2.5rem 1rem", background: "#FAF7F5", borderRadius: "10px", border: "1px dashed #D5CBC4", color: "#6A5D60", fontSize: "0.9rem" }}>
            {texts.noWishesYet}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {wishes.map((w) => (
              <div
                key={w.id}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #EBE3DC",
                  borderLeft: "4px solid #CCA468",
                  borderRadius: "8px",
                  padding: "1.25rem 1.4rem",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <p style={{ margin: "0 0 1rem 0", fontSize: "0.9rem", lineHeight: 1.6, color: "#3B3133", fontStyle: "italic" }}>
                  &ldquo;{w.message}&rdquo;
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "#776A6C", borderTop: "1px solid #F2ECE7", paddingTop: "0.6rem" }}>
                  <strong style={{ color: "#2B2425" }}>{w.guest_name}</strong>
                  <span>{new Date(w.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
