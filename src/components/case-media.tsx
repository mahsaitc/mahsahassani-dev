'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Click-to-play hero media for a case study. The video is only fetched after the
 * click (`preload="none"` plus a late `src`), so the poster alone decides LCP.
 * A missing file falls back to the poster instead of an empty black box.
 */
export function CaseMedia({
  poster,
  video,
  alt,
}: {
  poster: string;
  video?: string;
  alt: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);
  const canPlay = Boolean(video) && !failed;

  return (
    <figure className="relative aspect-[16/9] overflow-hidden rounded-3xl border border-border bg-muted shadow-lift">
      <Image
        src={poster}
        alt={alt}
        fill
        priority
        sizes="(max-width: 1280px) 100vw, 1200px"
        className={cn('object-cover transition-opacity duration-500', started && 'opacity-0')}
      />

      {canPlay && (
        <video
          ref={ref}
          src={started ? video : undefined}
          poster={poster}
          controls={started}
          loop
          playsInline
          preload="none"
          onError={() => setFailed(true)}
          className={cn(
            'absolute inset-0 size-full object-cover transition-opacity duration-500',
            started ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        />
      )}

      {canPlay && !started && (
        <button
          type="button"
          onClick={() => {
            setStarted(true);
            // The src lands on the next paint; play once it exists.
            requestAnimationFrame(() => ref.current?.play().catch(() => setFailed(true)));
          }}
          className="group absolute inset-0 grid place-items-center bg-background/20 transition-colors hover:bg-background/10"
          aria-label="Play project demo"
        >
          <span className="grid size-20 place-items-center rounded-full border border-gold/40 bg-background/70 text-gold backdrop-blur transition-transform duration-500 group-hover:scale-110">
            <Play className="ms-1 size-7 fill-current rtl:-scale-x-100" />
          </span>
        </button>
      )}
    </figure>
  );
}
