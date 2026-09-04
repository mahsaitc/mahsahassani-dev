'use client';

import { motion } from 'framer-motion';
import { viewportOnce, ease } from '@/lib/motion';
import { SectionHeading } from '@/components/section-heading';
import { Reveal, RevealItem } from '@/components/fx/reveal';
import { TechIcon } from '@/components/tech-icon';
import { Card, CardBody } from '@/components/ui/card';

interface SkillGroupProps {
  id: string;
  title: string;
  blurb: string;
  skills: { name: string; icon: string; level: number; note: string }[];
}

export function Skills({ groups = [] }: { groups?: SkillGroupProps[] }) {
  // Nothing stored yet — hide the section rather than render an empty grid.
  if (groups.length === 0) return null;

  const skillGroups = groups;

  return (
    <section id="skills" className="section-pad relative">
      {/* Ambient wash keeps the section from reading as a flat spec sheet. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 -z-10 size-[70vw] -translate-x-1/2 rounded-full bg-gold/[0.05] blur-[160px]"
      />

      <div className="container">
        <SectionHeading
          eyebrow="Capabilities"
          title="The stack I reach for, and why."
          description="Not a list of everything I have touched — the tools I am genuinely fast in, grouped by where they sit in a system."
          align="center"
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          {skillGroups.map((group, gi) => (
            <Reveal key={group.id} delay={gi * 0.08}>
              <Card className="group h-full">
                <CardBody className="flex h-full flex-col">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-display text-2xl text-foreground">{group.title}</h3>
                    <span className="font-mono text-xs text-gold/70">
                      {String(gi + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{group.blurb}</p>

                  <ul className="mt-7 space-y-5">
                    {group.skills.map((skill, si) => (
                      <li key={skill.name}>
                        <div className="flex items-center gap-3.5">
                          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-foreground/[0.03] text-muted-foreground transition-all duration-500 group-hover:border-gold/30 group-hover:text-gold">
                            <TechIcon name={skill.icon} className="size-5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-3">
                              <span className="text-sm font-medium text-foreground">
                                {skill.name}
                              </span>
                              <span className="hidden text-xs text-muted-foreground sm:block">
                                {skill.note}
                              </span>
                            </div>

                            {/* Meter animates from the left on entry; width is the only thing that moves. */}
                            <div
                              role="meter"
                              aria-valuenow={skill.level}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`${skill.name} proficiency`}
                              className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-border/70"
                            >
                              <motion.span
                                initial={{ scaleX: 0 }}
                                whileInView={{ scaleX: skill.level / 100 }}
                                viewport={viewportOnce}
                                transition={{ duration: 1, delay: 0.15 + si * 0.07, ease }}
                                className="block h-full origin-left rounded-full bg-gold-sheen"
                              />
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            </Reveal>
          ))}
        </div>

        <Reveal group delay={0.15} className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { k: 'Architecture', v: 'Clean Architecture · CQRS · DDD-lite' },
            { k: 'Practices', v: 'TDD where it pays · CI on every push' },
            { k: 'Delivery', v: 'Docker Compose · VPS · static export' },
          ].map((item) => (
            <RevealItem key={item.k}>
              <div className="rounded-2xl border border-border/70 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-gold">{item.k}</p>
                <p className="mt-2 text-sm text-muted-foreground">{item.v}</p>
              </div>
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
