'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * 3D hover tilt plus a specular highlight that tracks the pointer.
 * The highlight is what sells the glass; tilt alone reads as a cheap CSS trick.
 */
export function Tilt({
  children,
  className,
  max = 7,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const calm = useReducedMotion();

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 220, damping: 22 });
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 220, damping: 22 });
  const glareX = useTransform(px, (v) => `${v * 100}%`);
  const glareY = useTransform(py, (v) => `${v * 100}%`);

  if (calm) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={cn('relative [transform-style:preserve-3d]', className)}
      style={{ rotateX, rotateY, perspective: 1200 }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        px.set((e.clientX - r.left) / r.width);
        py.set((e.clientY - r.top) / r.height);
      }}
      onMouseLeave={() => {
        px.set(0.5);
        py.set(0.5);
      }}
    >
      {children}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 [background:radial-gradient(320px_circle_at_var(--gx)_var(--gy),hsl(var(--gold)/0.14),transparent_65%)] group-hover:opacity-100"
        style={{ ['--gx' as string]: glareX, ['--gy' as string]: glareY }}
      />
    </motion.div>
  );
}
