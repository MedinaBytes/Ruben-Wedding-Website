"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Natural, realistic botanical vector orchids with pastel strawberry-matcha palette.
 * Inspired by authentic Phalaenopsis (Moth Orchid) anatomy for luxury wedding stationery.
 */

export function HeroBotanicalArrangement({ className }: { className?: string }) {
  const shouldReduceMotion = useReducedMotion();
  const initial = shouldReduceMotion ? false : { opacity: 0, scale: 0.95, y: -8 };
  const animate = { opacity: 1, scale: 1, y: 0 };
  const transition = { duration: 1.2, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <motion.svg
      aria-hidden="true"
      className={className}
      focusable="false"
      viewBox="0 0 760 520"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={initial}
      animate={animate}
      transition={transition}
    >
      <defs>
        {/* Soft Organic Shadow */}
        <filter id="natural-drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="3" dy="10" stdDeviation="14" floodColor="oklch(0.25 0.03 130 / 0.08)" />
          <feDropShadow dx="1" dy="3" stdDeviation="4" floodColor="oklch(0.65 0.06 15 / 0.05)" />
        </filter>

        {/* Pastel Petal Watercolor Shading: Ivory Silk -> Soft Strawberry Blush */}
        <linearGradient id="real-petal-dorsal" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#FFF7F6" />
          <stop offset="90%" stopColor="#FDEAE7" />
          <stop offset="100%" stopColor="#F9D7D2" />
        </linearGradient>

        <linearGradient id="real-petal-wing-left" x1="100%" y1="20%" x2="0%" y2="80%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="55%" stopColor="#FFF8F7" />
          <stop offset="85%" stopColor="#FDECE9" />
          <stop offset="100%" stopColor="#F7CFC8" />
        </linearGradient>

        <linearGradient id="real-petal-wing-right" x1="0%" y1="20%" x2="100%" y2="80%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="55%" stopColor="#FFF8F7" />
          <stop offset="85%" stopColor="#FDECE9" />
          <stop offset="100%" stopColor="#F7CFC8" />
        </linearGradient>

        {/* Translucent Petal Overlay for Natural Luster */}
        <radialGradient id="real-petal-glow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="70%" stopColor="#FFF1F0" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#F5B7B1" stopOpacity="0" />
        </radialGradient>

        {/* Strawberry Blush Throat / Center */}
        <radialGradient id="real-throat-strawberry" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#C0392B" stopOpacity="0.85" />
          <stop offset="45%" stopColor="#E67E73" stopOpacity="0.9" />
          <stop offset="75%" stopColor="#F5B7B1" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#FADBD8" stopOpacity="0" />
        </radialGradient>

        {/* Labellum / Lip Detailed Shading */}
        <linearGradient id="real-lip-gradient" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#E67E73" />
          <stop offset="50%" stopColor="#C0392B" />
          <stop offset="100%" stopColor="#922B21" />
        </linearGradient>

        {/* Golden Honey Callus */}
        <linearGradient id="real-callus-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F9E79F" />
          <stop offset="60%" stopColor="#F39C12" />
          <stop offset="100%" stopColor="#D35400" />
        </linearGradient>

        {/* Realistic Matcha / Sage Stem and Leaves */}
        <linearGradient id="real-stem-matcha" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9CAF88" />
          <stop offset="40%" stopColor="#7D9366" />
          <stop offset="80%" stopColor="#5E744A" />
          <stop offset="100%" stopColor="#4A5C39" />
        </linearGradient>

        <linearGradient id="real-leaf-top" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B3C5A2" />
          <stop offset="50%" stopColor="#8DA578" />
          <stop offset="100%" stopColor="#5F764B" />
        </linearGradient>

        <linearGradient id="real-leaf-bot" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C5D6B6" />
          <stop offset="60%" stopColor="#9FB38B" />
          <stop offset="100%" stopColor="#6C8257" />
        </linearGradient>
      </defs>

      <g filter="url(#natural-drop-shadow)">
        {/* ==================================================================
            1. NATURAL ARCHING MATCHA STEM & NODES
            ================================================================== */}
        {/* Main curved branch entering from upper right */}
        <path
          d="M 720,20 C 620,45 530,110 440,195 C 350,280 250,340 90,390"
          stroke="url(#real-stem-matcha)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Flower pedicels (small stems connecting blooms to the main branch) */}
        {/* Pedicel 1 (to large main bloom) */}
        <path d="M 440,195 C 400,190 375,185 360,180" stroke="url(#real-stem-matcha)" strokeWidth="2.8" strokeLinecap="round" />
        {/* Pedicel 2 (to 3/4 bloom) */}
        <path d="M 280,325 C 240,325 210,315 190,300" stroke="url(#real-stem-matcha)" strokeWidth="2.4" strokeLinecap="round" />
        {/* Pedicel 3 (to side bloom) */}
        <path d="M 525,120 C 510,95 490,80 470,75" stroke="url(#real-stem-matcha)" strokeWidth="2.4" strokeLinecap="round" />

        {/* Tapering bud stem at tip */}
        <path d="M 620,45 C 650,28 680,18 710,12" stroke="url(#real-stem-matcha)" strokeWidth="2.2" strokeLinecap="round" />

        {/* Stem Nodes & Small Green Bracts */}
        <ellipse cx="620" cy="45" rx="3.5" ry="2" fill="#5F764B" transform="rotate(-20 620 45)" />
        <ellipse cx="525" cy="120" rx="4" ry="2.5" fill="#5F764B" transform="rotate(-35 525 120)" />
        <ellipse cx="440" cy="195" rx="4.5" ry="3" fill="#5F764B" transform="rotate(-40 440 195)" />
        <ellipse cx="280" cy="325" rx="4.5" ry="3" fill="#5F764B" transform="rotate(-25 280 325)" />

        {/* ==================================================================
            2. REALISTIC MATCHA / SAGE LEAVES
            ================================================================== */}
        {/* Base thick glossy leaf */}
        <g transform="translate(60, 370)">
          <path
            d="M 0,15 C 40,-10 110,-15 180,5 C 220,18 240,38 210,50 C 140,65 50,55 0,15 Z"
            fill="url(#real-leaf-top)"
          />
          <path
            d="M 0,15 C 80,0 150,15 210,50"
            stroke="#4A5C39"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.6"
          />
        </g>
        {/* Secondary soft sage leaf */}
        <g transform="translate(180, 310)">
          <path
            d="M 0,20 C 30,0 90,5 135,35 C 100,55 45,50 0,20 Z"
            fill="url(#real-leaf-bot)"
            opacity="0.85"
          />
        </g>

        {/* ==================================================================
            3. REALISTIC BUDS (PROGRESSIVE DEVELOPMENT)
            ================================================================== */}
        {/* Tiny green tip bud */}
        <g transform="translate(710, 10)">
          <path d="M 0,2 C 4,-4 10,-3 12,2 C 10,7 3,7 0,2 Z" fill="#8DA578" />
          <circle cx="5" cy="2" r="1.5" fill="#E67E73" opacity="0.7" />
        </g>
        {/* Swelling opening bud */}
        <g transform="translate(660, 25) rotate(-25)">
          <path
            d="M 0,0 C 8,-12 22,-10 26,0 C 24,12 8,12 0,0 Z"
            fill="url(#real-petal-dorsal)"
            stroke="#F5B7B1"
            strokeWidth="0.75"
          />
          <path d="M 0,0 C 10,-3 18,-2 26,0" stroke="#7D9366" strokeWidth="1" />
          <path d="M -3,0 C 3,-6 8,-4 10,-1" fill="#7D9366" />
        </g>

        {/* ==================================================================
            4. BLOOM 1: FULL FRONTAL REALISTIC MOTH ORCHID (CENTER PIECE)
            ================================================================== */}
        <g transform="translate(360, 180)">
          {/* Back Sepals (3 natural pointed petals with soft translucency) */}
          {/* Top Dorsal Sepal */}
          <path
            d="M -16,-10 C -24,-52 -16,-88 0,-96 C 16,-88 24,-52 16,-10 C 8,-14 -8,-14 -16,-10 Z"
            fill="url(#real-petal-dorsal)"
            stroke="#FADBD8"
            strokeWidth="0.8"
          />
          <path d="M 0,-92 C 0,-40 0,-15 0,-10" stroke="#F5B7B1" strokeWidth="0.6" strokeDasharray="2 3" opacity="0.5" />

          {/* Lower Left Lateral Sepal */}
          <path
            d="M -12,8 C -42,20 -76,42 -68,72 C -52,90 -18,74 4,28 C -3,20 -8,14 -12,8 Z"
            fill="url(#real-petal-dorsal)"
            stroke="#FADBD8"
            strokeWidth="0.8"
          />
          {/* Lower Right Lateral Sepal */}
          <path
            d="M 12,8 C 42,20 76,42 68,72 C 52,90 18,74 -4,28 C 3,20 8,14 12,8 Z"
            fill="url(#real-petal-dorsal)"
            stroke="#FADBD8"
            strokeWidth="0.8"
          />

          {/* Large Undulating Lateral Petals (Signature Orchid Wings) */}
          {/* Left Wing Petal */}
          <path
            d="M -8,-10 C -42,-46 -94,-38 -108,-6 C -118,28 -76,56 -20,20 C -12,8 -8,-2 -8,-10 Z"
            fill="url(#real-petal-wing-left)"
            stroke="#FADBD8"
            strokeWidth="0.9"
          />
          <path
            d="M -15,0 C -48,-18 -82,-8 -92,4"
            stroke="#E67E73"
            strokeWidth="0.75"
            strokeDasharray="2 3"
            opacity="0.45"
          />

          {/* Right Wing Petal */}
          <path
            d="M 8,-10 C 42,-46 94,-38 108,-6 C 118,28 76,56 20,20 C 12,8 8,-2 8,-10 Z"
            fill="url(#real-petal-wing-right)"
            stroke="#FADBD8"
            strokeWidth="0.9"
          />
          <path
            d="M 15,0 C 48,-18 82,-8 92,4"
            stroke="#E67E73"
            strokeWidth="0.75"
            strokeDasharray="2 3"
            opacity="0.45"
          />

          {/* Soft central strawberry blush glow */}
          <circle cx="0" cy="4" r="28" fill="url(#real-throat-strawberry)" />

          {/* Complex Phalaenopsis Labellum (Lip Structure) */}
          {/* Side Lobes (Erect ears cradling column) */}
          <path
            d="M -16,4 C -26,-8 -20,-20 -10,-14 C -6,-4 -6,8 -8,16 Z"
            fill="url(#real-lip-gradient)"
          />
          <path
            d="M 16,4 C 26,-8 20,-20 10,-14 C 6,-4 6,8 8,16 Z"
            fill="url(#real-lip-gradient)"
          />

          {/* Mid-Lobe with anchor tip */}
          <path
            d="M -14,14 C -20,32 -15,50 0,58 C 15,50 20,32 14,14 C 5,18 -5,18 -14,14 Z"
            fill="url(#real-lip-gradient)"
          />

          {/* Cirrhi (Signature delicate curly tendril whiskers at lip tip) */}
          <path
            d="M -2,56 C -12,70 -20,66 -16,80 C -14,84 -8,82 -6,72"
            stroke="#922B21"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 2,56 C 12,70 20,66 16,80 C 14,84 8,82 6,72"
            stroke="#922B21"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />

          {/* Central Callus (Golden-yellow speckled crest) */}
          <ellipse cx="0" cy="8" rx="5" ry="4" fill="url(#real-callus-gold)" />
          {/* Fine berry dots on callus */}
          <circle cx="-2" cy="7" r="0.75" fill="#78281F" />
          <circle cx="0" cy="6" r="0.75" fill="#78281F" />
          <circle cx="2" cy="7" r="0.75" fill="#78281F" />
          <circle cx="-1" cy="9" r="0.75" fill="#78281F" />
          <circle cx="1" cy="9" r="0.75" fill="#78281F" />

          {/* White Column (Stamen / Anther Cap) */}
          <ellipse cx="0" cy="-2" rx="4" ry="5.5" fill="#FFFFFF" stroke="#F5B7B1" strokeWidth="0.6" />
        </g>

        {/* ==================================================================
            5. BLOOM 2: 3/4 PERSPECTIVE ORCHID (SOFT ANGLED BLOOM)
            ================================================================== */}
        <g transform="translate(190, 300) rotate(-18) scale(0.88)">
          {/* Sepals */}
          <path d="M -12,-8 C -18,-42 -12,-72 0,-78 C 12,-72 18,-42 12,-8 Z" fill="url(#real-petal-dorsal)" stroke="#FADBD8" strokeWidth="0.75" />
          <path d="M -10,6 C -34,16 -62,34 -55,58 C -42,72 -14,60 4,22 Z" fill="url(#real-petal-dorsal)" stroke="#FADBD8" strokeWidth="0.75" />
          <path d="M 10,6 C 34,16 62,34 55,58 C 42,72 14,60 -4,22 Z" fill="url(#real-petal-dorsal)" stroke="#FADBD8" strokeWidth="0.75" />

          {/* Wings */}
          <path d="M -6,-8 C -34,-38 -76,-30 -86,-4 C -95,22 -60,45 -16,16 Z" fill="url(#real-petal-wing-left)" stroke="#FADBD8" strokeWidth="0.8" />
          <path d="M 6,-8 C 34,-38 76,-30 86,-4 C 95,22 60,45 16,16 Z" fill="url(#real-petal-wing-right)" stroke="#FADBD8" strokeWidth="0.8" />

          {/* Throat & Lip */}
          <circle cx="0" cy="4" r="22" fill="url(#real-throat-strawberry)" />
          <path d="M -12,10 C -16,25 -12,40 0,46 C 12,40 16,25 12,10 Z" fill="url(#real-lip-gradient)" />
          <path d="M -2,45 C -8,56 -14,52 -12,62" stroke="#922B21" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <path d="M 2,45 C 8,56 14,52 12,62" stroke="#922B21" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <ellipse cx="0" cy="6" rx="4" ry="3" fill="url(#real-callus-gold)" />
          <ellipse cx="0" cy="-1" rx="3.5" ry="4.5" fill="#FFFFFF" />
        </g>

        {/* ==================================================================
            6. BLOOM 3: UPPER SIDE-PROFILE OPENING ORCHID
            ================================================================== */}
        <g transform="translate(470, 75) rotate(22) scale(0.72)">
          <path d="M -10,-6 C -16,-35 -10,-60 0,-65 C 10,-60 16,-35 10,-6 Z" fill="url(#real-petal-dorsal)" stroke="#FADBD8" strokeWidth="0.7" />
          <path d="M -6,-6 C -28,-30 -62,-24 -70,-3 C -78,18 -50,36 -12,12 Z" fill="url(#real-petal-wing-left)" stroke="#FADBD8" strokeWidth="0.75" />
          <path d="M 6,-6 C 28,-30 62,-24 70,-3 C 78,18 50,36 12,12 Z" fill="url(#real-petal-wing-right)" stroke="#FADBD8" strokeWidth="0.75" />
          <circle cx="0" cy="3" r="18" fill="url(#real-throat-strawberry)" />
          <path d="M -10,8 C -14,20 -10,32 0,38 C 10,32 14,20 10,8 Z" fill="url(#real-lip-gradient)" />
          <ellipse cx="0" cy="5" rx="3.5" ry="2.5" fill="url(#real-callus-gold)" />
        </g>

        {/* ==================================================================
            7. FLOATING NATURAL PETAL ACCENTS (AIRY WEDDING ROMANCE)
            ================================================================== */}
        <g transform="translate(100, 240) rotate(32)">
          <path d="M 0,0 C 18,-20 44,-8 32,22 C 16,30 0,20 0,0 Z" fill="url(#real-petal-wing-left)" stroke="#FADBD8" strokeWidth="0.6" opacity="0.9" />
          <path d="M 12,6 C 22,-2 32,6 28,16" stroke="#E67E73" strokeWidth="0.6" strokeDasharray="1.5 2" opacity="0.5" />
        </g>
        <g transform="translate(290, 390) rotate(-45)">
          <path d="M 0,0 C 15,-16 38,-6 26,18 C 14,26 0,16 0,0 Z" fill="url(#real-petal-wing-right)" stroke="#FADBD8" strokeWidth="0.6" opacity="0.85" />
        </g>
      </g>
    </motion.svg>
  );
}

