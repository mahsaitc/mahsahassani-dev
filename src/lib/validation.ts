import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(80),
  email: z.string().trim().email('That does not look like an email address.').max(160),
  subject: z.string().trim().min(3, 'A short subject helps.').max(120),
  message: z
    .string()
    .trim()
    .min(20, 'Twenty characters minimum — give me something to work with.')
    .max(4000),
  /**
   * Honeypot: bots fill every field, humans never see this one. Deliberately
   * unconstrained — rejecting it here would return a 422 naming the field,
   * which tells a bot exactly what to skip next time. The route handler
   * answers 200 instead and drops the message.
   */
  company: z.string().optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
