import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { loadSiteCopy } from '@/lib/content';
import { site } from '@/lib/site';
import { routing, type Locale } from '@/i18n/routing';
import { CustomCursor } from '@/components/fx/cursor';
import { ScrollProgress } from '@/components/fx/scroll-progress';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { DocumentShell } from '@/components/document-shell';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * hreflang for the locale root. Each page below adds its own alternates for its
 * own path; x-default points at English, which is the site's default locale.
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;

  return {
    alternates: {
      canonical: `${site.url}/${locale}`,
      languages: {
        en: `${site.url}/en`,
        fa: `${site.url}/fa`,
        'x-default': `${site.url}/en`,
      },
    },
  };
}

/**
 * Chrome for the public site only.
 *
 * This lives here rather than in the root layout because the marketing header
 * is `fixed inset-x-0 top-0 z-[75]`: rendering it for every route put it on top
 * of the dashboard's own chrome. The cursor and scroll-progress flourishes are
 * scoped for the same reason — a work tool should not have to opt out of them.
 */
function buildPersonJsonLd(copy: { email: string; github: string; linkedin: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.name,
    url: site.url,
    email: `mailto:${copy.email}`,
    jobTitle: site.title,
    description: site.description,
    // Only real profiles belong in sameAs; an unset link is omitted entirely.
    sameAs: [copy.github, copy.linkedin].filter(Boolean),
    knowsAbout: [...site.keywords],
  };
}

/**
 * Serialises JSON-LD for embedding in a script tag.
 *
 * The values come from CMS settings, so a contact URL containing `</script>`
 * would otherwise close the tag early and let the rest execute as markup.
 * Escaping `<` blocks that; the sequence stays valid JSON either way.
 */
function toJsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();

  // Required for static rendering of a [locale] segment.
  setRequestLocale(locale);

  const [copy, messages] = await Promise.all([loadSiteCopy(locale), getMessages()]);

  return (
    // dir, lang and the locale font come from this segment's own param.
    <DocumentShell locale={locale}>
      <NextIntlClientProvider messages={messages}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLdScript(buildPersonJsonLd(copy)) }}
        />

        <ScrollProgress />
        <CustomCursor />
        <SiteHeader />
        <main id="main" className="relative">
          {children}
        </main>
        <SiteFooter />
      </NextIntlClientProvider>
    </DocumentShell>
  );
}
