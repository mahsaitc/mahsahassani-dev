'use client';

import { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Award, Briefcase, GraduationCap, Rocket, Sparkles } from 'lucide-react';
import { SectionHeading } from '@/components/section-heading';
import { Reveal } from '@/components/fx/reveal';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody } from '@/components/ui/card';

export type TimelineKind = 'work' | 'education' | 'milestone' | 'certification' | 'project';

const icons: Record<TimelineKind, typeof Briefcase> = {
  work: Briefcase,
  education: GraduationCap,
  milestone: Sparkles,
  certification: Award,
  project: Rocket,
};

export interface TimelineItem {
  kind: TimelineKind;
  period: string;
  title: string;
  org: string;
  summary: string;
  points: string[];
  tags: string[];
}

export function Timeline({ entries = [] }: { entries?: TimelineItem[] }) {
  const timeline = entries;
  const ref = useRef<HTMLDivElement>(null);

  /**
   * The spine fills as you scroll through the list. Offsets are set so it is
   * empty when the first entry enters and full as the last one settles.
   */
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 75%', 'end 55%'],
  });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 26, restDelta: 0.001 });

  // Only verified entries reach this component (see loadTimeline). With none
  // confirmed yet the section hides entirely rather than showing placeholders.
  // Placed after the hooks so their call order never changes between renders.
  if (timeline.length === 0) return null;

  return (
    <section id="journey" className="section-pad relative">
      <div className="container">
        <SectionHeading
          eyebrow="Journey"
          title="How I got here, in order."
          description="A route through two disciplines. The medicine years are not filler — they are where the diagnostic instinct came from."
        />

        <div ref={ref} className="relative mt-16 ps-8 md:ps-0">
          {/* Track + fill. The track is always visible so the layout never jumps. */}
          <div className="absolute start-[7px] top-2 h-full w-px bg-border md:start-1/2 md:-translate-x-1/2 md:rtl:translate-x-1/2" />
          <motion.div
            style={{ scaleY }}
            className="absolute start-[7px] top-2 h-full w-px origin-top bg-gradient-to-b from-gold via-gold/70 to-transparent md:start-1/2 md:-translate-x-1/2 md:rtl:translate-x-1/2"
          />

          <ol className="space-y-12 md:space-y-20">
            {timeline.map((entry, i) => {
              const Icon = icons[entry.kind] ?? Sparkles;
              const left = i % 2 === 0;

              return (
                <li key={entry.title} className="relative md:grid md:grid-cols-2 md:gap-14">
                  <span className="absolute -start-8 top-1.5 grid size-4 place-items-center md:start-1/2 md:-translate-x-1/2 md:rtl:translate-x-1/2">
                    <span className="absolute size-4 rounded-full bg-gold/20 blur-[3px]" />
                    <span className="relative size-2 rounded-full bg-gold ring-4 ring-background" />
                  </span>

                  <Reveal className={left ? 'md:col-start-1 md:pe-4' : 'md:col-start-2 md:ps-4'}>
                    <Card>
                      <CardBody>
                        <div className="flex items-center gap-2.5">
                          <Icon className="size-4 text-gold" />
                          <span className="font-mono text-xs uppercase tracking-[0.16em] text-gold">
                            {entry.period}
                          </span>
                        </div>

                        <h3 dir="auto" className="mt-3 font-display text-2xl text-foreground">
                          {entry.title}
                        </h3>
                        {entry.org && (
                          <p dir="auto" className="mt-1 text-sm text-muted-foreground">{entry.org}</p>
                        )}
                        {entry.summary && (
                          <p dir="auto" className="mt-4 text-sm leading-relaxed text-muted-foreground/90">
                            {entry.summary}
                          </p>
                        )}

                        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                          {entry.points.map((p) => (
                            <li key={p} className="flex gap-2.5 leading-relaxed">
                              <span className="text-gold/70">—</span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-5 flex flex-wrap gap-1.5">
                          {entry.tags.map((t) => (
                            <Badge key={t} variant="outline">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </CardBody>
                    </Card>
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
