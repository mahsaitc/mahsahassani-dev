# mahsahassani.dev

Personal portfolio for **Mahsa Hassani** — Computer Engineer, Software Design.
Dark, gold-accented, motion-driven, and built to be edited without touching a
component.

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion · Radix primitives

---

## Quick start

```bash
npm install
cp .env.example .env.local   # optional for local dev
npm run dev                  # http://localhost:3000
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build (`output: standalone`, API routes live) |
| `npm run build:static` | Static export to `./out` for cPanel hosting — see [DEPLOY-CPANEL.md](DEPLOY-CPANEL.md) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (`next/core-web-vitals`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run og` | Re-render `public/images/og.svg` → `og.png` |
| `npm run resume` | Rebuild `public/mahsa-hassani-resume.pdf` from `src/data/*` |

---

## Editing content

All copy lives in data modules — no JSX edits needed for routine updates.

| File | Controls |
| --- | --- |
| `src/lib/site.ts` | Name, title, tagline, email, social links, résumé path, SEO defaults |
| `src/data/projects.ts` | Project cards **and** their case-study pages |
| `src/data/skills.ts` | Skill groups, proficiency meters, principles |
| `src/data/timeline.ts` | Career timeline entries — **all placeholder, see below** |
| `src/data/testimonials.ts` | Quotes — **empty by design, section self-hides** |
| `src/content/posts.ts` | Blog posts, as structured blocks |

Adding a project to `projects.ts` automatically produces: a filterable card, a
statically generated `/projects/<slug>` case study, a sitemap entry and its own
Open Graph metadata. Nothing else to register.

### Assets to replace

| Path | Notes |
| --- | --- |
| `public/media/<slug>.mp4` | **All 5 missing.** Demo loops; see `public/media/README.md` for encode settings |
| `public/images/projects/<slug>.svg` | **All 5 are generated abstractions, not screenshots.** Replace with real captures |
| `public/images/og.svg` | Social card source — edit, then `npm run og` |

Missing demo videos degrade silently to the poster image, so the site ships fine
before they are recorded.

The résumé is no longer a static file — see [Résumé generation](#résumé-generation).

### Résumé generation

`npm run resume` rebuilds `public/mahsa-hassani-resume.pdf` from `src/lib/site.ts`,
`src/data/skills.ts`, `src/data/projects.ts` and `src/data/timeline.ts`, so the PDF
cannot drift from the site. The script refuses to print unverified data:

- skill **percentages are never printed** (estimates, not measurements);
- timeline entries print only when marked `verified: true` — currently none are,
  so the experience section is omitted rather than guessed;
- it lists what still needs your input on stdout when it finishes.

Build scripts read the TypeScript data modules directly: Node 26 strips the types,
and `scripts/ts-alias-hook.mjs` teaches it the `@/*` path alias.

---

> **Read [PRE-LAUNCH.md](PRE-LAUNCH.md) before publishing.** It records exactly
> which content is verified against the repositories, which was fabricated and
> removed, and which fields still need your input.

---

## Contact form

`POST /api/contact`, validated by the same Zod schema the client uses.

1. Create a [Resend](https://resend.com) key and verify your sending domain.
2. Set `RESEND_API_KEY`, `CONTACT_FROM`, `CONTACT_TO`.

Without a key the endpoint answers `503` with a clear message rather than
pretending to succeed. Protections in place: a hidden honeypot field (answered
`200` so bots learn nothing), 3 requests per minute per IP, and HTML escaping on
every interpolated value.

The static cPanel build posts to `contact.php` instead, a PHP port with the same
validation, honeypot and rate limit that sends through `mail()`. A static build
without `NEXT_PUBLIC_CONTACT_ENDPOINT` falls back to opening the visitor's mail
client with the message pre-filled.

## GitHub stats

Cards and case studies show live stars/forks via the GitHub API, cached for an
hour. Unauthenticated requests are capped at 60/hour per IP — set `GITHUB_TOKEN`
(a classic token with no scopes) to raise it. Any failure renders nothing; stats
never block a page.

Each project carries a `repoName` separate from its URL `slug`, because the two
differ (RxClinic lives at `clinic-appointment-api`). The stats lookup uses
`repoName`; a mismatch silently yields no stats rather than an error.

All five repositories currently sit at 0 stars and 0 forks, and the stats block
renders only when at least one is non-zero — a card showing "0 / 0" reads as a
broken widget. Remove that condition in `project-card.tsx` if you would rather
always show the counts.

---

## Deployment

### VPS with Docker (contact form works)

```bash
cp .env.example .env    # fill in RESEND_API_KEY etc.
docker compose up -d --build
```

Serves on `:3000`. Put Nginx or Caddy in front for TLS.

### Static hosting (cPanel / Apache + PHP)

`npm run build:static` exports the public site only; the admin dashboard, route
handlers and middleware are named `*.dyn.tsx` / `*.dyn.ts` and left out of the
static build. Content is read from the local API at build time. Full steps for
cPanel shared hosting (Apache + PHP) are in [DEPLOY-CPANEL.md](DEPLOY-CPANEL.md).

### Vercel

Push the repo and import it. Add the environment variables from `.env.example`.

---

## Architecture notes

- **Motion presets are centralised** in `src/lib/motion.ts`. One easing curve and
  one viewport threshold across every section; mixed easings are what make a page
  feel assembled rather than designed.
- **Everything animated respects `prefers-reduced-motion`** — the custom cursor
  does not mount at all, parallax resolves to zero, and reveals become instant.
- **The custom cursor never mounts on touch or coarse pointers**, and the OS
  pointer is only hidden behind a `(hover: hover) and (pointer: fine)` query.
- **Videos are never preloaded.** Card demos fetch on hover; the case-study hero
  fetches on click. Posters alone determine LCP.
- **OG image is a pre-rendered PNG.** `next/og` mis-joins `import.meta.url` on
  Windows and cannot run in a static export; `npm run og` sidesteps both.

## Accessibility

Skip link, visible focus rings, `aria-invalid` + inline errors on the form,
labelled icon-only controls, `role="meter"` on skill bars, and semantic landmarks
throughout. Reduced motion is honoured everywhere.
