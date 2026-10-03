"use client";

import { motion, useReducedMotion } from "motion/react";

export function OrchidBranch({ className }: { className?: string }) {
  const shouldReduceMotion = useReducedMotion();
  const initial = shouldReduceMotion ? false : { opacity: 0.55, pathLength: 0 };
  const transition = (delay = 0) =>
    shouldReduceMotion
      ? { duration: 0 }
      : { delay, duration: 1.1, ease: [0.2, 0.7, 0.2, 1] as const };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      viewBox="0 0 240 390"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="var(--color-matcha-strong)" strokeLinecap="round" strokeWidth="1.4">
        <motion.path d="M202 375C176 318 179 264 143 222 108 181 79 142 70 70" initial={initial} animate={{ opacity: 1, pathLength: 1 }} transition={transition()} />
        <motion.path d="M167 308C132 307 110 289 100 260c29-4 51 9 67 48Z" fill="var(--color-matcha-pale)" initial={initial} animate={{ opacity: 1, pathLength: 1 }} transition={transition(0.12)} />
        <motion.path d="M149 263c29-9 46-29 50-58-28 2-47 18-50 58Z" fill="var(--color-matcha-pale)" initial={initial} animate={{ opacity: 1, pathLength: 1 }} transition={transition(0.2)} />
        <motion.path d="M116 216c-29-3-48-19-56-44 28-4 49 9 56 44Z" fill="var(--color-matcha-pale)" initial={initial} animate={{ opacity: 1, pathLength: 1 }} transition={transition(0.28)} />
        <motion.path d="M92 168c27-10 41-30 42-57-26 5-41 22-42 57Z" fill="var(--color-matcha-pale)" initial={initial} animate={{ opacity: 1, pathLength: 1 }} transition={transition(0.36)} />
        <motion.path d="M78 119c-24-8-36-26-38-50 24 5 37 20 38 50Z" fill="var(--color-matcha-pale)" initial={initial} animate={{ opacity: 1, pathLength: 1 }} transition={transition(0.44)} />
      </g>
      <g stroke="var(--color-strawberry-strong)" strokeLinejoin="round" strokeWidth="1.2">
        <motion.path d="M61 80C36 73 20 50 25 27c22-4 42 13 43 37C75 38 97 23 118 31c7 23-7 45-31 51 27-5 49 6 55 28-17 18-43 19-62 0 7 24-4 46-27 53-19-15-22-39-6-60-22 12-47 7-59-13 8-21 30-30 56-21Z" fill="var(--color-strawberry-pale)" initial={initial} animate={{ opacity: 1, pathLength: 1 }} transition={transition(0.48)} />
        <motion.path d="M196 192c-19-6-31-24-27-42 17-3 32 10 33 28 5-20 21-31 37-24 5 17-5 34-23 38 20-4 37 5 41 21-13 14-32 15-46 0 5 18-3 34-20 39-14-11-17-29-5-45-17 9-35 5-44-10 6-15 22-22 41-15Z" fill="var(--color-strawberry-pale)" initial={initial} animate={{ opacity: 1, pathLength: 1 }} transition={transition(0.58)} />
      </g>
      <g fill="var(--color-rose-gold)">
        <circle cx="67" cy="79" r="4" />
        <circle cx="196" cy="193" r="3.5" />
      </g>
      <g stroke="var(--color-rose-gold)" strokeLinecap="round" strokeWidth="1">
        <path d="M64 79c-6-9-12-14-21-17M67 77c4-10 11-16 20-20M67 80c-9 0-17 3-24 9" />
        <path d="M131 356c11-4 22-5 34-1M42 212c-8-6-13-14-16-24" />
      </g>
    </svg>
  );
}