import { cn } from '@/lib/utils';
import { Reveal } from '@/components/fx/reveal';

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        'max-w-2xl',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      <div
        className={cn(
          'mb-5 flex items-center gap-3',
          align === 'center' && 'justify-center',
        )}
      >
        <span className="h-px w-8 bg-gold/60" />
        <span className="text-xs uppercase tracking-[0.28em] text-gold">{eyebrow}</span>
      </div>
      <h2 dir="auto" className="font-display text-4xl font-light leading-[1.08] tracking-tight text-foreground text-balance md:text-6xl">
        {title}
      </h2>
      {description && (
        <p dir="auto" className="mt-6 text-base leading-relaxed text-muted-foreground text-pretty md:text-lg">
          {description}
        </p>
      )}
    </Reveal>
  );
}
