'use client';

import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { forwardRef, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Github, Play, Star, GitFork } from 'lucide-react';
import type { Project } from '@/data/projects';
import type { RepoStats } from '@/lib/github';
import { ease } from '@/lib/motion';
import { cn, compactNumber } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tilt } from '@/components/fx/tilt';
import { CountUp } from '@/components/fx/count-up';

interface ProjectCardProps {
  project: Project;
  stats?: RepoStats;
  /** Resolved on the server; undefined when the clip is not on disk yet. */
  video?: string;
  index: number;
}

/**
 * Forwards its ref because `AnimatePresence mode="popLayout"` measures the
 * outgoing element to keep the grid from jumping — without a ref it warns and
 * the exit animation loses its position lock.
 */
export const ProjectCard = forwardRef<HTMLElement, ProjectCardProps>(function ProjectCard(
  { project, stats, video, index },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoOk, setVideoOk] = useState(Boolean(video));
  const [playing, setPlaying] = useState(false);

  /**
   * The demo loop only starts on hover and is never preloaded: five autoplaying
   * videos would cost more bandwidth than the rest of the page combined.
   * `play()` rejects if the user navigates away mid-gesture — swallow it.
   */
  const start = () => {
    const v = videoRef.current;
    if (!v) return;
    v.play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  };

  const stop = () => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
    setPlaying(false);
  };

  return (
    <motion.article
      ref={ref}
      layout
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.3), ease }}
      className="group"
      onMouseEnter={start}
      onMouseLeave={stop}
    >
      <Tilt className="h-full">
        <div className="hairline-hover glass relative flex h-full flex-col overflow-hidden rounded-2xl transition-shadow duration-500 group-hover:shadow-lift">
          <Link
            href={`/projects/${project.slug}`}
            className="relative block aspect-[16/10] overflow-hidden bg-muted"
            aria-label={`Open the ${project.name} case study`}
           dir="auto">
            <Image
              src={project.media.poster}
              alt={project.media.alt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className={cn(
                'object-cover transition-all duration-700 group-hover:scale-[1.04]',
                playing && 'opacity-0',
              )}
              priority={index < 2}
            />

            {videoOk && (
              <video
                ref={videoRef}
                src={video}
                poster={project.media.poster}
                muted
                loop
                playsInline
                preload="none"
                aria-hidden
                onError={() => setVideoOk(false)}
                className={cn(
                  'absolute inset-0 size-full object-cover transition-opacity duration-500',
                  playing ? 'opacity-100' : 'opacity-0',
                )}
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-transparent to-background/40" />

            <div className="absolute start-4 top-4 flex items-center gap-2">
              {project.status && (
                <Badge variant={project.status === 'Live' ? 'live' : 'default'}>
                  <span className="size-1.5 rounded-full bg-current" />
                  {project.status}
                </Badge>
              )}
              <Badge variant="outline">{project.year}</Badge>
            </div>

            {videoOk && (
              <span
                className={cn(
                  'absolute bottom-4 end-4 inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-background/70 px-3 py-1.5 text-[0.7rem] text-gold backdrop-blur transition-opacity duration-300',
                  playing ? 'opacity-0' : 'opacity-100',
                )}
              >
                <Play className="size-3 fill-current" />
                Hover for demo
              </span>
            )}
          </Link>

          <div className="flex flex-1 flex-col p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl leading-tight text-foreground transition-colors duration-300 group-hover:text-gold">
                  <Link href={`/projects/${project.slug}`} dir="auto">{project.name}</Link>
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground" dir="auto">{project.tagline}</p>
              </div>
              {stats && (stats.stars > 0 || stats.forks > 0) && (
                <div className="flex shrink-0 flex-col items-end gap-1 pt-1 font-mono text-[0.7rem] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-3 text-gold" />
                    {compactNumber(stats.stars)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <GitFork className="size-3" />
                    {compactNumber(stats.forks)}
                  </span>
                </div>
              )}
            </div>

            <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground/90" dir="auto">
              {project.summary}
            </p>

            {project.metrics && project.metrics.length > 0 && (
              <dl
                className="mt-5 grid gap-3 border-y border-border/60 py-4"
                style={{ gridTemplateColumns: `repeat(${Math.min(project.metrics.length, 3)}, minmax(0, 1fr))` }}
              >
                {project.metrics.map((m) => (
                  <div key={m.label}>
                    <dd className="font-display text-lg text-gold">
                      <CountUp value={m.value} />
                    </dd>
                    <dt className="mt-0.5 text-[0.65rem] uppercase leading-tight tracking-[0.12em] text-muted-foreground">
                      {m.label}
                    </dt>
                  </div>
                ))}
              </dl>
            )}

            <div className="mt-5 flex flex-wrap gap-1.5">
              {project.tech.slice(0, 4).map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
              {project.tech.length > 4 && <Badge variant="outline">+{project.tech.length - 4}</Badge>}
            </div>

            <div className="mt-6 flex items-center gap-2 pt-1">
              <Link
                href={`/projects/${project.slug}`}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-gold/35 px-4 py-2.5 text-sm text-gold transition-colors duration-300 hover:bg-gold/10"
              >
                Case study
                <ArrowUpRight className="size-3.5" />
              </Link>
              <a
                href={project.repo}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`${project.name} on GitHub`}
                className="grid size-10 place-items-center rounded-full border border-border text-muted-foreground transition-colors duration-300 hover:border-gold/40 hover:text-gold"
               dir="auto">
                <Github className="size-4" />
              </a>
              {project.demo && (
                <a
                  href={project.demo}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`${project.name} live demo`}
                  className="grid size-10 place-items-center rounded-full border border-border text-muted-foreground transition-colors duration-300 hover:border-gold/40 hover:text-gold"
                 dir="auto">
                  <ArrowUpRight className="size-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </Tilt>
    </motion.article>
  );
});
