import type { Variants, Transition } from 'framer-motion';

/**
 * One easing curve for the whole site. Mixed easings are the fastest way to make
 * a page feel assembled from parts rather than designed.
 */
export const ease = [0.22, 1, 0.36, 1] as const;

export const springy: Transition = { type: 'spring', stiffness: 240, damping: 28, mass: 0.8 };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.8, ease } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.6, ease } },
};

/** Parent wrapper: children inherit `hidden`/`show` and play in sequence. */
export const stagger = (delayChildren = 0, staggerChildren = 0.08): Variants => ({
  hidden: {},
  show: { transition: { delayChildren, staggerChildren } },
});

/** Shared viewport config so every section triggers at the same scroll offset. */
export const viewportOnce = { once: true, margin: '-12% 0px -12% 0px' } as const;
