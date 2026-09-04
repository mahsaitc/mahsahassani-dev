# Admin panel

A content API and dashboard so the site is edited from a browser rather than by
changing code.

---

## Architecture

```
backend/                          ASP.NET Core 9, Clean Architecture
  src/MahsaSite.Domain/           Entities and enums. No dependencies.
  src/MahsaSite.Application/      DTOs (validation rules live here), interfaces, options.
  src/MahsaSite.Infrastructure/   EF Core + SQLite, JWT, BCrypt, file storage, audit.
  src/MahsaSite.Api/              Controllers, middleware, DI, rate limiting.

src/app/admin/                    Dashboard (Next.js)
  login/                          Outside the auth layout, or it redirects to itself.
  (dashboard)/                    Route group holding every authenticated page.
src/app/api/admin/                Login, logout, and the authenticated proxy.
```

**Why the proxy.** The browser never receives the JWT. Signing in stores it in
an `httpOnly` cookie, and `/api/admin/proxy/*` attaches it server-side on the way
to the API. An XSS bug in the dashboard therefore cannot steal a session, and the
API needs no CORS grant for the admin surface at all.

---

## First run

The API refuses to start without a signing key — there is no built-in default
to fall back to.

```bash
cd backend/src/MahsaSite.Api
dotnet user-secrets set "Jwt:SigningKey"     "$(openssl rand -base64 48)"
dotnet user-secrets set "SeedAdmin:Email"    "you@example.com"
dotnet user-secrets set "SeedAdmin:Password" "a-password-of-at-least-12-chars"
```

Then, from the repo root, in two terminals:

```bash
npm run api     # http://localhost:5099
npm run dev     # http://localhost:3000  -> /admin
```

The seed account is created **only while the user table is empty**. Once it
exists, delete those two secrets — leaving them set does nothing, but they are
credentials sitting in a config file.

The front end needs to know where the API is:

```bash
# .env.local
API_BASE_URL=http://localhost:5099             # server-side reads and the proxy
NEXT_PUBLIC_API_BASE_URL=http://localhost:5099  # <img>/<video> src for uploads
API_REVALIDATE_SECONDS=60                       # per-fetch cache hint
```

How soon an edit shows up is governed by `export const revalidate = 60` on each
public route, not by that env var — see "Publishing appears within about a
minute" below.

The resume generator also reads the API, so it must be running for
`npm run resume`.

---

## Importing what already exists

The database starts empty. The five project entries verified against the real
repositories on 2026-08-30 can be moved in without retyping:

```bash
npm run import:content -- --email you@example.com --password '...' --dry-run
npm run import:content -- --email you@example.com --password '...'
```

Re-running is safe; anything already present is skipped.

It imports 5 projects, 16 skills and 4 timeline entries. It deliberately does
**not** import:

- **Testimonials** — that file is an empty template by design.
- **Blog posts** — `src/content/posts.ts` is unreviewed writing.
- **Project media** — re-upload through Media so files enter the CMS store.
- **About/contact copy** — fill in from Page content once the wording is confirmed.

Timeline entries carry whatever `verified` flag `src/data/timeline.ts` sets.
That file held placeholders until 2026-09-02; it now holds eight confirmed
entries, all verified, and `--replace-timeline` clears the old rows first
(periods and titles both changed, so the skip-by-key check would not have
matched them).

`organisation` is optional. None of the eight entries has an institution or
issuer recorded, because none was supplied — the component omits the line rather
than showing a guess. **Add them from the dashboard** when you want them shown.

> `src/data/timeline.ts` is now only the seed for this script. The database is
> the live source; edit through the dashboard from here on or the two will drift.

---

## What the dashboard manages

| Section | Covers |
| --- | --- |
| **Blog** | Title, slug, Markdown, cover image, tags, draft/published, publish date. Drafts get an unguessable preview link. |
| **Projects** | Card fields, ordering, video and poster upload, poster auto-generation. |
| **Page content** | About and contact copy, skills (with group blurb), timeline (kind, bullets, verified), testimonials. |
| **Media** | Every upload in one place, with a delete guard for files still in use. |
| **Resume** | Upload, replace, and roll back. The five most recent replaced versions are kept. |
| **Accounts** | List, create, change role, enable/disable, change password. Admin only. |
| **Activity** | Append-only audit log. |

### What the public site reads from the API

Every public surface is now CMS-backed: projects, testimonials, skills,
timeline, blog, and the About/contact copy. `src/lib/content.ts` is the single
bridge — each `load*` function fetches, shapes the result for the component, and
returns an empty value when the API is unreachable so the page still renders.

Two fields were added to the CMS so the public components render faithfully
rather than degraded:

- **`TimelineEntry.Kind`** selects the icon: `work` (briefcase), `education`
  (graduation cap), `certification` (award), `project` (rocket), `milestone`
  (sparkles). An unrecognised value falls back to the sparkle rather than
  crashing the section.
- **`TimelineEntry.Points`** holds the bullet list under the summary.
- **`Skill.GroupBlurb`** is the group subheading, denormalised onto each skill in
  the group — a group table for one string would need its own CRUD screen.

**Blog Markdown becomes blocks.** The dashboard stores Markdown; the post page
renders a typed `Block[]`. `markdownToBlocks()` converts between them, handling
headings, bullets, quotes and fenced code — the five shapes the design has
styles for. Anything unrecognised falls through as a paragraph, so no input is
dropped silently. This avoids pulling a parser, a sanitiser and a styling layer
into the bundle to render structures the design cannot draw.

