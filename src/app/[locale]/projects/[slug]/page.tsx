import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Github, Star, GitFork, CircleDot } from 'lucide-react';
import { type CaseSection } from '@/data/projects';
import { loadProject, loadProjects } from '@/lib/content';
import { fetchRepoStats } from '@/lib/github';
import { videoIfPresent } from '@/lib/media';
import { site } from '@/lib/site';
import { compactNumber } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Reveal, RevealItem } from '@/components/fx/reveal';
import { Aurora } from '@/components/fx/aurora';
import { CaseMedia } from '@/components/case-media';

export const revalidate = 60;

/** Pre-renders every case study at build time — required for static export. */
export async function generateStaticParams() {
  const all = await loadProjects();
  return all.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: { locale: string; slug: string } }): Promise<Metadata> {
  const project = await loadProject(params.slug, params.locale);
  if (!project) return { title: 'Project not found' };

  const title = `${project.name} — ${project.tagline}`;
  const url = `${site.url}/projects/${project.slug}`;

  return {
    title,
    description: project.summary,
    keywords: project.tech,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      type: 'article',
      title,
      description: project.summary,
      url,
      images: [{ url: project.media.poster, alt: project.media.alt }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: project.summary,
      images: [project.media.poster],
    },
  };
}

export default async function ProjectPage({ params }: { params: { locale: string; slug: string } }) {
  const project = await loadProject(params.slug, params.locale);
  if (!project) notFound();

  const stats = await fetchRepoStats(project.repoName);

  const all = await loadProjects(params.locale);
  const index = all.findIndex((p) => p.slug === project.slug);
  const next = all[(index + 1) % all.length];

  const hasArchitecture = Boolean(
    project.architecture?.overview ||
      project.architecture?.layers?.length ||
      project.architecture?.flow?.length,
  );

  const present = [
    project.challenge && 'challenge',
    project.solution && 'solution',
    hasArchitecture && 'architecture',
    project.outcome && 'outcome',
  ].filter(Boolean) as string[];

  const num = (key: string) => String(present.indexOf(key) + 1).padStart(2, '0');

  const narrativeSections = [
    project.challenge && { ...project.challenge, label: `${num('challenge')} — Challenge` },
    project.solution && { ...project.solution, label: `${num('solution')} — Solution` },
  ].filter(Boolean) as (CaseSection & { label: string })[];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: project.name,
    description: project.summary,
    codeRepository: project.repo,
    programmingLanguage: project.tech,
    author: { '@type': 'Person', name: site.name, url: site.url },
  };

  return (
    <article className="relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="relative overflow-hidden pb-16 pt-36 md:pt-44">
        <Aurora className="opacity-70" />

        <div className="container relative">
          <Link
            href="/#work"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-gold"
          >
            <ArrowLeft className="size-4" />
            All work
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            {project.status && (
              <Badge variant={project.status === 'Live' ? 'live' : 'default'}>
                <CircleDot className="size-3" />
                {project.status}
              </Badge>
            )}
            <Badge variant="outline">{project.year}</Badge>
            {project.role && <Badge variant="outline">{project.role}</Badge>}
          </div>

          <h1 className="mt-6 max-w-4xl font-display text-5xl font-light leading-[1.03] tracking-tight text-balance md:text-7xl">
            {project.name}
            <span className="mt-3 block text-2xl text-muted-foreground md:text-3xl">
              {project.tagline}
            </span>
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">
            {project.summary}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button asChild>
              <a href={project.repo} target="_blank" rel="noreferrer noopener">
                <Github />
                View source
              </a>
            </Button>
            {project.demo && (
              <Button asChild variant="outline">
                <a href={project.demo} target="_blank" rel="noreferrer noopener">
                  Live demo
                  <ArrowUpRight />
                </a>
              </Button>
            )}
            {stats && (stats.stars > 0 || stats.forks > 0) && (
              <div className="ml-1 flex items-center gap-4 font-mono text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Star className="size-3.5 text-gold" />
                  {compactNumber(stats.stars)} stars
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <GitFork className="size-3.5" />
                  {compactNumber(stats.forks)} forks
                </span>
                {stats.language && <span className="hidden sm:inline">{stats.language}</span>}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container">
        <Reveal>
          <CaseMedia
            poster={project.media.poster}
            video={project.media.video?.startsWith('http') ? project.media.video : videoIfPresent(project.media.video)}
            alt={project.media.alt}
          />
        </Reveal>

        {project.metrics && project.metrics.length > 0 && (
          <Reveal group delay={0.1} className="mt-8 grid gap-4 sm:grid-cols-3">
            {project.metrics.map((m) => (
              <RevealItem key={m.label}>
                <Card>
                  <CardBody className="py-6">
                    <p className="font-display text-4xl text-gold">{m.value}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {m.label}
                    </p>
                  </CardBody>
                </Card>
              </RevealItem>
            ))}
          </Reveal>
        )}

        <div className="mt-20 grid gap-16 lg:grid-cols-[1fr_320px] lg:gap-20">
          <div className="space-y-16">
            {narrativeSections.map((section, i) => (
              <Reveal key={section.heading}>
                <section>
                  <p className="mb-3 font-mono text-xs uppercase tracking-[0.24em] text-gold">
                    {section.label}
                  </p>
                  <h2 className="font-display text-3xl leading-tight text-foreground md:text-4xl">
                    {section.heading}
                  </h2>
                  <p className="mt-5 text-base leading-relaxed text-muted-foreground text-pretty">
                    {section.body}
                  </p>
                  {section.bullets && (
                    <ul className="mt-6 space-y-3">
                      {section.bullets.map((b) => (
                        <li key={b} className="flex gap-3 text-sm text-muted-foreground">
                          <span className="mt-2 size-1 shrink-0 rounded-full bg-gold" />
                          <span className="leading-relaxed">{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </Reveal>
            ))}

            {hasArchitecture && (
            <Reveal>
              <section>
                <p className="mb-3 font-mono text-xs uppercase tracking-[0.24em] text-gold">
                  {num('architecture')} — Architecture
                </p>
                <h2 className="font-display text-3xl leading-tight text-foreground md:text-4xl">
                  How it is put together
                </h2>
                {project.architecture?.overview && (
                  <p className="mt-5 text-base leading-relaxed text-muted-foreground text-pretty">
                    {project.architecture.overview}
                  </p>
                )}

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {project.architecture?.layers?.map((layer, i) => (
                    <Card key={layer.name}>
                      <CardBody>
                        <div className="flex items-center gap-3">
                          <span className="grid size-7 place-items-center rounded-md border border-gold/30 bg-gold/5 font-mono text-[0.7rem] text-gold">
                            {i + 1}
                          </span>
                          <h3 className="font-medium text-foreground">{layer.name}</h3>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                          {layer.detail}
                        </p>
                      </CardBody>
                    </Card>
                  ))}
                </div>

                {project.architecture?.flow && project.architecture.flow.length > 0 && (
                <div className="mt-8 rounded-2xl border border-border/70 p-6">
                  <p className="mb-5 text-xs uppercase tracking-[0.22em] text-gold">Request flow</p>
                  <ol className="space-y-4">
                    {project.architecture.flow.map((step, i) => (
                      <li key={step} className="flex gap-4">
                        <span className="relative flex flex-col items-center">
                          <span className="grid size-6 shrink-0 place-items-center rounded-full border border-gold/40 font-mono text-[0.65rem] text-gold">
                            {i + 1}
                          </span>
                          {i < (project.architecture?.flow?.length ?? 0) - 1 && (
                            <span className="mt-1 h-full w-px flex-1 bg-border" />
                          )}
                        </span>
                        <span className="pb-1 text-sm leading-relaxed text-muted-foreground">
                          {step}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
                )}
              </section>
            </Reveal>
            )}

            {project.outcome && (
            <Reveal>
              <section>
                <p className="mb-3 font-mono text-xs uppercase tracking-[0.24em] text-gold">
                  {num('outcome')} — Outcome
                </p>
                <h2 className="font-display text-3xl leading-tight text-foreground md:text-4xl">
                  {project.outcome.heading}
                </h2>
                <p className="mt-5 text-base leading-relaxed text-muted-foreground text-pretty">
                  {project.outcome.body}
                </p>
                {project.outcome.bullets && (
                  <ul className="mt-6 space-y-3">
                    {project.outcome.bullets.map((b) => (
                      <li key={b} className="flex gap-3 text-sm text-muted-foreground">
                        <span className="mt-2 size-1 shrink-0 rounded-full bg-emerald" />
                        <span className="leading-relaxed">{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </Reveal>
            )}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <Card>
              <CardBody>
                <h2 className="text-xs uppercase tracking-[0.22em] text-gold">Stack</h2>
                <ul className="mt-4 space-y-2.5">
                  {project.stack.map((s) => (
                    <li key={s} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <span className="size-1 rounded-full bg-gold/70" />
                      {s}
                    </li>
                  ))}
                </ul>

                {project.role && (
                  <div className="mt-6 border-t border-border/60 pt-6">
                    <h2 className="text-xs uppercase tracking-[0.22em] text-gold">Role</h2>
                    <p className="mt-3 text-sm text-muted-foreground">{project.role}</p>
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-2 border-t border-border/60 pt-6">
                  <a
                    href={project.repo}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm text-foreground transition-colors hover:border-gold/40 hover:text-gold"
                  >
                    Repository <Github className="size-4" />
                  </a>
                  {project.demo && (
                    <a
                      href={project.demo}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm text-foreground transition-colors hover:border-gold/40 hover:text-gold"
                    >
                      Live demo <ArrowUpRight className="size-4" />
                    </a>
                  )}
                </div>
              </CardBody>
            </Card>
          </aside>
        </div>

        <Reveal className="my-24">
          <Link
            href={`/projects/${next.slug}`}
            className="group flex flex-col gap-4 rounded-2xl border border-border/70 p-8 transition-colors duration-500 hover:border-gold/40 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Next case study
              </p>
              <p className="mt-2 font-display text-3xl text-foreground transition-colors group-hover:text-gold">
                {next.name}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{next.tagline}</p>
            </div>
            <ArrowUpRight className="size-6 text-muted-foreground transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-gold" />
          </Link>
        </Reveal>
      </div>
    </article>
  );
}
