'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import type { Project, TechTag } from '@/data/projects';
import type { RepoStats } from '@/lib/github';
import { cn } from '@/lib/utils';
import { SectionHeading } from '@/components/section-heading';
import { Reveal } from '@/components/fx/reveal';
import { ProjectCard } from '@/components/project-card';

type Sort = 'featured' | 'newest' | 'name';

const sorts: { id: Sort; label: string }[] = [
  { id: 'featured', label: 'Featured' },
  { id: 'newest', label: 'Newest' },
  { id: 'name', label: 'A–Z' },
];

export function Projects({
  projects,
  filters,
  stats,
  videos,
}: {
  /** Loaded server-side from the CMS, falling back to the static file. */
  projects: Project[];
  /** Tags derived from the loaded projects, so a new one appears in the bar. */
  filters: TechTag[];
  stats?: Record<string, RepoStats>;
  /** Slug -> clip path, present only for clips that actually resolve. */
  videos?: Record<string, string | undefined>;
}) {
  const [filter, setFilter] = useState<TechTag | 'All'>('All');
  const [sort, setSort] = useState<Sort>('featured');

  /**
   * Filtering and sorting are derived, never stored. Keeping a second array in
   * state is how these components drift out of sync with their source data.
   */
  const visible = useMemo(() => {
    const list = filter === 'All' ? projects : projects.filter((p) => p.tech.includes(filter));
    return [...list].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'newest') return b.year.localeCompare(a.year) || a.name.localeCompare(b.name);
      return Number(b.featured) - Number(a.featured) || b.year.localeCompare(a.year);
    });
  }, [filter, sort, projects]);

  const counts = useMemo(() => {
    const map = new Map<string, number>([['All', projects.length]]);
    filters.forEach((t) => map.set(t, projects.filter((p) => p.tech.includes(t)).length));
    return map;
  }, [projects, filters]);

  return (
    <section id="work" className="section-pad relative">
      <div className="container">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Selected work"
            title="Five systems, five different shapes."
            description="Open a case study for how each one is actually put together — the layers, the datastore, and what was deliberately left out."
            className="max-w-2xl"
          />

          <Reveal delay={0.15} className="flex shrink-0 items-center gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Sort</span>
            <div className="flex rounded-full border border-border p-1">
              {sorts.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSort(s.id)}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-xs transition-colors duration-300',
                    sort === s.id
                      ? 'bg-gold/15 text-gold'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="mt-10">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 mask-fade-x">
            <SlidersHorizontal className="size-4 shrink-0 text-gold" aria-hidden />
            <LayoutGroup id="project-filters">
              <div className="flex gap-2" role="group" aria-label="Filter projects by technology">
                {(['All', ...filters] as const).map((tag) => {
                  const isActive = filter === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setFilter(tag as TechTag | 'All')}
                      aria-pressed={isActive}
                      className={cn(
                        'relative shrink-0 rounded-full border px-4 py-2 text-xs transition-colors duration-300',
                        isActive
                          ? 'border-gold/40 text-gold'
                          : 'border-border text-muted-foreground hover:border-gold/25 hover:text-foreground',
                      )}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="filter-pill"
                          className="absolute inset-0 rounded-full bg-gold/10"
                          transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                        />
                      )}
                      <span className="relative">
                        {tag}
                        <span className="ms-1.5 text-[0.65rem] opacity-60">{counts.get(tag)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>
          </div>
        </Reveal>

        <motion.div layout className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visible.map((project, i) => (
              <ProjectCard
                key={project.slug}
                project={project}
                stats={stats?.[project.slug]}
                video={videos?.[project.slug]}
                index={i}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {visible.length === 0 && (
          <p className="mt-16 text-center text-sm text-muted-foreground">
            Nothing matches that filter yet.
          </p>
        )}
      </div>
    </section>
  );
}
