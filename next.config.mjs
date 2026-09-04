import createNextIntlPlugin from 'next-intl/plugin';

/**
 * Two build targets share this config:
 *   next build                 -> Node server (VPS / Vercel). API routes live.
 *   NEXT_OUTPUT=export next build -> fully static ./out. API routes are excluded
 *                                    and the contact form degrades to mailto.
 */
const isStatic = process.env.NEXT_OUTPUT === 'export';

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

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  distDir,
  // 'standalone' emits .next/standalone with a minimal node_modules, which is
  // what the Dockerfile copies into the runner stage.
  output: isStatic ? 'export' : 'standalone',
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
    ],
  },
  /**
   * `route.api.ts` is only registered as a route in server builds. The static
   * export therefore never sees the POST contact handler, which would otherwise
   * fail the export with "POST is not supported with output: export".
   */
  pageExtensions: isStatic ? ['tsx', 'ts'] : ['tsx', 'ts', 'api.ts'],
  eslint: { ignoreDuringBuilds: false },
};

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withNextIntl(nextConfig);
