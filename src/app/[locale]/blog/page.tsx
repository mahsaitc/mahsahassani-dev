import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Clock } from 'lucide-react';
import { loadPosts } from '@/lib/content';
import { getTranslations } from 'next-intl/server';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Reveal, RevealItem } from '@/components/fx/reveal';
import { Aurora } from '@/components/fx/aurora';

/**
 * Same one-minute window as the rest of the site, so publishing from the
 * dashboard reaches /blog without a rebuild.
 */
export const revalidate = 60;


export const metadata: Metadata = {
  title: 'Writing',
  description:
    'Short technical essays on architecture, concurrency and realtime systems — from someone who had to get them right in production.',
  alternates: { canonical: '/blog' },
};

export default async function BlogIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sortedPosts = await loadPosts(locale);
  const t = await getTranslations('writing');

  return (
    <div className="relative">
      <header className="relative overflow-hidden pb-12 pt-36 md:pt-44">
        <Aurora className="opacity-60" />
        <div className="container relative">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-gold"
          >
            <ArrowLeft className="size-4" />
            Home
          </Link>
          <h1 className="mt-8 max-w-3xl font-display text-5xl font-light leading-[1.05] tracking-tight text-balance md:text-7xl">
            Notes from the parts that were <span className="gold-text">hard</span>.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
            Decisions that cost me something to get right, written down while the reasoning was
            still fresh.
          </p>
        </div>
      </header>

      <div className="container pb-28">
        <Reveal group className="divide-y divide-border/60 border-y border-border/60">
          {sortedPosts.map((post) => (
            <RevealItem key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group flex flex-col gap-4 py-10 md:flex-row md:items-start md:gap-12"
              >
                <div className="flex shrink-0 items-center gap-4 md:w-48 md:flex-col md:items-start md:gap-2">
                  <time
                    dateTime={post.date ?? undefined}
                    className="font-mono text-xs uppercase tracking-[0.14em] text-gold"
                  >
                    {formatDate(post.date, locale)}
                  </time>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {t('min', { minutes: post.readingMinutes })}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-3xl leading-snug text-foreground transition-colors duration-300 group-hover:text-gold">
                    {post.title}
                  </h2>
                  <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {post.tags.map((t) => (
                      <Badge key={t} variant="outline">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>

                <ArrowUpRight className="hidden size-5 shrink-0 text-muted-foreground transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-gold md:block" />
              </Link>
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </div>
  );
}
