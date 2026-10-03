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
}: {
  invitationId: string;
  greeting: string;
  date: string;
  openLabel: string;
  skipLabel: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isClosing, setIsClosing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
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

  function closeIntro() {
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
        animate={{ opacity: isClosing ? 0 : 1, scale: isClosing ? 0.985 : 1, y: isClosing ? 8 : 0 }}
        className="invitation-intro__paper"
        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.985, y: 12 }}
        onAnimationComplete={finishClose}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.62, ease: [0.2, 0.7, 0.2, 1] }}
      >
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
      </motion.div>
    </dialog>
  );
}
