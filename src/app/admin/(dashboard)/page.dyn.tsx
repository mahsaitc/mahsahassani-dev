'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { get } from '@/lib/admin-fetch';
import type { ApiAuditEntry, ApiPost, ApiProject, ApiTestimonial, Paged } from '@/lib/api-types';
import { Panel } from '@/components/admin/ui';

interface Counts {
  posts: number;
  drafts: number;
  projects: number;
  testimonials: number;
}

export default function OverviewPage() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [recent, setRecent] = useState<ApiAuditEntry[]>([]);

  useEffect(() => {
    (async () => {
      // Settled rather than all: one failing endpoint should not blank the page.
      const [posts, projects, testimonials, audit] = await Promise.allSettled([
        get<ApiPost[]>('posts'),
        get<ApiProject[]>('projects'),
        get<ApiTestimonial[]>('content/testimonials/all'),
        get<Paged<ApiAuditEntry>>('audit?pageSize=8'),
      ]);

      const postList = posts.status === 'fulfilled' ? posts.value : [];

      setCounts({
        posts: postList.length,
        drafts: postList.filter((p) => p.status === 'Draft').length,
        projects: projects.status === 'fulfilled' ? projects.value.length : 0,
        testimonials: testimonials.status === 'fulfilled' ? testimonials.value.length : 0,
      });

      if (audit.status === 'fulfilled') setRecent(audit.value.items);
    })();
  }, []);

  const tiles = [
    { label: 'Posts', value: counts?.posts, sub: counts ? `${counts.drafts} draft` : '', href: '/admin/posts' },
    { label: 'Projects', value: counts?.projects, href: '/admin/projects' },
    { label: 'Testimonials', value: counts?.testimonials, href: '/admin/content' },
  ];

  return (
    <>
      <h1 className="mb-6 text-lg font-medium">Overview</h1>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="rounded-lg border border-border bg-white/[0.02] p-4 transition-colors hover:border-gold/30"
          >
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{tile.label}</p>
            <p className="mt-2 font-serif text-3xl text-gold">{tile.value ?? '—'}</p>
            {tile.sub && <p className="mt-1 text-xs text-muted-foreground">{tile.sub}</p>}
          </Link>
        ))}
      </div>

      <Panel title="Recent activity">
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nothing recorded yet.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {recent.map((entry) => (
              <li key={entry.id} className="flex items-baseline gap-3 py-2 first:pt-0 last:pb-0">
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {new Date(entry.atUtc).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">
                  <span className="text-foreground">{entry.userEmail}</span> — {entry.summary}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
