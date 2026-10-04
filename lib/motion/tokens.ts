/**
 * Motion Tokens & Scene Definitions
 * Designed for Contemporary Botanical Minimalist aesthetic.
 * All transitions prioritize transform + opacity and provide reduced-motion fallbacks.
 */

export const motionTokens = {
  duration: {
    instant: 0,
    micro: 0.15,
    quick: 0.3,
    base: 0.5,
    slow: 0.8,
    scene: 1.2,
    introTotal: 6.5,
  },
  ease: {
    // Custom editorial curve: gentle start, expressive acceleration, soft deceleration
    editorial: [0.2, 0.7, 0.2, 1] as const,
    editorialOut: [0.16, 1, 0.3, 1] as const,
    paperSlide: [0.25, 1, 0.5, 1] as const,
    waxCrack: [0.34, 1.56, 0.64, 1] as const,
    bloom: [0.34, 1.3, 0.64, 1] as const,
  },
  spring: {
    gentle: { stiffness: 120, damping: 20, mass: 1 },
    bouncy: { stiffness: 260, damping: 20 },
    snappy: { stiffness: 400, damping: 30 },
  },
  stagger: {
    tight: 0.06,
    base: 0.12,
    loose: 0.2,
  },
} as const;

export const motionVariants = {
  // Editorial Photo Reveal: Masked wipe with gentle scale settle (NOT a fade-up)
  photoReveal: {
    hidden: {
      clipPath: "inset(12% 0% 12% 0%)",
      scale: 1.08,
      opacity: 0,
    },
    visible: {
      clipPath: "inset(0% 0% 0% 0%)",
      scale: 1,
      opacity: 1,
      transition: {
        duration: motionTokens.duration.slow,
        ease: motionTokens.ease.editorialOut,
      },
    },
    reduced: {
      clipPath: "none",
      scale: 1,
      opacity: 1,
      transition: { duration: 0.2 },
    },
  },

  // Botanical Stroke Draw: calibrated for SVG paths with pathLength
  pathDraw: {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (customDelay: number = 0) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: {
          delay: customDelay,
          duration: motionTokens.duration.scene,
          ease: motionTokens.ease.editorial,
        },
        opacity: {
          delay: customDelay,
          duration: motionTokens.duration.quick,
        },
      },
    }),
    reduced: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 0 },
    },
  },

  // Timeline Draw: self-drawing vertical line as section enters viewport
  timelineTrack: {
    hidden: { scaleY: 0, originY: 0 },
    visible: {
      scaleY: 1,
      originY: 0,
      transition: {
        duration: 1.4,
        ease: motionTokens.ease.editorialOut,
      },
    },
    reduced: {
      scaleY: 1,
      transition: { duration: 0 },
    },
  },

  // RSVP Success: Orchid Bloom + Confirmation
  bloomSuccess: {
    hidden: { scale: 0.5, opacity: 0, rotate: -8 },
    visible: {
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: {
        duration: motionTokens.duration.base,
        ease: motionTokens.ease.bloom,
      },
    },
    reduced: {
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: { duration: 0.2 },
    },
  },
} as const;
