'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Github, Linkedin } from 'lucide-react';
import { site } from '@/lib/site';
import { marqueeSkills as fallbackMarquee } from '@/data/skills';
import { ease } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { Aurora } from '@/components/fx/aurora';
import { Magnetic } from '@/components/fx/magnetic';

/**
 * Renders `**text**` as the highlighted span, matching the About body so both
 * pieces of CMS prose use one convention.
 */
function Emphasised({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/(\*\*[^*]+\*\*)/g)
        .filter(Boolean)
        .map((part, i) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <span key={i} className="text-foreground">
              {part.slice(2, -2)}
            </span>
          ) : (
            <span key={i}>{part}</span>
          ),
        )}
    </>
  );
}

export function Hero({
  availability,
  marquee = [],
  github,
  linkedin,
  headline,
  intro,
}: {
  availability?: string;
  headline?: string;
  intro?: string;
  /** Skill names from the CMS; falls back to the static list when empty. */
  marquee?: string[];
  github?: string;
  linkedin?: string;
}) {
  const marqueeSkills = marquee.length > 0 ? marquee : fallbackMarquee;
  const availabilityLine = availability?.trim() || site.availability;

  // One line per row; the final row takes the gold accent, so the emphasis
  // follows the copy rather than a hardcoded index.
  const words = (headline?.trim() || site.hero.headline)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const introText = intro?.trim() || site.hero.intro;
  const githubUrl = github?.trim() || site.github.url;
  const linkedinUrl = linkedin?.trim() || site.linkedin.url;

  const ref = useRef<HTMLElement>(null);
  const calm = useReducedMotion();

  /**
   * Parallax is driven by the hero's own scroll progress rather than window
   * scroll, so the effect stays correct regardless of what sits above it.
   * Layers move at different rates — that difference is the whole illusion.
   */
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const yTitle = useTransform(scrollYProgress, [0, 1], [0, calm ? 0 : -90]);
  const yGlow = useTransform(scrollYProgress, [0, 1], [0, calm ? 0 : -180]);
  // Sits between the title and the glow so the three layers separate in depth.
  const yImage = useTransform(scrollYProgress, [0, 1], [0, calm ? 0 : -130]);
  const yFloor = useTransform(scrollYProgress, [0, 1], [0, calm ? 0 : 60]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, calm ? 1 : 0]);

  return (
    <section
      ref={ref}
      id="hero"
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden pt-28"
    >
      <motion.div style={{ y: yGlow }} className="absolute inset-0">
        <Aurora />
      </motion.div>

      {/*
        Mobile: full-bleed behind the copy, dimmed so text stays legible.
        Desktop: confined to the end side behind the stats block; the radial
        mask dissolves its edges into the dark background instead of showing a frame.
        In RTL the mask centre and the image mirror, so the fade always faces the
        copy. The flip lives on <Image> because framer-motion owns this transform.
      */}
      <motion.div
        style={{ y: yImage }}
        className="pointer-events-none absolute inset-0 opacity-25 md:inset-y-0 md:start-auto md:end-0 md:w-[62%] md:opacity-90 rtl:md:opacity-70 [mask-image:radial-gradient(ellipse_70%_65%_at_62%_48%,#000_30%,transparent_78%)] rtl:[mask-image:radial-gradient(ellipse_70%_65%_at_38%_48%,#000_30%,transparent_78%)]"
      >
        <Image
          src="/images/hero.jpg"
          alt="Layered glass planes linked by fine gold wireframe lines, lit by a warm glow — an abstract take on layered software architecture"
          fill
          priority
          sizes="(min-width: 768px) 62vw, 100vw"
          className="object-cover object-[70%_center] rtl:-scale-x-100"
        />
      </motion.div>

      <motion.div style={{ y: yTitle, opacity }} className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-gold/25 bg-gold/[0.06] px-4 py-1.5 text-xs tracking-wide text-gold"
        >
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald" />
          </span>
          {availabilityLine}
        </motion.div>

        <h1 className="sr-only">
          {site.name} — {site.title}
        </h1>

        <div aria-hidden className="font-display text-[13vw] font-light leading-[0.92] tracking-[-0.02em] md:text-[8.5vw] lg:text-[7.5rem]">
          {words.map((word, i) => (
            <span key={word} dir="auto" className="block overflow-hidden">
              <motion.span
                initial={{ y: '110%' }}
                animate={{ y: 0 }}
                transition={{ duration: 1, delay: 0.12 + i * 0.11, ease }}
                className={i === words.length - 1 ? 'block gold-text animate-shimmer' : 'block text-foreground'}
              >
                {word}
              </motion.span>
            </span>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease }}
          className="mt-10 grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-end"
        >
          <div>
            <p dir="auto" className="max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
              <Emphasised text={introText} />
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Magnetic>
                <Button asChild size="lg">
                  <a href="#work">
                    View selected work
                    <ArrowUpRight />
                  </a>
                </Button>
              </Magnetic>
              <Magnetic>
                <Button asChild size="lg" variant="outline">
                  <a href="#contact">Start a conversation</a>
                </Button>
              </Magnetic>
              <div className="ms-1 flex items-center gap-1">
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="GitHub"
                  className="grid size-11 place-items-center rounded-full border border-border text-muted-foreground transition-all duration-300 hover:border-gold/50 hover:text-gold"
                >
                  <Github className="size-4" />
                </a>
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="LinkedIn"
                  className="grid size-11 place-items-center rounded-full border border-border text-muted-foreground transition-all duration-300 hover:border-gold/50 hover:text-gold"
                >
                  <Linkedin className="size-4" />
                </a>
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-4 border-s border-border/70 ps-6 md:ps-8">
            {[
              { k: 'Public repositories', v: '5' },
              { k: 'Tests passing', v: '623' },
              { k: 'Clean Architecture', v: '4 of 5' },
            ].map((stat, i) => (
              <motion.div
                key={stat.k}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 + i * 0.1, ease }}
              >
                <dt dir="auto" className="text-[0.7rem] uppercase leading-tight tracking-[0.14em] text-muted-foreground">
                  {stat.k}
                </dt>
                <dd dir="auto" className="mt-1.5 font-display text-3xl text-gold">{stat.v}</dd>
              </motion.div>
            ))}
          </dl>
        </motion.div>
      </motion.div>

      {/* Infinite technology strip. Duplicated once so the -50% translation loops seamlessly. */}
      <motion.div
        style={{ y: yFloor }}
        className="relative z-10 mt-16 border-y border-border/50 py-4 mask-fade-x"
      >
        <div className="flex w-max animate-marquee gap-10 hover:[animation-play-state:paused]">
          {[...marqueeSkills, ...marqueeSkills].map((s, i) => (
            <span
              key={`${s}-${i}`}
              className="whitespace-nowrap font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground/70"
            >
              {s}
              <span className="ms-10 text-gold/50">◆</span>
            </span>
          ))}
        </div>
      </motion.div>

    </section>
  );
}
