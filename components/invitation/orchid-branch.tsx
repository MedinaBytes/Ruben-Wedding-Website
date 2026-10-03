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
      <defs>
        <linearGradient id="orchid-petal" x1="32" y1="20" x2="112" y2="163" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--color-neutral-light)" />
          <stop offset="0.58" stopColor="var(--color-strawberry-pale)" />
          <stop offset="1" stopColor="var(--color-strawberry-soft)" />
        </linearGradient>
        <linearGradient id="orchid-leaf" x1="80" y1="250" x2="170" y2="330" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--color-matcha-pale)" />
          <stop offset="1" stopColor="var(--color-matcha-soft)" />
        </linearGradient>
      </defs>
      <g stroke="var(--color-matcha-strong)" strokeLinecap="round" strokeWidth="1.15">
        <motion.path d="M202 375C176 318 179 264 143 222 108 181 79 142 70 70" initial={initial} animate={{ opacity: 1, pathLength: 1 }} transition={transition()} />
        <motion.path d="M167 308C132 307 110 289 100 260c29-4 51 9 67 48Z" fill="url(#orchid-leaf)" initial={initial} animate={{ opacity: 1, pathLength: 1 }} transition={transition(0.12)} />
        <motion.path d="M149 263c29-9 46-29 50-58-28 2-47 18-50 58Z" fill="url(#orchid-leaf)" initial={initial} animate={{ opacity: 1, pathLength: 1 }} transition={transition(0.2)} />
        <motion.path d="M116 216c-29-3-48-19-56-44 28-4 49 9 56 44Z" fill="url(#orchid-leaf)" initial={initial} animate={{ opacity: 1, pathLength: 1 }} transition={transition(0.28)} />
        <motion.path d="M92 168c27-10 41-30 42-57-26 5-41 22-42 57Z" fill="url(#orchid-leaf)" initial={initial} animate={{ opacity: 1, pathLength: 1 }} transition={transition(0.36)} />
        <motion.path d="M78 119c-24-8-36-26-38-50 24 5 37 20 38 50Z" fill="url(#orchid-leaf)" initial={initial} animate={{ opacity: 1, pathLength: 1 }} transition={transition(0.44)} />
      </g>
      <g stroke="var(--color-strawberry-strong)" strokeLinejoin="round" strokeWidth="1.2">
        <motion.path d="M67 79C43 75 27 59 26 39c1-17 14-27 29-22 12 4 19 17 18 31 8-19 26-31 42-25 15 6 19 22 10 37-5 8-13 14-23 18 24-5 46 4 50 20 4 15-9 28-27 29-12 1-24-4-33-13 7 22 3 43-12 50-15 7-31-2-35-20-3-11-1-23 5-34-18 16-40 20-52 8-12-11-8-29 6-40 10-8 23-11 43-9Z" fill="url(#orchid-petal)" initial={initial} animate={{ opacity: 1, pathLength: 1 }} transition={transition(0.48)} />
        <motion.path d="M195 194c-18-5-28-18-27-33 1-13 11-21 23-17 10 3 15 13 14 24 6-15 21-24 33-19 12 5 15 17 8 29-4 7-10 11-18 14 19-4 36 3 39 16 3 12-7 22-21 23-10 1-19-3-26-10 6 17 2 33-9 38-12 6-24-2-27-16-2-9-1-18 4-27-14 12-31 15-40 6-10-9-6-23 5-32 7-6 18-9 32-8Z" fill="url(#orchid-petal)" initial={initial} animate={{ opacity: 1, pathLength: 1 }} transition={transition(0.58)} />
      </g>
      <g fill="var(--color-strawberry-soft)" stroke="var(--color-strawberry-strong)" strokeWidth="0.7">
        <path d="M65 74c-8-7-17-7-21-1-4 6 1 15 9 18l14 5 8-12c4-7 2-15-4-17-4-1-8 1-10 7 3-3 7-3 9-1 2 2 1 5-1 8Z" />
        <path d="M194 190c-6-5-13-5-16 0-3 4 1 11 7 13l11 4 6-9c3-5 1-11-4-12-3-1-6 1-8 5 2-2 5-2 7-1 1 2 1 4-1 6Z" />
      </g>
      <g fill="var(--color-rose-gold)" stroke="var(--color-rose-gold)" strokeLinecap="round" strokeWidth="1">
        <circle cx="68" cy="78" r="2.5" />
        <circle cx="197" cy="193" r="2" />
        <path d="M65 77c-6-9-13-13-22-15M69 76c4-10 11-16 20-19M69 80c-9-1-17 3-24 9" fill="none" />
        <path d="M131 356c11-4 22-5 34-1M42 212c-8-6-13-14-16-24" />
      </g>
    </svg>
  );
}
