'use client';

import { cn } from '@/lib/utils';
import { type ReactNode, forwardRef } from 'react';

/**
 * Dashboard primitives. These borrow the site's dark/gold palette but favour
 * density and legibility over the decoration the public pages use: no reveal
 * animations, no glass blur, tighter spacing, and inputs sized for typing
 * rather than for looking good in a screenshot.
 */

export function Field({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
        {required && <span className="text-gold/70">*</span>}
      </span>
      {children}
      {/* Errors replace hints rather than stacking, so the row height is stable. */}
      {error ? (
        <span className="mt-1.5 block text-xs text-red-400">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-muted-foreground/70">{hint}</span>
      ) : null}
    </label>
  );
}

const controlBase =
  'w-full rounded-md border bg-black/30 px-3 py-2 text-sm text-foreground outline-none transition-colors ' +
  'placeholder:text-muted-foreground/50 focus:border-gold/50 focus:ring-1 focus:ring-gold/30 ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function Input({ className, invalid, ...props }, ref) {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(controlBase, invalid ? 'border-red-500/60' : 'border-border', className)}
        {...props}
      />
    );
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ className, invalid, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(controlBase, 'resize-y', invalid ? 'border-red-500/60' : 'border-border', className)}
      {...props}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(function Select({ className, invalid, ...props }, ref) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(controlBase, invalid ? 'border-red-500/60' : 'border-border', className)}
      {...props}
    />
  );
});

export function Button({
  variant = 'primary',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const variants = {
    primary: 'bg-gold/90 text-black hover:bg-gold disabled:hover:bg-gold/90',
    ghost: 'border border-border text-foreground hover:border-gold/40 hover:text-gold',
    danger: 'border border-red-500/40 text-red-400 hover:bg-red-500/10',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium',
        'transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Panel({ title, actions, children, className }: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-lg border border-border bg-white/[0.02]', className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
          {title && <h2 className="text-sm font-medium text-foreground">{title}</h2>}
          {actions}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Banner({ kind, children }: { kind: 'error' | 'success' | 'info'; children: ReactNode }) {
  const styles = {
    error: 'border-red-500/40 bg-red-500/10 text-red-300',
    success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    info: 'border-border bg-white/[0.03] text-muted-foreground',
  };
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={cn('rounded-md border px-3.5 py-2.5 text-sm', styles[kind])}>
      {children}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-md border border-dashed border-border/70 px-4 py-10 text-center">
      <p className="text-sm text-foreground">{title}</p>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'gold' | 'green' | 'muted'; children: ReactNode }) {
  const tones = {
    neutral: 'border-border text-muted-foreground',
    gold: 'border-gold/40 text-gold',
    green: 'border-emerald-500/40 text-emerald-400',
    muted: 'border-border/60 text-muted-foreground/70',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[0.7rem]', tones[tone])}>
      {children}
    </span>
  );
}

/**
 * Persian counterpart to a field. Renders RTL so the author sees what visitors
 * will, and states the fallback rule inline: leaving it blank shows the English
 * text on /fa rather than an empty section.
 */
export function PersianField({
  label,
  error,
  multiline,
  rows = 3,
  value,
  onChange,
}: {
  label: string;
  error?: string;
  multiline?: boolean;
  rows?: number;
  value: string;
  onChange: (value: string) => void;
}) {
  const shared = {
    dir: 'rtl' as const,
    lang: 'fa',
    value,
    invalid: Boolean(error),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
  };

  return (
    <Field
      label={`${label} (فارسی)`}
      error={error}
      hint={value.trim() ? undefined : 'Empty — /fa will show the English version.'}
    >
      {multiline ? (
        <Textarea rows={rows} className="text-right" {...shared} />
      ) : (
        <Input className="text-right" {...shared} />
      )}
    </Field>
  );
}
