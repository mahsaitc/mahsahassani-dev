import type { Metadata, Viewport } from 'next';
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

/**
 * Pass-through. <html> and <body> are rendered by DocumentShell in the layout
 * that knows the locale ([locale]/layout, admin/layout, the root not-found), so no
 * request-dependent locale lookup ever happens here.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