/**
 * Natural botanical section divider with an authentic Phalaenopsis bloom,
 * wild strawberry blossoms, matcha leaves, and graceful curving stems.
 */
export function BotanicalDivider({ className }: { className?: string }) {
  return (
    <div className={`botanical-divider-wrapper ${className ?? ""}`} aria-hidden="true">
      <svg
        className="botanical-divider-svg"
        viewBox="0 0 840 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="div-stem-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7D9366" stopOpacity="0" />
            <stop offset="25%" stopColor="#7D9366" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#E67E73" stopOpacity="0.9" />
            <stop offset="75%" stopColor="#7D9366" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#7D9366" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="div-petal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#FFF7F6" />
            <stop offset="100%" stopColor="#F9D7D2" />
          </linearGradient>

          <linearGradient id="div-leaf-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B3C5A2" />
            <stop offset="100%" stopColor="#6C8257" />
          </linearGradient>

          <radialGradient id="div-throat-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C0392B" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#E67E73" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#FADBD8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Left & Right Elegant Stem Vines */}
        <path
          d="M 50,45 C 160,45 260,50 360,45"
          stroke="url(#div-stem-grad)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M 480,45 C 580,50 680,45 790,45"
          stroke="url(#div-stem-grad)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />

        {/* Left Matcha Leaves & Buds */}
        <path d="M 270,45 C 288,32 312,35 325,44 C 306,49 288,49 270,45 Z" fill="url(#div-leaf-grad)" opacity="0.9" />
        <path d="M 320,45 C 338,56 358,54 372,46 C 354,42 338,42 320,45 Z" fill="url(#div-leaf-grad)" opacity="0.8" />
        {/* Wild strawberry flower left */}
        <g transform="translate(240, 43)">
          <circle cx="0" cy="0" r="3.5" fill="#FFFFFF" stroke="#F5B7B1" strokeWidth="0.7" />
          <circle cx="0" cy="0" r="1.3" fill="#F39C12" />
        </g>

        {/* Right Matcha Leaves & Buds */}
        <path d="M 570,45 C 552,32 528,35 515,44 C 534,49 552,49 570,45 Z" fill="url(#div-leaf-grad)" opacity="0.9" />
        <path d="M 520,45 C 502,56 482,54 468,46 C 486,42 502,42 520,45 Z" fill="url(#div-leaf-grad)" opacity="0.8" />
        {/* Wild strawberry flower right */}
        <g transform="translate(600, 43)">
          <circle cx="0" cy="0" r="3.5" fill="#FFFFFF" stroke="#F5B7B1" strokeWidth="0.7" />
          <circle cx="0" cy="0" r="1.3" fill="#F39C12" />
        </g>

        {/* Central Realistic Moth Orchid */}
        <g transform="translate(420, 45) scale(0.68)">
          {/* Sepals */}
          <path d="M -12,-8 C -18,-38 -12,-66 0,-72 C 12,-66 18,-38 12,-8 Z" fill="url(#div-petal-grad)" stroke="#FADBD8" strokeWidth="0.8" />
          <path d="M -10,6 C -32,15 -58,32 -52,54 C -40,68 -14,56 3,20 Z" fill="url(#div-petal-grad)" stroke="#FADBD8" strokeWidth="0.8" />
          <path d="M 10,6 C 32,15 58,32 52,54 C 40,68 14,56 -3,20 Z" fill="url(#div-petal-grad)" stroke="#FADBD8" strokeWidth="0.8" />

          {/* Wings */}
          <path d="M -6,-8 C -32,-35 -72,-28 -82,-4 C -90,20 -58,42 -15,15 Z" fill="url(#div-petal-grad)" stroke="#FADBD8" strokeWidth="0.85" />
          <path d="M 6,-8 C 32,-35 72,-28 82,-4 C 90,20 58,42 15,15 Z" fill="url(#div-petal-grad)" stroke="#FADBD8" strokeWidth="0.85" />

          {/* Throat */}
          <circle cx="0" cy="3" r="22" fill="url(#div-throat-grad)" />

          {/* Lip & Whiskers */}
          <path d="M -11,10 C -15,24 -11,38 0,44 C 11,38 15,24 11,10 Z" fill="#C0392B" />
          <path d="M -2,42 C -8,52 -14,48 -11,58" stroke="#922B21" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <path d="M 2,42 C 8,52 14,48 11,58" stroke="#922B21" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <ellipse cx="0" cy="5" rx="3.5" ry="2.5" fill="#F39C12" />
          <ellipse cx="0" cy="-2" rx="3" ry="4" fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );
}

