import Link from 'next/link';
import { ArrowUpRight, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { SectionHeading } from '@/components/section-heading';
import { Reveal, RevealItem } from '@/components/fx/reveal';
import { Badge } from '@/components/ui/badge';

export interface PostSummary {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  date: string | null;
  readingMinutes: number;
}

export function Writing({ posts = [] }: { posts?: PostSummary[] }) {
  // Nothing published yet — hide rather than render an empty "Writing" heading.
  if (posts.length === 0) return null;

  const sortedPosts = posts;

  return (
    <section id="writing" className="section-pad relative">
      <div className="container">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Writing"
            title="Notes from the parts that were hard."
            description="Short technical pieces about decisions that cost me something to get right."
          />
          <Reveal delay={0.15}>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm text-gold transition-opacity hover:opacity-80"
            >
              All posts <ArrowUpRight className="size-4" />
            </Link>
          </Reveal>
        </div>

        <Reveal group delay={0.1} className="mt-12 divide-y divide-border/60 border-y border-border/60">
          {sortedPosts.map((post) => (
            <RevealItem key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group flex flex-col gap-4 py-8 transition-colors md:flex-row md:items-center md:gap-10"
              >
                <div className="flex shrink-0 items-center gap-4 md:w-52 md:flex-col md:items-start md:gap-2">
                  <time
                    dateTime={post.date ?? undefined}
                    className="font-mono text-xs uppercase tracking-[0.14em] text-gold"
                  >
                    {formatDate(post.date)}
                  </time>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {post.readingMinutes} min read
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-2xl leading-snug text-foreground transition-colors duration-300 group-hover:text-gold md:text-3xl">
                    {post.title}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
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
    </section>
  );
}
