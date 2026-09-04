'use client';

import { useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/utils';

const locales = [
  { code: 'en', label: 'EN', title: 'English' },
  { code: 'fa', label: 'فارسی', title: 'فارسی' },
] as const;

/**
 * Switches locale while staying on the current page.
 *
 * `usePathname` from the routing helpers returns the path *without* the locale
 * prefix, so the same value works for either target — no string surgery on the
 * URL, and no assumption that every route exists at the same depth.
 *
 * The returned path already has dynamic segments filled in, so
 * /en/projects/rxclinic lands on /fa/projects/rxclinic rather than the index.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const active = useLocale();
  const pathname = usePathname();

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-border p-0.5',
        className,
      )}
      role="group"
      aria-label="Switch language"
    >
      {locales.map((locale) => {
        const isActive = locale.code === active;

        return (
          <Link
            key={locale.code}
            href={pathname}
            locale={locale.code}
            hrefLang={locale.code}
            lang={locale.code}
            aria-current={isActive ? 'true' : undefined}
            className={cn(
              'rounded-full px-2.5 py-1 text-xs transition-colors duration-300',
              isActive
                ? 'bg-gold/15 text-gold'
                : 'text-muted-foreground hover:text-foreground',
            )}
            title={locale.title}
          >
            {locale.label}
          </Link>
        );
      })}
    </div>
  );
}