/**
 * Natural botanical corner accent with real orchid bloom and matcha foliage.
 */
export function BotanicalCornerAccent({
  position = "top-right",
  className = "",
}: {
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  className?: string;
}) {
  const transformMap = {
    "top-right": "",
    "top-left": "scaleX(-1)",
    "bottom-right": "scaleY(-1)",
    "bottom-left": "scale(-1, -1)",
  };

  return (
    <div
      className={`botanical-corner-accent botanical-corner-accent--${position} ${className}`}
      aria-hidden="true"
      style={{ transform: transformMap[position] }}
    >
      <svg
        viewBox="0 0 110 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="botanical-corner-svg"
      >
        <defs>
          <linearGradient id="cor-leaf-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B3C5A2" />
            <stop offset="100%" stopColor="#6C8257" />
          </linearGradient>
          <linearGradient id="cor-petal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#FFF7F6" />
            <stop offset="100%" stopColor="#F9D7D2" />
          </linearGradient>
        </defs>

        {/* Arching corner stem */}
        <path
          d="M 105,8 C 85,8 55,25 38,52 C 22,78 8,95 8,105"
          stroke="#7D9366"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* Matcha Leaf */}
        <path
          d="M 68,22 C 50,10 40,22 48,38 C 64,34 72,28 68,22 Z"
          fill="url(#cor-leaf-grad)"
          opacity="0.9"
        />

        {/* Natural Phalaenopsis bloom */}
        <g transform="translate(76, 26) rotate(-22) scale(0.38)">
          <path d="M -12,-8 C -18,-38 -12,-66 0,-72 C 12,-66 18,-38 12,-8 Z" fill="url(#cor-petal-grad)" stroke="#FADBD8" strokeWidth="0.8" />
          <path d="M -10,6 C -32,15 -58,32 -52,54 C -40,68 -14,56 3,20 Z" fill="url(#cor-petal-grad)" stroke="#FADBD8" strokeWidth="0.8" />
          <path d="M 10,6 C 32,15 58,32 52,54 C 40,68 14,56 -3,20 Z" fill="url(#cor-petal-grad)" stroke="#FADBD8" strokeWidth="0.8" />

          <path d="M -6,-8 C -32,-35 -72,-28 -82,-4 C -90,20 -58,42 -15,15 Z" fill="url(#cor-petal-grad)" stroke="#FADBD8" strokeWidth="0.85" />
          <path d="M 6,-8 C 32,-35 72,-28 82,-4 C 90,20 58,42 15,15 Z" fill="url(#cor-petal-grad)" stroke="#FADBD8" strokeWidth="0.85" />

          <circle cx="0" cy="3" r="22" fill="#E67E73" opacity="0.8" />
          <path d="M -11,10 C -15,24 -11,38 0,44 C 11,38 15,24 11,10 Z" fill="#C0392B" />
          <ellipse cx="0" cy="5" rx="3.5" ry="2.5" fill="#F39C12" />
        </g>

        {/* Small wild strawberry flower bud */}
        <g transform="translate(24, 80)">
          <circle cx="0" cy="0" r="4.5" fill="#FFFFFF" stroke="#F5B7B1" strokeWidth="0.7" />
          <circle cx="0" cy="0" r="1.6" fill="#F39C12" />
        </g>
      </svg>
    </div>
  );
}

