import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/admin-session';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5099';

/**
 * Exchanges credentials for a session cookie. The token is set server-side and
 * never returned to the caller, so the browser cannot read or forward it.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: 'Malformed request.' }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { detail: 'Could not reach the content API. Is the backend running?' },
      { status: 503 },
    );
  }

  const payload = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    // Pass the API's own message through — including the 429 from rate limiting.
    return NextResponse.json(payload ?? { detail: 'Sign-in failed.' }, { status: upstream.status });
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, payload.token, sessionCookieOptions(payload.expiresAtUtc));

  return NextResponse.json({ user: payload.user });
}
