"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { useSound } from "@/lib/sound";

import { setManualLocale } from "@/app/actions/set-locale";

interface EnvelopeIntroProps {
  token: string;
  invitationId?: string;
  currentLocale?: string;
  displayName: string;
  greeting: string;
  dateLabel: string;
  cityLabel: string;
  openPrompt: string;
  skipPrompt: string;
  enterPrompt: string;
  celebratePrompt?: string;
  soundPrompt: string;
  soundOffPrompt?: string;
  previouslyOpenedPrompt?: string;
  continueDirectlyPrompt?: string;
  sealMonogramAlt?: string;
  envelopeRegionLabel?: string;
  introControlsLabel?: string;
  replayPrompt?: string;
  enableCalligraphy?: boolean;
}

function persistLocaleCookies(invitationId: string | undefined, code: string) {
  if (typeof document !== "undefined") {
    const cookieName = invitationId ? `wedding_manual_locale_${invitationId}` : "wedding_manual_locale";
    document.cookie = `${cookieName}=${code}; path=/; max-age=31536000; SameSite=Lax`;
    document.cookie = `wedding_manual_locale=${code}; path=/; max-age=31536000; SameSite=Lax`;
  }
}

export function EnvelopeIntro({
  token,
  invitationId,
  currentLocale = "en",
  displayName,
  greeting,
  dateLabel,
  cityLabel,
  openPrompt,
  skipPrompt,
  enterPrompt,
  celebratePrompt,
  soundPrompt,
  soundOffPrompt,
  previouslyOpenedPrompt,
  continueDirectlyPrompt,
  sealMonogramAlt,
  envelopeRegionLabel,
  introControlsLabel,
  enableCalligraphy = true,
}: EnvelopeIntroProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const { play, soundEnabled, toggleSound } = useSound();

  // Intro states: "idle" -> "opening" -> "revealed" -> "navigating"
  const [step, setStep] = useState<"idle" | "opening" | "revealed" | "navigating">("idle");

  const storageKey = `wedding_intro_seen_${token}`;
  const alreadySeen = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      return () => window.removeEventListener("storage", onStoreChange);
    },
    () => {
      try {
        return sessionStorage.getItem(storageKey) === "true";
      } catch {
        return false;
      }
    },
    () => false,
  );

  function markSeenAndNavigate() {
    try {
      sessionStorage.setItem(storageKey, "true");
    } catch {}
    setStep("navigating");
    const targetUrl = `/i/${token}/invitation?lang=${encodeURIComponent(currentLocale)}`;
    router.push(targetUrl);
  }

  function handleOpen() {
    if (step !== "idle") return;

    play("seal-tap");
    setStep("opening");

    if (shouldReduceMotion) {
      setStep("revealed");
      return;
    }

    // Sequence timing
    setTimeout(() => {
      play("envelope-open");
    }, 450);

    setTimeout(() => {
      play("card-reveal");
      setStep("revealed");
    }, 1400);
  }

  function handleLanguageChange(code: string) {
    persistLocaleCookies(invitationId, code);
    void setManualLocale(code, invitationId).catch(() => {});
    router.push(`/i/${token}?lang=${code}`);
  }

  return (
    <div className="envelope-screen" role="region" aria-label={envelopeRegionLabel || "Wedding Invitation Envelope"}>
      {/* Top Controls: Sound Toggle, Language Selector, and Skip */}
      <nav className="envelope-screen__controls" aria-label={introControlsLabel || "Intro Controls"}>
        <button
          type="button"
          className="envelope-control-button"
          onClick={toggleSound}
          aria-pressed={soundEnabled}
        >
          <span aria-hidden="true" className="envelope-control-icon">
            {soundEnabled ? "♪" : "✕"}
          </span>
          <span>{soundEnabled ? soundPrompt : (soundOffPrompt || "Sound Off")}</span>
        </button>

        {/* Multi-language Selector */}
        <div style={{ display: "flex", gap: "0.25rem", background: "rgba(255,255,255,0.85)", padding: "0.2rem 0.35rem", borderRadius: "999px", border: "1px solid rgba(180, 150, 155, 0.35)", backdropFilter: "blur(8px)" }}>
          {[
            { code: "en", label: "EN" },
            { code: "es", label: "ES" },
            { code: "de-AT", label: "AT" },
            { code: "hu", label: "HU" },
          ].map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => handleLanguageChange(item.code)}
              style={{
                background: currentLocale === item.code ? "#8C2836" : "transparent",
                color: currentLocale === item.code ? "#FFFFFF" : "#544648",
                border: 0,
                borderRadius: "999px",
                padding: "0.25rem 0.5rem",
                fontSize: "0.75rem",
                fontWeight: currentLocale === item.code ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="envelope-control-button envelope-control-button--skip"
          onClick={markSeenAndNavigate}
        >
          {skipPrompt} →
        </button>
      </nav>

      {/* Main Stage */}
      <div className="envelope-stage">
        {/* Subtle letterpress pattern & glow background */}
        <div className="envelope-stage__ambient" aria-hidden="true" />

        {/* 3D Envelope Container */}
        <div className={`envelope-3d ${step !== "idle" ? "envelope-3d--open" : ""}`}>
          {/* Back Paper */}
          <div className="envelope-3d__back" aria-hidden="true" />

          {/* Letterpress Invitation Card */}
          <motion.article
            className="envelope-card"
            initial={false}
            animate={
              shouldReduceMotion
                ? { opacity: step === "revealed" || step === "navigating" ? 1 : 0 }
                : step === "idle"
                  ? { y: 15, opacity: 0, scale: 0.92, zIndex: 2 }
                  : step === "opening"
                    ? { y: -60, opacity: 1, scale: 0.98, zIndex: 15, transition: { duration: 0.85, delay: 0.45, ease: [0.2, 0.7, 0.2, 1] } }
                    : {
                        y: -195,
                        opacity: 1,
                        scale: 1.03,
                        zIndex: 30,
                        boxShadow: "0 25px 60px rgba(50, 30, 35, 0.22)",
                        transition: { duration: 1.0, ease: [0.16, 1, 0.3, 1] },
                      }
            }
          >
            {/* Blind Emboss Texture & Floral Line-art */}
            <div className="envelope-card__inner">
              <svg
                viewBox="0 0 400 400"
                className="envelope-card__orchid-art"
                fill="none"
                aria-hidden="true"
              >
                <motion.path
                  d="M120 380 C135 320 150 260 170 200 C185 155 215 110 260 70 C280 50 305 35 330 25"
                  stroke="#CCA468"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={step === "revealed" ? { pathLength: 1, opacity: 0.8 } : { pathLength: 0, opacity: 0 }}
                  transition={{ duration: 1.6, ease: "easeInOut" }}
                />
                <motion.path
                  d="M185 175 C120 135 60 160 55 210 C50 255 105 270 160 225 C175 212 185 195 190 180"
                  stroke="#CCA468"
                  strokeWidth="1"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={step === "revealed" ? { pathLength: 1, opacity: 0.7 } : { pathLength: 0, opacity: 0 }}
                  transition={{ duration: 1.4, delay: 0.3, ease: "easeInOut" }}
                />
                <motion.path
                  d="M210 175 C275 135 335 160 340 210 C345 255 290 270 235 225 C220 212 210 195 205 180"
                  stroke="#CCA468"
                  strokeWidth="1"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={step === "revealed" ? { pathLength: 1, opacity: 0.7 } : { pathLength: 0, opacity: 0 }}
                  transition={{ duration: 1.4, delay: 0.3, ease: "easeInOut" }}
                />
              </svg>

              <div className="envelope-card__content">
                <span className="envelope-card__monogram" aria-hidden="true">
                  R <i>&</i> A
                </span>
                <p className="envelope-card__greeting-to">
                  {greeting || `Dear ${displayName}`}
                </p>
                <div className="envelope-card__divider" aria-hidden="true" />
                <h1 className="envelope-card__title">
                  Ruben <i>&</i> Andrea
                </h1>
                <p className="envelope-card__celebrate">
                  {celebratePrompt || "Request the pleasure of your company at their wedding"}
                </p>
                <p className="envelope-card__date">
                  <span>{dateLabel}</span>
                  <span className="bullet">·</span>
                  <span>{cityLabel}</span>
                </p>

                {step === "revealed" && (
                  <motion.button
                    type="button"
                    className="envelope-card__enter-btn"
                    onClick={markSeenAndNavigate}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                  >
                    {enterPrompt} →
                  </motion.button>
                )}
              </div>
            </div>
          </motion.article>

          {/* Front Pocket (Sides and Bottom Fold) */}
          <div className="envelope-3d__pocket" aria-hidden="true">
            <div className="envelope-3d__flap-left" />
            <div className="envelope-3d__flap-right" />
            <div className="envelope-3d__flap-bottom" />
          </div>

          {/* Top Flap (3D Rotating Flap) */}
          <motion.div
            className="envelope-3d__top-flap"
            initial={false}
            animate={
              shouldReduceMotion
                ? { opacity: step === "idle" ? 1 : 0 }
                : step === "idle"
                  ? { rotateX: 0, zIndex: 12 }
                  : { rotateX: -180, zIndex: 1, transition: { duration: 0.85, ease: [0.25, 1, 0.5, 1] } }
            }
          >
            <div className="envelope-3d__top-flap-triangle" />
          </motion.div>

          {/* Handcrafted Wax Seal (Monogram) */}
          {(step === "idle" || step === "opening") && (
            <motion.button
              type="button"
              className="envelope-seal"
              onClick={handleOpen}
              whileHover={step === "idle" ? { scale: 1.06, x: "-50%", y: "-50%" } : {}}
              whileTap={step === "idle" ? { scale: 0.95, x: "-50%", y: "-50%" } : {}}
              initial={{ scale: 0.9, opacity: 0, x: "-50%", y: "-50%" }}
              animate={
                step === "idle"
                  ? { scale: 1, opacity: 1, x: "-50%", y: "-50%" }
                  : { scale: [1, 1.25, 0], opacity: [1, 0.7, 0], rotate: [0, -8, 12], x: "-50%", y: "-50%" }
              }
              transition={step === "opening" ? { duration: 0.45 } : { duration: 0.5, ease: "easeOut" }}
              aria-label={`${openPrompt} — Wax Seal`}
            >
              <div className="envelope-seal__image-wrap">
                <Image
                  src="/orchids/seal-monogram.png"
                  alt={sealMonogramAlt || "Ruben & Andrea Botanical Wax Seal Monogram"}
                  width={118}
                  height={118}
                  priority
                />
              </div>
              {step === "idle" && <span className="envelope-seal__pulse" aria-hidden="true" />}
              {step === "idle" && <span className="envelope-seal__hint">{openPrompt}</span>}
            </motion.button>
          )}
        </div>

        {/* Guest Address Calligraphy on Envelope when closed */}
        {enableCalligraphy && step === "idle" && (
          <motion.div
            className="envelope-calligraphy"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            aria-hidden="true"
          >
            <p className="envelope-calligraphy__name">{displayName}</p>
          </motion.div>
        )}
      </div>

      {alreadySeen && step === "idle" && (
        <div className="envelope-seen-bar">
          <p>{previouslyOpenedPrompt || "You have previously opened your invitation."}</p>
          <button type="button" onClick={markSeenAndNavigate} className="text-button text-button--quiet">
            {continueDirectlyPrompt || "Continue directly to invitation →"}
          </button>
        </div>
      )}
    </div>
  );
}
