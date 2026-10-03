"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";

const desktopQuery = "(min-width: 761px)";

function subscribeToDesktopMode(onStoreChange: () => void) {
  const query = window.matchMedia(desktopQuery);
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
}

function getDesktopSnapshot() {
  return window.matchMedia(desktopQuery).matches;
}

function getServerSnapshot() {
  return false;
}

export function HeroPhotoMotion({ children }: { children: ReactNode }) {
  const isDesktop = useSyncExternalStore(subscribeToDesktopMode, getDesktopSnapshot, getServerSnapshot);
  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const photoOffset = useTransform(scrollY, [0, 900], [0, -12], { clamp: true });

  return (
    <motion.div
      className="hero__image-motion"
      style={{ y: isDesktop && !shouldReduceMotion ? photoOffset : 0 }}
    >
      {children}
    </motion.div>
  );
}