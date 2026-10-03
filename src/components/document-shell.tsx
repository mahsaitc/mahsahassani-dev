import { Toaster } from 'sonner';
import { baseFontClass, localeFontClass } from '@/lib/fonts';
import { isRtl } from '@/i18n/routing';
import { cn } from '@/lib/utils';

/**
 * <html> and <body> for one locale.
 *
 * Rendered by the layout that already knows the locale — [locale]/layout from
 * its params, the admin layout as English — rather than by the root layout.
 * The root layout has no locale param, so resolving it there meant reading
 * request headers, which fails when a page is rendered on demand (ISR) and
 * turned every post published after the build into a 500.
 */
export function DocumentShell({ locale, children }: { locale: string; children: React.ReactNode }) {
  return (
    <html lang={locale} dir={isRtl(locale) ? 'rtl' : 'ltr'} className={cn(baseFontClass, localeFontClass(locale))}>
      <body className="noise relative min-h-screen overflow-x-hidden bg-background">
        {/*
          Only document-level concerns live here. The public header, footer,
          cursor and scroll progress belong to the [locale] layout: the header
          is fixed and z-indexed, so rendering it for every route put it on top
          of the dashboard's own chrome.
        */}
        {children}

        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: 'glass !rounded-xl !border-border !text-foreground',
              description: '!text-muted-foreground',
            },
          }}
        />
      </body>
    </html>
  );
}
