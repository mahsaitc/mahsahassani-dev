'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { fadeUp, stagger, viewportOnce } from '@/lib/motion';
import { cn } from '@/lib/utils';

type RevealProps = HTMLMotionProps<'div'> & {
  delay?: number;
  /** Turns this element into a stagger parent for nested <Reveal> children. */
  group?: boolean;
};

/**
 * Scroll-triggered entrance. `once` is deliberate: elements that re-animate on
 * every scroll-by feel like a demo, not a portfolio.
 */
export function Reveal({ children, className, delay = 0, group, ...props }: RevealProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      variants={group ? stagger(delay) : fadeUp}
      transition={group ? undefined : { delay }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Child of a `group` Reveal — inherits the parent's stagger timing. */
export function RevealItem({ children, className, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div variants={fadeUp} className={cn(className)} {...props}>
      {children}
    </motion.div>
  );
}
