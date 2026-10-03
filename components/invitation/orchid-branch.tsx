"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Natural, realistic Phalaenopsis orchid stem with soft pastel strawberry-matcha tones.
 */
export function OrchidBranch({ className }: { className?: string }) {
  const shouldReduceMotion = useReducedMotion();
  const initial = shouldReduceMotion ? false : { opacity: 0, scale: 0.95 };
  const transition = { duration: 1.1, ease: [0.2, 0.7, 0.2, 1] as const };

  return (
    <motion.svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      viewBox="0 0 260 400"
      xmlns="http://www.w3.org/2000/svg"
      initial={initial}
      animate={{ opacity: 1, scale: 1 }}
      transition={transition}
    >
      <defs>
        <linearGradient id="branch-real-petal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="65%" stopColor="#FFF7F6" />
          <stop offset="100%" stopColor="#F9D7D2" />
        </linearGradient>
        <linearGradient id="branch-real-leaf" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B3C5A2" />
          <stop offset="100%" stopColor="#5E744A" />
        </linearGradient>
        <radialGradient id="branch-real-throat" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C0392B" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#E67E73" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#FADBD8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Matcha Stem & Leaf Nodes */}
      <g stroke="#7D9366" strokeLinecap="round">
        <path d="M 215,385 C 190,325 185,265 145,215 C 110,170 82,130 72,55" strokeWidth="3" />
        <path d="M 145,215 C 175,200 195,190 210,185" strokeWidth="2" />
      </g>

      {/* Realistic Matcha Leaves */}
      <path d="M 175,315 C 135,312 110,292 98,260 C 130,255 155,270 175,315 Z" fill="url(#branch-real-leaf)" opacity="0.9" />
      <path d="M 152,268 C 182,258 200,235 204,204 C 174,208 154,225 152,268 Z" fill="url(#branch-real-leaf)" opacity="0.85" />
      <path d="M 118,220 C 88,216 68,198 59,170 C 88,168 110,182 118,220 Z" fill="url(#branch-real-leaf)" opacity="0.85" />

      {/* Top Bloom: Realistic Full Phalaenopsis */}
      <g transform="translate(68, 65) scale(0.72)">
        {/* Sepals */}
        <path d="M -16,-10 C -24,-52 -16,-88 0,-96 C 16,-88 24,-52 16,-10 Z" fill="url(#branch-real-petal)" stroke="#FADBD8" strokeWidth="0.8" />
        <path d="M -12,8 C -42,20 -76,42 -68,72 C -52,90 -18,74 4,28 Z" fill="url(#branch-real-petal)" stroke="#FADBD8" strokeWidth="0.8" />
        <path d="M 12,8 C 42,20 76,42 68,72 C 52,90 18,74 -4,28 Z" fill="url(#branch-real-petal)" stroke="#FADBD8" strokeWidth="0.8" />

        {/* Wings */}
        <path d="M -8,-10 C -42,-46 -94,-38 -108,-6 C -118,28 -76,56 -20,20 Z" fill="url(#branch-real-petal)" stroke="#FADBD8" strokeWidth="0.9" />
        <path d="M 8,-10 C 42,-46 94,-38 108,-6 C 118,28 76,56 20,20 Z" fill="url(#branch-real-petal)" stroke="#FADBD8" strokeWidth="0.9" />

        {/* Throat */}
        <circle cx="0" cy="4" r="28" fill="url(#branch-real-throat)" />

        {/* Lip & Cirrhi */}
        <path d="M -14,14 C -20,32 -15,50 0,58 C 15,50 20,32 14,14 Z" fill="#C0392B" />
        <path d="M -2,56 C -12,70 -20,66 -16,80" stroke="#922B21" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        <path d="M 2,56 C 12,70 20,66 16,80" stroke="#922B21" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        <ellipse cx="0" cy="8" rx="5" ry="4" fill="#F39C12" />
        <ellipse cx="0" cy="-2" rx="4" ry="5.5" fill="#FFFFFF" />
      </g>

      {/* Lower Bloom: Angled Realistic Bloom */}
      <g transform="translate(205, 185) rotate(-15) scale(0.6)">
        <path d="M -16,-10 C -24,-52 -16,-88 0,-96 C 16,-88 24,-52 16,-10 Z" fill="url(#branch-real-petal)" stroke="#FADBD8" strokeWidth="0.8" />
        <path d="M -8,-10 C -42,-46 -94,-38 -108,-6 C -118,28 -76,56 -20,20 Z" fill="url(#branch-real-petal)" stroke="#FADBD8" strokeWidth="0.9" />
        <path d="M 8,-10 C 42,-46 94,-38 108,-6 C 118,28 76,56 20,20 Z" fill="url(#branch-real-petal)" stroke="#FADBD8" strokeWidth="0.9" />
        <circle cx="0" cy="4" r="24" fill="url(#branch-real-throat)" />
        <path d="M -14,14 C -20,32 -15,50 0,58 C 15,50 20,32 14,14 Z" fill="#C0392B" />
        <ellipse cx="0" cy="8" rx="4" ry="3" fill="#F39C12" />
      </g>
    </motion.svg>
  );
}
