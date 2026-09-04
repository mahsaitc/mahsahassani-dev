import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

/**
 * Locale-prefixed routing for the public site only. The admin dashboard is
 * excluded in middleware and stays English.
 *
 * `always` prefixing means /en is explicit rather than bare `/`. That keeps the
 * two locales symmetric, makes hreflang unambiguous, and avoids a root route
 * whose language depends on a redirect.
 */
export const routing = defineRouting({
  locales: ['en', 'fa'],
  defaultLocale: 'en',
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];

/** Locale-aware replacements for next/link and next/navigation. */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);

/** Right-to-left locales. Drives dir on <html> and the rtl: Tailwind variants. */
export const rtlLocales: Locale[] = ['fa'];

export const isRtl = (locale: string) => rtlLocales.includes(locale as Locale);
