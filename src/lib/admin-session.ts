import 'server-only';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/lib/admin-cookie';

/**
 * The admin JWT lives in an httpOnly cookie, never in localStorage, and every
 * dashboard request is proxied through Next so the token is not readable by
 * page scripts. An XSS bug in the dashboard therefore cannot exfiltrate a
 * session, and the browser never talks to the API origin directly.
 */
export { SESSION_COOKIE } from '@/lib/admin-cookie';

export async function getSessionToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

export function sessionCookieOptions(expiresAtUtc: string) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    // Secure everywhere except local http development, where it would block the cookie.
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(expiresAtUtc),
  };
}
