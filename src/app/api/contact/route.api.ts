import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { contactSchema } from '@/lib/validation';
import { site } from '@/lib/site';

/**
 * Named `route.api.ts` on purpose: `pageExtensions` in next.config.mjs only
 * registers that suffix for server builds, so `npm run build:static` skips this
 * file entirely instead of failing on an unexportable POST handler.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Per-instance rate limit. Adequate for a single-process VPS; swap for Redis if
 * this ever runs behind more than one node.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 3;
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);

  // Opportunistic cleanup so the map cannot grow without bound.
  if (hits.size > 500) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  return recent.length > MAX_PER_WINDOW;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many messages in a short window. Try again in a minute.' },
      { status: 429 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed.', issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  // Honeypot filled means a bot. Return 200 so it never learns it was caught.
  if (parsed.data.company) {
    return NextResponse.json({ ok: true });
  }

  const { name, email, subject, message } = parsed.data;
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error('[contact] RESEND_API_KEY is not set — message dropped.');
    return NextResponse.json(
      { error: 'Mail transport is not configured on this deployment.' },
      { status: 503 },
    );
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: process.env.CONTACT_FROM ?? 'Portfolio <onboarding@resend.dev>',
      to: process.env.CONTACT_TO ?? site.email,
      replyTo: email,
      subject: `[Portfolio] ${subject}`,
      text: `From: ${name} <${email}>\n\n${message}`,
      html: `
        <div style="font-family:ui-sans-serif,system-ui,sans-serif;line-height:1.6;color:#111">
          <p style="margin:0 0 4px"><strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(email)}&gt;</p>
          <p style="margin:0 0 16px;color:#666">${escapeHtml(subject)}</p>
          <div style="white-space:pre-wrap;border-left:3px solid #C9A961;padding-left:14px">${escapeHtml(message)}</div>
        </div>
      `,
    });

    if (error) {
      console.error('[contact] resend error', error);
      return NextResponse.json({ error: 'The mail provider rejected the message.' }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact] unexpected failure', err);
    return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
  }
}
