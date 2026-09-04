import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Clock } from 'lucide-react';
import { loadPost, loadPosts, type PostBlock as Block } from '@/lib/content';
import { site } from '@/lib/site';
import { getTranslations } from 'next-intl/server';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Aurora } from '@/components/fx/aurora';
import { Reveal } from '@/components/fx/reveal';

/**
 * Same one-minute window as the rest of the site, so publishing from the
 * dashboard reaches /blog without a rebuild.
 */
export const revalidate = 60;


export async function generateStaticParams() {
  const all = await loadPosts();
  return all.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: { locale: string; slug: string } }): Promise<Metadata> {
  const post = await loadPost(params.slug, params.locale);
  if (!post) return { title: 'Post not found' };

  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      url: `${site.url}/blog/${post.slug}`,
      publishedTime: post.date ?? undefined,
      authors: [site.name],
      tags: post.tags,
    },
    twitter: { card: 'summary_large_image', title: post.title, description: post.excerpt },
  };
}

/** Block renderer. Adding a block type means one case here and one union member. */
function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'h2':
      return (
        <h2 className="mt-14 font-display text-3xl leading-tight text-foreground">{block.text}</h2>
      );
    case 'p':
      return <p className="mt-6 leading-[1.85] text-muted-foreground text-pretty">{block.text}</p>;
    case 'ul':
      return (
        <ul className="mt-6 space-y-3">
          {block.items.map((item) => (
            <li key={item} className="flex gap-3 text-muted-foreground">
              <span className="mt-2.5 size-1 shrink-0 rounded-full bg-gold" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      );
    case 'quote':
      return (
        <blockquote className="my-10 border-l-2 border-gold/60 pl-6 font-display text-2xl leading-relaxed text-foreground">
          {block.text}
        </blockquote>
      );
    case 'code':
      return (
        <div className="my-8 overflow-hidden rounded-xl border border-border">
          <div className="flex items-center justify-between border-b border-border bg-foreground/[0.03] px-4 py-2">
            <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-gold">
              {block.lang}
            </span>
            <span className="flex gap-1.5">
              <span className="size-2 rounded-full bg-border" />
              <span className="size-2 rounded-full bg-border" />
              <span className="size-2 rounded-full bg-gold/40" />
            </span>
          </div>
          <pre dir="ltr" className="overflow-x-auto p-5 text-left text-sm leading-relaxed">
            <code className="font-mono text-foreground/90">{block.code}</code>
          </pre>
        </div>
      );
  }
}

export default async function PostPage({ params }: { params: { locale: string; slug: string } }) {
  const post = await loadPost(params.slug, params.locale);
  if (!post) notFound();

  const t = await getTranslations('writing');

  const all = await loadPosts(params.locale);
  const index = all.findIndex((p) => p.slug === post.slug);
  const next = all[(index + 1) % all.length];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    keywords: post.tags.join(', '),
    author: { '@type': 'Person', name: site.name, url: site.url },
    mainEntityOfPage: `${site.url}/blog/${post.slug}`,
  };

  return (
    <article className="relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="relative overflow-hidden pb-10 pt-36 md:pt-44">
        <Aurora className="opacity-50" />
        <div className="container relative max-w-3xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-gold"
          >
            <ArrowLeft className="size-4" />
            {t('backToWriting')}
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-xs">
            <time dateTime={post.date ?? undefined} className="font-mono uppercase tracking-[0.16em] text-gold">
              {formatDate(post.date, params.locale)}
            </time>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Clock className="size-3" />
              {t('minRead', { minutes: post.readingMinutes })}
            </span>
          </div>

          <h1 className="mt-5 font-display text-4xl font-light leading-[1.08] tracking-tight text-balance md:text-6xl">
            {post.title}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
            {post.excerpt}
          </p>
          <div className="mt-6 flex flex-wrap gap-1.5">
            {post.tags.map((t) => (
              <Badge key={t} variant="gold">
                {t}
              </Badge>
            ))}
          </div>
        </div>
      </header>

      <div className="container max-w-3xl pb-24">
        <div className="h-px w-full gold-rule" />
        <div className="mt-10">
          {post.body.map((block, i) => (
            <BlockView key={i} block={block} />
          ))}
        </div>

        <Reveal className="mt-20">
          <Link
            href={`/blog/${next.slug}`}
            className="group flex items-center justify-between gap-6 rounded-2xl border border-border/70 p-7 transition-colors duration-500 hover:border-gold/40"
          >
            <span>
              <span className="block text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Read next
              </span>
              <span className="mt-2 block font-display text-2xl text-foreground transition-colors group-hover:text-gold">
                {next.title}
              </span>
            </span>
            <ArrowUpRight className="size-5 shrink-0 text-muted-foreground transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-gold" />
          </Link>
        </Reveal>
      </div>
    </article>
  );
}
