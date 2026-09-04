import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge conditional classes and let later Tailwind utilities win conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Empty string for a missing date, so an unpublished post renders no stray
 * separator. Persian uses the Gregorian calendar with Persian month names —
 * `fa` alone would switch to the Solar Hijri calendar, which would disagree
 * with the English version of the same post.
 */
export function formatDate(iso: string | null | undefined, locale = 'en') {
  if (!iso) return '';
  const tag = locale === 'fa' ? 'fa-IR-u-ca-gregory' : 'en-US';
  return new Date(iso).toLocaleDateString(tag, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function compactNumber(n: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}
