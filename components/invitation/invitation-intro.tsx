"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

const introStorageEvent = "wedding-intro-storage-change";

function subscribeToIntroStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(introStorageEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(introStorageEvent, onStoreChange);
  };
}

export function InvitationIntro({
  invitationId,
  greeting,
  date,
  openLabel,
  skipLabel,
  soundOnLabel,
  soundOffLabel,
  editionLabel,
  onComplete,
}: {
  invitationId: string;
  greeting: string;
  date: string;
  openLabel: string;
  skipLabel: string;
  soundOnLabel: string;
  soundOffLabel: string;
  editionLabel?: string;
  onComplete?: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isClosing, setIsClosing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const storageKey = `wedding-intro-seen:${invitationId}`;
  const getSnapshot = useCallback(() => {
    try {
      return sessionStorage.getItem(storageKey) === "true";
    } catch {
      return false;
    }
  }, [storageKey]);
  const getServerSnapshot = useCallback(() => false, []);
  const hasSeenIntro = useSyncExternalStore(subscribeToIntroStorage, getSnapshot, getServerSnapshot);
  const isOpen = !hasSeenIntro && !isDismissed;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && dialog && !dialog.open) dialog.showModal();
  }, [isOpen]);

  function playOpeningChime() {
    if (!soundEnabled) return;

    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) return;

    const context = new AudioContextConstructor();
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.connect(context.destination);

    [523.25, 659.25].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const noteStart = context.currentTime + index * 0.13;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, noteStart);
      oscillator.connect(gain);
      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.045, noteStart + 0.045);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.62);
      oscillator.start(noteStart);
      oscillator.stop(noteStart + 0.65);
    });

    window.setTimeout(() => void context.close(), 1000);
  }

  function closeIntro() {
    playOpeningChime();
    try {
      sessionStorage.setItem(storageKey, "true");
    } catch {
      // The invitation remains available when session storage is disabled.
    }
    setIsClosing(true);
  }

  function finishClose() {
    if (!isClosing) return;
    dialogRef.current?.close();
    setIsDismissed(true);
    window.dispatchEvent(new Event(introStorageEvent));
    onComplete?.();
  }

  return (
    <dialog
      aria-label={greeting}
      className="invitation-intro"
      onCancel={(event) => {
        event.preventDefault();
        closeIntro();
      }}
      ref={dialogRef}
    >
      <motion.div
        animate={{ opacity: isClosing ? 0 : 1, scale: isClosing ? 0.97 : 1, y: isClosing ? -10 : 0, rotateX: isClosing ? -5 : 0 }}
        className="invitation-intro__paper"
        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, y: 20, rotateX: 3 }}
        onAnimationComplete={finishClose}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.72, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <span aria-hidden="true" className="invitation-intro__edition">
          {editionLabel || "An invitation to celebrate"}
        </span>
        <span aria-hidden="true" className="invitation-intro__ornament">R <span>&</span> A</span>
        <p className="invitation-intro__greeting">{greeting}</p>
        <p className="invitation-intro__date">{date}</p>
        <div className="invitation-intro__actions">
          <button className="text-button" onClick={closeIntro} type="button">
            {openLabel}
          </button>
          <button className="text-button text-button--quiet" onClick={closeIntro} type="button">
            {skipLabel}
          </button>
        </div>
        <button
          aria-pressed={soundEnabled}
          className="invitation-intro__sound"
          onClick={() => setSoundEnabled((enabled) => !enabled)}
          type="button"
        >
          <span aria-hidden="true">{soundEnabled ? "♫" : "♪"}</span>
          {soundEnabled ? soundOffLabel : soundOnLabel}
        </button>
      </motion.div>
    </dialog>
  );
}
