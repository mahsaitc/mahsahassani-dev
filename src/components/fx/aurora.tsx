'use client';

import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Ambient background: three blurred colour fields plus a faint grid.
 * Pure CSS animation rather than canvas — it costs no main-thread work and the
 * compositor handles it, so scroll stays at 60fps on mid-range phones.
 */
export function Aurora({ className }: { className?: string }) {
  const calm = useReducedMotion();

  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div className="absolute inset-0 bg-radial-fade" />
      <div
        className={cn(
          'absolute -left-[10%] top-[-20%] size-[60vw] rounded-full bg-gold/[0.10] blur-[120px]',
          !calm && 'animate-aurora',
        )}
      />
      <div
        className={cn(
          'absolute -right-[15%] top-[10%] size-[45vw] rounded-full bg-emerald/[0.06] blur-[130px]',
          !calm && 'animate-aurora [animation-delay:-6s]',
        )}
      />
      <div
        className={cn(
          'absolute bottom-[-25%] left-[25%] size-[50vw] rounded-full bg-gold/[0.07] blur-[140px]',
          !calm && 'animate-aurora [animation-delay:-12s]',
        )}
      />
      <div className="absolute inset-0 bg-grid bg-[size:72px_72px] opacity-[0.35] mask-fade-y" />
    </div>
  );
}
