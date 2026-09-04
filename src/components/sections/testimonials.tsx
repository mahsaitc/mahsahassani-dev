import { Quote } from 'lucide-react';
import { SectionHeading } from '@/components/section-heading';
import { Reveal, RevealItem } from '@/components/fx/reveal';
import { Card, CardBody } from '@/components/ui/card';

interface Quote {
  quote: string;
  name: string;
  role: string;
  initials: string;
  source?: string;
}

export function Testimonials({ items = [] }: { items?: Quote[] }) {
  // Nothing published yet — render nothing rather than placeholder filler.
  if (items.length === 0) return null;

  const testimonials = items;

  return (
    <section id="words" className="section-pad relative">
      <div className="container">
        <SectionHeading
          eyebrow="In their words"
          title="What working with me looks like."
          align="center"
        />

        <Reveal group delay={0.1} className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <RevealItem key={t.name} dir="auto">
              <Card className="h-full">
                <CardBody className="flex h-full flex-col">
                  <Quote className="size-7 text-gold/40" aria-hidden />
                  <blockquote className="mt-5 flex-1 text-sm leading-relaxed text-muted-foreground" dir="auto">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-7 flex items-center gap-3 border-t border-border/60 pt-5">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full border border-gold/30 bg-gold/5 font-display text-sm text-gold">
                      {t.initials}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-foreground" dir="auto">{t.name}</span>
                      <span className="block truncate text-xs text-muted-foreground" dir="auto">{t.role}</span>
                    </span>
                  </figcaption>
                </CardBody>
              </Card>
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
