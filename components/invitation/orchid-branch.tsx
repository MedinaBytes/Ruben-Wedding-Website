"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

/**
 * Authentic botanical orchid branch using real, high-resolution photographic
 * orchid references with natural petals, volumetric shading, and organic stems.
 */
export function OrchidBranch({
  className,
  variant = "matcha",
}: {
  className?: string;
  variant?: "matcha" | "pink";
}) {
  const shouldReduceMotion = useReducedMotion();
  const initial = shouldReduceMotion ? false : { opacity: 0, scale: 0.94, y: 8 };
  const animate = { opacity: 1, scale: 1, y: 0 };
  const transition = { duration: 1.1, ease: [0.2, 0.7, 0.2, 1] as const };

  const src = variant === "matcha" ? "/images/botanicals/orchid-matcha.webp" : "/images/botanicals/orchid-pink.webp";
  const width = variant === "matcha" ? 387 : 646;
  const height = variant === "matcha" ? 516 : 475;
  const alt = variant === "matcha" ? "Real matcha green orchid botanical branch" : "Real blush pink orchid botanical branch";

  return (
    <motion.div
      aria-hidden="true"
      className={className}
      initial={initial}
      animate={animate}
      transition={transition}
      style={{ pointerEvents: "none" }}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="orchid-botanical-img"
        priority
        unoptimized
        style={{
          width: "100%",
          height: "auto",
          objectFit: "contain",
          filter: "drop-shadow(0 14px 32px oklch(0.2 0.03 120 / 0.12))",
        }}
      />
    </motion.div>
  );
}