/**
 * Romantic closing botanical garland with realistic cascading orchids,
 * matcha foliage, and pastel strawberry blossoms.
 */
export function RsvpBotanicalCluster({ className }: { className?: string }) {
  return (
    <div className={`rsvp-botanical-cluster ${className ?? ""}`} aria-hidden="true">
      <svg
        viewBox="0 0 700 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="rsvp-botanical-svg"
      >
        <defs>
          <linearGradient id="rsvp-real-petal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#FFF7F6" />
            <stop offset="100%" stopColor="#F9D7D2" />
          </linearGradient>

          <linearGradient id="rsvp-real-leaf" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B3C5A2" />
            <stop offset="100%" stopColor="#5E744A" />
          </linearGradient>

          <radialGradient id="rsvp-real-throat" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C0392B" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#E67E73" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#FADBD8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Symmetrical arching botanical stems */}
        <path
          d="M 50,240 C 170,180 260,130 350,130 C 440,130 530,180 650,240"
          stroke="#7D9366"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* Matcha Foliage */}
        <path d="M 260,145 C 210,110 170,135 160,170 C 205,170 240,158 260,145 Z" fill="url(#rsvp-real-leaf)" opacity="0.9" />
        <path d="M 440,145 C 490,110 530,135 540,170 C 495,170 460,158 440,145 Z" fill="url(#rsvp-real-leaf)" opacity="0.9" />

        {/* Center Grand Bloom */}
        <g transform="translate(350, 125) scale(0.85)">
          <path d="M -16,-10 C -24,-52 -16,-88 0,-96 C 16,-88 24,-52 16,-10 Z" fill="url(#rsvp-real-petal)" stroke="#FADBD8" strokeWidth="0.8" />
          <path d="M -12,8 C -42,20 -76,42 -68,72 C -52,90 -18,74 4,28 Z" fill="url(#rsvp-real-petal)" stroke="#FADBD8" strokeWidth="0.8" />
          <path d="M 12,8 C 42,20 76,42 68,72 C 52,90 18,74 -4,28 Z" fill="url(#rsvp-real-petal)" stroke="#FADBD8" strokeWidth="0.8" />

          <path d="M -8,-10 C -42,-46 -94,-38 -108,-6 C -118,28 -76,56 -20,20 Z" fill="url(#rsvp-real-petal)" stroke="#FADBD8" strokeWidth="0.9" />
          <path d="M 8,-10 C 42,-46 94,-38 108,-6 C 118,28 76,56 20,20 Z" fill="url(#rsvp-real-petal)" stroke="#FADBD8" strokeWidth="0.9" />

          <circle cx="0" cy="4" r="28" fill="url(#rsvp-real-throat)" />
          <path d="M -14,14 C -20,32 -15,50 0,58 C 15,50 20,32 14,14 Z" fill="#C0392B" />
          <path d="M -2,56 C -12,70 -20,66 -16,80" stroke="#922B21" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <path d="M 2,56 C 12,70 20,66 16,80" stroke="#922B21" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <ellipse cx="0" cy="8" rx="5" ry="4" fill="#F39C12" />
          <ellipse cx="0" cy="-2" rx="4" ry="5.5" fill="#FFFFFF" />
        </g>

        {/* Flanking Side Blooms */}
        <g transform="translate(220, 175) rotate(-22) scale(0.65)">
          <path d="M -12,-8 C -18,-38 -12,-66 0,-72 C 12,-66 18,-38 12,-8 Z" fill="url(#rsvp-real-petal)" stroke="#FADBD8" strokeWidth="0.8" />
          <path d="M -6,-8 C -32,-35 -72,-28 -82,-4 C -90,20 -58,42 -15,15 Z" fill="url(#rsvp-real-petal)" stroke="#FADBD8" strokeWidth="0.85" />
          <path d="M 6,-8 C 32,-35 72,-28 82,-4 C 90,20 58,42 15,15 Z" fill="url(#rsvp-real-petal)" stroke="#FADBD8" strokeWidth="0.85" />
          <circle cx="0" cy="3" r="20" fill="url(#rsvp-real-throat)" />
          <path d="M -10,8 C -14,20 -10,32 0,38 C 10,32 14,20 10,8 Z" fill="#C0392B" />
        </g>

        <g transform="translate(480, 175) rotate(22) scale(0.65)">
          <path d="M -12,-8 C -18,-38 -12,-66 0,-72 C 12,-66 18,-38 12,-8 Z" fill="url(#rsvp-real-petal)" stroke="#FADBD8" strokeWidth="0.8" />
          <path d="M -6,-8 C -32,-35 -72,-28 -82,-4 C -90,20 -58,42 -15,15 Z" fill="url(#rsvp-real-petal)" stroke="#FADBD8" strokeWidth="0.85" />
          <path d="M 6,-8 C 32,-35 72,-28 82,-4 C 90,20 58,42 15,15 Z" fill="url(#rsvp-real-petal)" stroke="#FADBD8" strokeWidth="0.85" />
          <circle cx="0" cy="3" r="20" fill="url(#rsvp-real-throat)" />
          <path d="M -10,8 C -14,20 -10,32 0,38 C 10,32 14,20 10,8 Z" fill="#C0392B" />
        </g>

        {/* Scattered strawberry blossoms & petals */}
        <g transform="translate(120, 215)">
          <circle cx="0" cy="0" r="5.5" fill="#FFFFFF" stroke="#F5B7B1" strokeWidth="0.75" />
          <circle cx="0" cy="0" r="2" fill="#F39C12" />
        </g>
        <g transform="translate(580, 215)">
          <circle cx="0" cy="0" r="5.5" fill="#FFFFFF" stroke="#F5B7B1" strokeWidth="0.75" />
          <circle cx="0" cy="0" r="2" fill="#F39C12" />
        </g>
      </svg>
    </div>
  );
}
