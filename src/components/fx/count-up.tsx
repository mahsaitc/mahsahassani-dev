'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

/**
 * Counts to `value` when scrolled into view. Non-numeric strings (`<120 ms`,
 * `Full CQRS`) are rendered verbatim, so metric cards can mix both freely.
 */
export function CountUp({ value, duration = 1400 }: { value: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });
  const calm = useReducedMotion();

  const match = value.match(/^(\D*)(\d[\d.]*)(.*)$/);
  const target = match ? parseFloat(match[2]) : null;
  const [display, setDisplay] = useState(target === null || calm ? null : 0);

  useEffect(() => {
    if (!inView || target === null || calm) return;
    const decimals = (match?.[2].split('.')[1] ?? '').length;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // easeOutExpo: fast commit, soft landing.
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setDisplay(parseFloat((target * eased).toFixed(decimals)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, target, duration, calm, match]);

  if (target === null || display === null) return <span ref={ref}>{value}</span>;

  return (
    <span ref={ref}>
      {match?.[1]}
      {display}
      {match?.[3]}
    </span>
  );
}
