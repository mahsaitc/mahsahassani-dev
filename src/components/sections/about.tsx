import { Stethoscope, Cpu, Sparkles } from 'lucide-react';
import { site } from '@/lib/site';
import { principles } from '@/data/skills';
import { SectionHeading } from '@/components/section-heading';
import { Reveal, RevealItem } from '@/components/fx/reveal';
import { Card, CardBody } from '@/components/ui/card';

/**
 * Renders one paragraph, turning **text** into the emphasised span the design
 * uses. Keeps the inline highlight editable from the dashboard instead of
 * flattening the copy to plain text.
 */
function Paragraph({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);

  return (
    <p dir="auto">
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <span key={i} className="text-foreground">
            {part.slice(2, -2)}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}

export function About({
  headline,
  body,
  availability,
  location,
}: {
  headline?: string;
  body?: string;
  availability?: string;
  location?: string;
}) {
  const resolvedHeadline = headline?.trim() || site.about.headline;
  // Same two values the Contact section shows; both come from the CMS so the
  // page cannot state one location here and a different one further down.
  const resolvedAvailability = availability?.trim() || site.availability;
  const resolvedLocation = location?.trim() || site.location;
  const paragraphs = (body?.trim() || site.about.body)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section id="about" className="section-pad relative">
      <div className="container">
        <div className="grid gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          <div>
            <SectionHeading eyebrow="About" title={resolvedHeadline} />

            <Reveal delay={0.1} className="mt-8 space-y-5 text-base leading-relaxed text-muted-foreground text-pretty">
              {paragraphs.map((text, i) => (
                <Paragraph key={i} text={text} />
              ))}
            </Reveal>

            <Reveal delay={0.2} className="mt-9 flex flex-wrap gap-3">
              {[
                { icon: Cpu, label: 'Computer Engineering — Software Design' },
                { icon: Stethoscope, label: 'General Medicine background' },
                { icon: Sparkles, label: 'Automation & applied AI' },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground/[0.03] px-4 py-2 text-xs text-muted-foreground"
                >
                  <Icon className="size-3.5 text-gold" />
                  {label}
                </span>
              ))}
            </Reveal>
          </div>

          <Reveal group delay={0.1} className="grid gap-4 sm:grid-cols-2 lg:mt-4">
            {principles.map((p) => (
              <RevealItem key={p.title}>
                <Card className="h-full transition-transform duration-500 hover:-translate-y-1">
                  <CardBody>
                    <span className="mb-4 block h-px w-8 bg-gold/70" />
                    <h3 className="font-display text-xl text-foreground">{p.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                  </CardBody>
                </Card>
              </RevealItem>
            ))}

            <RevealItem className="sm:col-span-2">
              <Card className="relative overflow-hidden">
                <CardBody className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-gold">Currently</p>
                    <p className="mt-2 font-display text-2xl text-foreground">
                      {resolvedAvailability}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{resolvedLocation}</p>
                  </div>
                  <a
                    href="#contact"
                    className="shrink-0 rounded-full border border-gold/40 px-5 py-2.5 text-sm text-gold transition-colors hover:bg-gold/10"
                  >
                    Get in touch
                  </a>
                </CardBody>
              </Card>
            </RevealItem>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
