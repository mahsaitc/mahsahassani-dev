import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/admin-cookie';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

/**
 * Two concerns share one middleware, in this order:
 *
 *   /admin/*  -> auth gate only. The dashboard is English and must never be
 *                locale-prefixed, so next-intl never sees these paths.
 *   anything  -> locale routing. Adds /en or /fa and negotiates from the
 *   else        Accept-Language header on a bare path.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

    if (pathname === '/admin/login') {
      return hasSession ? NextResponse.redirect(new URL('/admin', request.url)) : NextResponse.next();
    }

    if (!hasSession) {
      const login = new URL('/admin/login', request.url);
      // Return the visitor to where they were headed after signing in.
      if (pathname !== '/admin') login.searchParams.set('next', pathname + search);
      return NextResponse.redirect(login);
    }

    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  /**
   * Everything except Next internals, the API, and files with an extension.
   * `/` is matched so a bare visit is redirected to the negotiated locale.
   */
  matcher: ['/', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
