import type { Metadata, Viewport } from 'next';
import { getLocale } from 'next-intl/server';
import { baseFontClass, localeFontClass } from '@/lib/fonts';
import { isRtl } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { Toaster } from 'sonner';
import './globals.css';
import { site } from '@/lib/site';

/**
 * `display: swap` keeps text visible during font load — the single biggest
 * cheap win for LCP on a type-driven page like this one.
 */
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.title}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  keywords: [...site.keywords],
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  applicationName: site.name,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: site.locale,
    url: site.url,
    siteName: site.name,
    title: `${site.name} — ${site.title}`,
    description: site.description,
    images: [
      { url: site.ogImage, width: 1200, height: 630, alt: `${site.name} — ${site.title}` },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} — ${site.title}`,
    description: site.description,
    images: [site.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  category: 'technology',
};

export const viewport: Viewport = {
  themeColor: '#0B0A09',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

/** Person schema so search engines resolve the site to a named professional. */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  /**
   * Resolved here rather than in the [locale] segment because dir and lang have
   * to be on <html>, which only the root layout renders. Admin routes never go
   * through the locale middleware, so getLocale falls back to the default and
   * the dashboard stays English and ltr.
   */
  const locale = await getLocale().catch(() => 'en');
  const rtl = isRtl(locale);

  return (
    <html lang={locale} dir={rtl ? 'rtl' : 'ltr'} className={cn(baseFontClass, localeFontClass(locale))}>
      <body className="noise relative min-h-screen overflow-x-hidden bg-background">
        {/*
          Only document-level concerns live here. The public header, footer,
          cursor and scroll progress belong to the (site) route group: the
          header is fixed and z-indexed, so rendering it for every route put it
          on top of the dashboard's own chrome.
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
