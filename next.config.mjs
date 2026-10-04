import createNextIntlPlugin from 'next-intl/plugin';

/**
 * Two build targets share this config:
 *   next build                 -> Node server (VPS / Vercel). API routes live.
 *   npm run build:static       -> fully static ./out for cPanel shared hosting.
 *                                 See DEPLOY-CPANEL.md.
 */
const isStatic = process.env.NEXT_OUTPUT === 'export';

/**
 * Server-only routes — the admin dashboard, every route handler and the
 * middleware — are named `*.dyn.tsx` / `*.dyn.ts`. The server build lists those
 * extensions so Next treats them as ordinary pages; the static build leaves
 * them out, so Next never sees code that cannot be exported. `page.dyn.tsx`
 * then resolves to a page named `page.dyn`, which is not a route.
 */
const pageExtensions = isStatic
  ? ['tsx', 'ts', 'jsx', 'js']
  : ['dyn.tsx', 'dyn.ts', 'tsx', 'ts', 'jsx', 'js'];

/**
 * Build output directory. Defaults to .next so Docker and the VPS are
 * unaffected.
 *
 * `next build` writes a production manifest into the same .next that a running
 * `next dev` is serving from, which leaves the dev server pointing at CSS and
 * JS chunks that no longer exist — every asset 404s and the site renders as
 * unstyled HTML. Setting NEXT_DIST_DIR keeps the two apart; `npm run
 * build:isolated` does exactly that.
 */
const distDir = process.env.NEXT_DIST_DIR || '.next';

/**
 * Uploads are served by the ASP.NET API under `/uploads` (Storage:PublicPrefix),
 * so next/image must trust the API origin — localhost:5099 in dev, the real API
 * host in production. Both variables are read: the admin builds upload URLs
 * from NEXT_PUBLIC_API_BASE_URL, the public pages (lib/api.ts mediaUrl) from
 * API_BASE_URL, and the two can differ behind Docker. Next loads .env* before
 * evaluating this file, so .env.local is already applied here.
 *
 * Unset is allowed (static export, or a build without the CMS); a malformed
 * value fails the build instead of silently breaking every uploaded image.
 */
function apiUploadsPatterns() {
  const patterns = new Map();

  for (const name of ['NEXT_PUBLIC_API_BASE_URL', 'API_BASE_URL']) {
    const raw = process.env[name]?.trim();
    if (!raw) continue;

    let url;
    try {
      url = new URL(raw);
    } catch {
      throw new Error(`${name} is not a valid URL: "${raw}"`);
    }

    // Keep any sub-path the API is mounted under (e.g. https://example.com/api).
    const basePath = url.pathname.replace(/\/+$/, '');
    const pattern = {
      protocol: url.protocol.replace(/:$/, ''),
      hostname: url.hostname,
      port: url.port,
      pathname: `${basePath}/uploads/**`,
    };
    patterns.set(JSON.stringify(pattern), pattern);
  }

  return [...patterns.values()];
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  distDir,
  pageExtensions,
  // Static hosting serves /en/blog/index.html for /en/blog/ with no rewrite
  // rules; the server build keeps its existing slash-less URLs.
  trailingSlash: isStatic,
  // 'standalone' emits .next/standalone with a minimal node_modules, which is
  // what the Dockerfile copies into the runner stage.
  output: isStatic ? 'export' : 'standalone',
  /**
   * sharp's native binding loads libvips with dlopen, which file tracing cannot
   * follow, so the standalone output shipped the binding without its library
   * and next/image silently served originals. Include whichever Linux libvips
   * build npm installed (musl on the Alpine image, glibc elsewhere); on other
   * platforms the glob simply matches nothing.
   */
  outputFileTracingIncludes: {
    '/**': ['./node_modules/@img/sharp-libvips-linux*/**/*'],
  },
  images: {
    // The default loader needs a server; static export must ship raw files.
    unoptimized: isStatic,
    formats: ['image/avif', 'image/webp'],
    // Project posters are first-party SVGs we author ourselves; no third-party
    // SVG ever reaches the optimizer, and the CSP below neuters scripts anyway.
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'opengraph.githubassets.com' },
      ...apiUploadsPatterns(),
    ],
  },
  eslint: { ignoreDuringBuilds: false },
};

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withNextIntl(nextConfig);