**About copy keeps its inline emphasis.** `**text**` renders as the highlighted
span the design uses, so the "General Medicine" emphasis survives being edited
from a textarea.

### Persian (fa) content

Every translatable field has a Persian sibling in the dashboard, marked
`(فارسی)` and rendered RTL. **Leaving one blank is meaningful**: `/fa` shows the
English text for that item rather than a gap, so a half-translated site reads
correctly. Nothing is ever machine-translated.

| Content | Persian field |
| --- | --- |
| Projects | Tagline, Summary |
| Blog | Title, Excerpt, Content |
| Timeline | Period, Title, Organisation, Description |
| Skills | Group, Group blurb, Note |
| Testimonials | Quote, Role |
| About / contact | Headline, Body, Location, Availability |

Entities use parallel nullable `…Fa` columns; site settings use a `.fa` suffixed
key, since that store is already key/value and needed no migration.

**Never translated, by design:** project names, technology names and tags, repo
names, URLs, and code samples. The skills marquee is always English because it
is a list of technology names.

> **Before publishing a Persian blog post:** the English posts carry claims
> audited against the repositories on 2026-09-02. A translation must preserve
> them exactly — "SQLite, not PostgreSQL" has to stay just as unambiguous in
> Persian. Treat a Persian body as needing the same review the English one got.

### Case-study narrative stays in code

The dashboard edits the **card**: name, summary, tech tags, repo name, demo URL,
media. The longer case-study sections (`architecture`, `outcome`, `metrics`)
have no CMS equivalent and are still merged in from `src/data/projects.ts` by
slug — see `src/lib/content.ts`.

That was deliberate: those sections are the carefully verified write-up, and
putting free-text architecture claims behind a web form is how unverified
statements creep back in. A project added from the dashboard renders a correct,
shorter case study rather than a broken one. Say the word if you would rather
manage them from the dashboard too.

---

## Security

| Control | Where |
| --- | --- |
| Password hashing | BCrypt, work factor 12 |
| Token invalidation | `TokenVersion` claim — a password change or deactivation ends every open session immediately |
| Login rate limit | 5 per minute per IP, returning 429 |
| Upload rate limit | 30 per minute per user |
| Upload validation | Extension whitelist, size ceiling, **and magic-byte check** |
| Path traversal | Uploads get a random name; the extension is the only thing carried over. Deletes resolve against the storage root and refuse anything outside it |
| Enumeration | Wrong password and unknown email return byte-identical responses |
| HTTPS | HSTS and redirect outside development |
| Last-admin guard | The API refuses to demote or disable the last active admin |
| Audit log | Append-only; no endpoint updates or deletes it |

Verified by exercising the running API: a `.exe` renamed to an image is rejected
on extension, a PHP payload named `.png` is rejected on magic bytes, an Editor
gets 403 on account endpoints, and the 6th login attempt in a minute gets 429.

### Two things to do before this faces the internet

1. **Rotate the seed password.** Change it from the dashboard on first login.
2. **Put the API behind TLS.** `Cors:AllowedOrigins` must list the real origin,
   and the API should sit behind nginx rather than being exposed directly.

---

## Deployment

Both processes run on the VPS:

- **API** — `dotnet publish -c Release`, served behind nginx. It needs a writable
  `uploads/` directory and the SQLite file. Back up both together; a database
  row pointing at a missing file shows a broken image.
- **Next.js** — `npm run build && npm start`.

### Static export is no longer possible

`npm run build:static` now exits with an explanation instead of failing
cryptically. A CMS needs a server: the login route, the proxy, and the
middleware that gates `/admin` cannot be exported to static files.

The public pages themselves are still mostly prerendered — case-study and blog
pages are generated at build time and refreshed by ISR — so this changes hosting,
not page speed. If a fully static public site matters more than browser-based
editing, that is a real fork in the road worth discussing.

---

## Behaviour worth knowing

**The site survives the API being down.** Every public read falls back to an
empty result, and sections self-hide when empty. `loadProjects()` goes further
and falls back to the static file, so the portfolio never renders blank because
the backend was restarting. About and contact copy fall back to the values in
`site.ts`, so an empty database renders exactly what the site rendered before.

**The resume generator now needs the API running.** It reads projects, skills
and timeline from the same endpoints the site does, so the PDF cannot drift from
the page. If the API is unreachable it exits with an error rather than quietly
emitting a PDF with sections missing. Pass `--api <url>` to point elsewhere.

**Poster auto-generation needs ffmpeg.** It is not installed on this machine, so
the button returns a clear 503 telling you to upload a poster instead. Install
ffmpeg on the VPS and it starts working with no code change.

**Publishing appears within about a minute, not instantly.** The number that
governs this is the `export const revalidate = 60` on each public route, not
`API_REVALIDATE_SECONDS` — the route segment's value caps the whole page. It was
3600 initially, which meant edits took up to an hour to show; measured end to
end, an edit now reaches the public page in 40-65 seconds.

Lowering it does not increase GitHub traffic: `fetchRepoStats` carries its own
`revalidate: 3600`, so stars are still fetched hourly however often the page
re-renders. If a minute is too slow, the fix is on-demand revalidation — a
`revalidateTag('content')` webhook the API calls after each mutation. The fetches
are already tagged `content`, so only the endpoint and the outbound call are
missing.

**SQLite cannot sort `DateTimeOffset`.** Every timestamp is stored through
`DateTimeOffsetToBinaryConverter`, applied by convention in `AppDbContext`, so
new entities inherit it automatically. Removing it breaks every date-ordered
list with a runtime error, not a compile error.
