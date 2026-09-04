'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Send, Loader2 } from 'lucide-react';
import { contactSchema, type ContactInput } from '@/lib/validation';
import { site, isStaticExport } from '@/lib/site';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Label, FieldError } from '@/components/ui/input';

export function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    mode: 'onBlur',
  });

  /**
   * The same schema validates on the client and again in the route handler.
   * Client validation is a courtesy; the server copy is the one that matters.
   */
  const onSubmit = async (values: ContactInput) => {
    // Static export has no route handler to post to — hand off to the mail client.
    if (isStaticExport) {
      const body = encodeURIComponent(`${values.message}\n\n— ${values.name} (${values.email})`);
      window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(values.subject)}&body=${body}`;
      return;
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Request failed');
      }

      toast.success('Message sent.', { description: 'I usually reply within a day or two.' });
      reset();
    } catch (err) {
      toast.error('That did not go through.', {
        description: `Email me directly at ${site.email}.`,
      });
      // Surface the cause in the console for anyone debugging a self-hosted copy.
      console.error('[contact]', err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {/* Honeypot. Hidden from humans and screen readers, irresistible to bots. */}
      <div aria-hidden className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
        <label htmlFor="company">Company</label>
        <input id="company" tabIndex={-1} autoComplete="off" {...register('company')} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="Your name"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
          <FieldError>{errors.name?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
          <FieldError>{errors.email?.message}</FieldError>
        </div>
      </div>

      <div>
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          placeholder="What is this about?"
          aria-invalid={Boolean(errors.subject)}
          {...register('subject')}
        />
        <FieldError>{errors.subject?.message}</FieldError>
      </div>

      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          placeholder="Tell me about the system, the team, and what is currently painful."
          aria-invalid={Boolean(errors.message)}
          {...register('message')}
        />
        <FieldError>{errors.message?.message}</FieldError>
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" />
            Sending
          </>
        ) : (
          <>
            Send message
            <Send />
          </>
        )}
      </Button>
    </form>
  );
}
