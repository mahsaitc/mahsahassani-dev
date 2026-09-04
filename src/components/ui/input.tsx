import * as React from 'react';
import { cn } from '@/lib/utils';

const field =
  'w-full rounded-xl border border-border bg-foreground/[0.02] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors duration-300 focus:border-gold/60 focus:bg-foreground/[0.04] focus:outline-none disabled:opacity-50 aria-[invalid=true]:border-destructive/70';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(field, 'h-12', className)} {...props} />
  ),
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(field, 'min-h-[160px] resize-y', className)} {...props} />
));
Textarea.displayName = 'Textarea';

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('mb-2 block text-xs uppercase tracking-[0.18em] text-muted-foreground', className)}
      {...props}
    />
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-2 text-xs text-destructive">{children}</p>;
}
