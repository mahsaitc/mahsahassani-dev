'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/**
 * Two-part cursor: a hard dot pinned to the real pointer position and a lagging
 * ring driven by a spring. The ring is what reads as "premium" — the dot keeps
 * clicking accurate, because a laggy cursor is unusable.
 *
 * Never mounts on touch devices or when the OS asks for reduced motion.
 */
export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 320, damping: 30, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 320, damping: 30, mass: 0.6 });

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || calm) return;

    setEnabled(true);
    document.documentElement.classList.add('cursor-none-desktop');

    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      const target = e.target as Element | null;
      setHovering(Boolean(target?.closest('a, button, [role="button"], input, textarea, [data-cursor="grow"]')));
    };
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);
    const onLeave = () => setVisible(false);

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    document.addEventListener('mouseleave', onLeave);

    return () => {
      document.documentElement.classList.remove('cursor-none-desktop');
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, [x, y]);

  if (!enabled) return null;

  return (
    // dir="ltr" is deliberate and not a text concern: the children are placed
    // by transform from clientX/clientY, which are always measured from the
    // viewport's left edge. Under RTL an absolutely positioned child with no
    // inset anchors to the *right* edge instead, which pushed the whole cursor
    // one viewport-width off-screen on /fa.
    <div
      aria-hidden
      dir="ltr"
      className="pointer-events-none fixed inset-0 z-[100] hidden md:block"
    >
      <motion.div
        className="absolute left-0 top-0 size-1.5 rounded-full bg-gold"
        style={{ x, y, translateX: '-50%', translateY: '-50%' }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        className="absolute left-0 top-0 grid place-items-center rounded-full border border-gold/60"
        style={{ x: ringX, y: ringY, translateX: '-50%', translateY: '-50%' }}
        animate={{
          width: hovering ? 52 : 30,
          height: hovering ? 52 : 30,
          opacity: visible ? (hovering ? 0.9 : 0.5) : 0,
          scale: pressed ? 0.8 : 1,
        }}
        transition={{ type: 'spring', stiffness: 340, damping: 26 }}
      >
        <motion.span
          className="size-full rounded-full bg-gold/10"
          animate={{ opacity: hovering ? 1 : 0 }}
          transition={{ duration: 0.25 }}
        />
      </motion.div>
    </div>
  );
}
