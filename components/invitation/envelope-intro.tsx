"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { useSound } from "@/lib/sound";

interface EnvelopeIntroProps {
  token: string;
  displayName: string;
  greeting: string;
  dateLabel: string;
  cityLabel: string;
  openPrompt: string;
  skipPrompt: string;
  enterPrompt: string;
  soundPrompt: string;
  replayPrompt?: string;
}

export function EnvelopeIntro({
  token,
  displayName,
  greeting,
  dateLabel,
  cityLabel,
  openPrompt,
  skipPrompt,
  enterPrompt,
  soundPrompt,
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
    router.push(`/i/${token}/invitation`);
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

    // Auto navigate after full ceremony unless user interacts
    setTimeout(() => {
      markSeenAndNavigate();
    }, 7200);
  }

  return (
    <div className="envelope-screen" role="region" aria-label="Wedding Invitation Envelope">
      {/* Top Controls: Sound Toggle and Skip */}
      <nav className="envelope-screen__controls" aria-label="Intro Controls">
        <button
          type="button"
          className="envelope-control-button"
          onClick={toggleSound}
          aria-pressed={soundEnabled}
        >
          <span aria-hidden="true" className="envelope-control-icon">
            {soundEnabled ? "♪" : "✕"}
          </span>
          <span>{soundEnabled ? soundPrompt : "Sound Off"}</span>
        </button>

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
                ? { opacity: step === "revealed" || step === "navigating" ? 1 : 0.95 }
                : step === "idle"
                  ? { y: 0, scale: 0.92, zIndex: 2 }
                  : step === "opening"
                    ? { y: -80, scale: 0.96, zIndex: 10, transition: { duration: 0.9, delay: 0.6, ease: [0.2, 0.7, 0.2, 1] } }
                    : {
                        y: -180,
                        scale: 1.05,
                        zIndex: 20,
                        boxShadow: "0 25px 60px rgba(50, 30, 35, 0.16)",
                        transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] },
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
                  Request the pleasure of your company at their wedding
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
                  ? { rotateX: 0, zIndex: 5 }
                  : { rotateX: -180, zIndex: 1, transition: { duration: 0.85, ease: [0.25, 1, 0.5, 1] } }
            }
          >
            <div className="envelope-3d__top-flap-triangle" />
          </motion.div>

          {/* Handcrafted Wax Seal (Monogram) */}
          {step === "idle" && (
            <motion.button
              type="button"
              className="envelope-seal"
              onClick={handleOpen}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              aria-label={`${openPrompt} — Wax Seal`}
            >
              <div className="envelope-seal__image-wrap">
                <Image
                  src="/orchids/seal-monogram.svg"
                  alt="Ruben & Andrea Wax Seal Monogram"
                  width={110}
                  height={110}
                  priority
                />
              </div>
              <span className="envelope-seal__pulse" aria-hidden="true" />
              <span className="envelope-seal__label">{openPrompt}</span>
            </motion.button>
          )}
        </div>

        {/* Guest Address Calligraphy on Envelope when closed */}
        {step === "idle" && (
          <div className="envelope-calligraphy" aria-hidden="true">
            <p className="envelope-calligraphy__name">{displayName}</p>
          </div>
        )}
      </div>

      {alreadySeen && step === "idle" && (
        <div className="envelope-seen-bar">
          <p>You have previously opened your invitation.</p>
          <button type="button" onClick={markSeenAndNavigate} className="text-button text-button--quiet">
            Continue directly to invitation →
          </button>
        </div>
      )}
    </div>
  );
}
