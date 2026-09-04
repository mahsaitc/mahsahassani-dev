import { Inter, Cormorant_Garamond, JetBrains_Mono, Vazirmatn } from 'next/font/google';

/**
 * Fonts are declared here so the root layout and the locale layout share one
 * definition rather than each calling next/font separately, which would emit
 * two copies of the same @font-face rules.
 */

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
  variable: '--font-display',
});

export const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

/**
 * Persian face. Vazirmatn covers Arabic script and ships matching Latin glyphs,
 * so mixed strings — "React", "ASP.NET Core" inside a Persian sentence — stay
 * visually consistent instead of falling back mid-line.
 *
 * next/font only emits the preload and @font-face when the class is actually
 * rendered, so English pages never download it.
 */
export const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  display: 'swap',
  // Overrides --font-sans and --font-display so headings and body both switch
  // without every component needing a locale-aware font class.
  variable: '--font-fa',
});

/** Font variables that every route needs, regardless of locale. */
export const baseFontClass = `${inter.variable} ${cormorant.variable} ${mono.variable}`;

/**
 * Extra font class for a locale. Persian adds Vazirmatn plus `font-fa`, a
 * utility in globals.css that repoints --font-sans and --font-display at it.
 */
export function localeFontClass(locale: string): string {
  return locale === 'fa' ? `${vazirmatn.variable} font-fa` : '';
}
