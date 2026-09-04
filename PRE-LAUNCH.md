# Pre-launch status

Audit date: **2026-08-30**. Everything below is either verified against a
primary source or explicitly marked as needing your input. Nothing on this list
is a guess presented as fact.

---

## 1. Content that is now CONFIRMED

Case-study content was rewritten on 2026-08-30 from a fact list Mahsa confirmed
directly. Nothing was inferred to fill a gap.

| Project | Repo (`repoName`) | Confirmed facts |
| --- | --- | --- |
| RxClinic | `clinic-appointment-api` | **Single ASP.NET Core Web API project — not layered/Clean Architecture.** EF Core + SQLite. React front end in plain JavaScript/JSX, no TypeScript |
| InvenTrack | `InvenTrack` | Clean Architecture (API/Application/Domain/Infrastructure). EF Core, configurable provider — SQLite default or SQL Server. SignalR low-stock alerts. React + TypeScript |
| ArticleForge | `ArticleForge` | Clean Architecture (Api/Application/Domain/Infrastructure). EF Core, SQLite default or SQL Server. **No MediatR, no CQRS.** react-markdown, not a rich-text editor. React + TypeScript |
| TaskFlow | `TaskFlow` | Clean Architecture + CQRS via **MediatR 12.4.1**, pinned because 12.x is Apache-2.0 and 13.x is not. PostgreSQL (Npgsql). SignalR. Hangfire + Hangfire.PostgreSql. **472/473 tests passing** |
| CartForge | `CartForge` | Clean Architecture (API/Application/Domain/Infrastructure). PostgreSQL (Npgsql) + Redis. **150/150 tests passing** on SQLite + Moq, not Testcontainers |

Neither InvenTrack nor ArticleForge uses PostgreSQL. RxClinic has no TypeScript.

### Deliberately left out

Details that were on the site but not on the confirmed list were removed rather
than kept. Re-add any of these once you have confirmed them:

- **InvenTrack: 79/79 tests, 3 compose services, 6 .NET projects** — measured by
  running the suite, but not on the confirmed list, so they are gone from the UI.
- **ArticleForge: 231/231 tests** — same.
- **RxClinic: 3 roles modelled**, and its JWT bearer authentication — not listed.
- **JWT auth, FluentValidation, AutoMapper, Vitest, Docker Compose, Vite** across
  various projects — real package references, but not on the confirmed list.
- **`status` ("Live") and `role` ("Solo")** on every project — both fields are now
  optional and unset. "Live" is hard to defend when no deployment exists. Set them
  in `projects.ts` if you want the badges back.
- **Layer-count metrics** — the layer *names* are shown where you confirmed them;
  the derived "4 architecture layers" counters are gone.

Hero counters now read: 5 public repositories, **622 tests passing** (472 + 150,
the two confirmed suites), and Clean Architecture on **4 of 5** projects.

---

## 2. Fabricated content that was REMOVED

An earlier draft of this site contained invented material. It has been deleted,
not softened. Recorded here so it never comes back.

### Invented performance figures — all removed
`38 ms p95`, `<120 ms alert latency`, `11 ms catalogue p95`, `0 booking
conflicts`, `100% money-path coverage`, `200 concurrent bookings`, `2 s
autosave`, `1 command cold start`. None were measured.

### Invented stack claims — corrected

| Claim that was on the site | Reality |
| --- | --- |
| RxClinic uses PostgreSQL | **SQLite** |
| RxClinic front end is TypeScript | **Plain JavaScript / JSX** |
| RxClinic is "Clean Architecture in four projects" | **One Web API project** |
| InvenTrack / ArticleForge use PostgreSQL | **SQLite (default) or SQL Server** |
| ArticleForge uses MediatR / CQRS | **Neither** |
| ArticleForge uses TipTap | **react-markdown** |
| CartForge tests use Testcontainers | **SQLite + Moq** |
| TaskFlow uses fractional ranking | Not confirmed; removed |

Two contradictions also lived outside `projects.ts` and were fixed:
`skills.ts` claimed *"Testcontainers-backed integration suites"* and stated a
testing principle — *"Real Postgres in a container beats a mocked repository"* —
that contradicts CartForge's actual SQLite + Moq approach.

### Invented case-study prose — removed
The `challenge`, `solution` and `architecture.flow` narratives matched no code and
are gone. Those fields are optional; each case-study page renders only the
sections that exist and numbers its headings accordingly, so RxClinic opens at
"01 — Architecture" rather than showing an empty Challenge.

The pages are now short and accurate. Lengthen them only with things you can
point at in the repository.

### Dead affordances removed
- **Demo URLs**: all four are gone; `homepage` is null on every repo. The demo
  button renders only when `demo` is set, so nothing links into the void.
- **Demo video controls**: `src/lib/media.ts` checks at build time whether each
  clip exists in `public/media`. None do, so the "Hover for demo" hint and the
  case-study play button do not render at all. Drop an `.mp4` in and the control
  reappears on the next build — no data edit needed.

---

## 3. Still needs YOUR input

### Contact and identity
- **LinkedIn URL** — `src/lib/site.ts` still contains the guess
  `linkedin.com/in/mahsahassani`. **Unverified.** Correct it or delete the entry;
  the footer, contact section and résumé all read from this one field.
- **Phone number** — not in any data file. Add to `site.ts` and the résumé
  generator if you want it on the CV.
- **Location** — `"Iran · Remote friendly"` was drafted, not supplied.
- **Availability line** — `"Open to senior back-end & full-stack roles"` was
  drafted. It appears in the hero badge, About card and footer.

### Experience and education — CONFIRMED 2026-09-02

The placeholder periods and titles are gone. Eight confirmed entries now live in
the database, all marked verified, and both the public timeline and the resume
PDF render them.

Still missing on those entries, because it was never supplied: **the institution
or issuer** for the degree, the certification and the university entry, and any
description text. Add them from Page content -> Timeline when you have them.

### Skill proficiency numbers
`src/data/skills.ts` assigns each skill a percentage (`95`, `94`, `92`…). These
are my estimates, not measurements. They drive the meter bars on the site. The
résumé deliberately prints skill **names only** — a "94%" on a CV invites a
question with no defensible answer. Adjust or remove the meters as you prefer.

### Blog posts — untouched, at your request
`src/content/posts.ts` still contains three technical essays written in your voice,
including code samples. They are **my writing, not yours**, and one describes a
unique-index booking fix that does **not** exist in `clinic-appointment-api`.
Left in place deliberately — you said you would handle these separately. They are
still live on `/blog` and linked from the homepage.

### Testimonials
`src/data/testimonials.ts` is now an empty typed template. The homepage section
returns `null` while the array is empty, so nothing renders. Add real, permitted,
attributable quotes only.

---

## 4. Media assets still missing

No raw screen recordings were supplied and `ffmpeg` is not installed on this
machine, so none could be encoded. The poster-fallback path is untouched and the
site renders correctly without them.

**Demo clips — all 5 missing** (cards fall back to the poster image):

```
public/media/rxclinic.mp4
public/media/inventrack.mp4
public/media/articleforge.mp4
public/media/taskflow.mp4
public/media/cartforge.mp4
```

**Posters — all 5 present but synthetic.** `public/images/projects/*.svg` are
generated abstract UI shapes, not screenshots of your applications. Replace with
real captures at 1200×750 or wider:

```
public/images/projects/rxclinic.svg
public/images/projects/inventrack.svg
public/images/projects/articleforge.svg
public/images/projects/taskflow.svg
public/images/projects/cartforge.svg
```

Encode settings for the clips are in `public/media/README.md`. Install ffmpeg
first (`winget install Gyan.FFmpeg`), then per recording:

```bash
ffmpeg -i raw.mov -t 10 -an -vf "scale=1280:-2,fps=24" \
       -c:v libx264 -crf 30 -preset slow -movflags +faststart rxclinic.mp4
```

---

## 5. Bug found in your TaskFlow repository

Not a site issue, but it surfaced while gathering real test counts.

```
TaskFlow.Domain.Tests.Entities.RefreshTokenTests.Pruning_drops_dead_tokens_and_keeps_live_ones
  Assert.Single() Failure: The collection contained 2 items
  tests/TaskFlow.Domain.Tests/Entities/RefreshTokenTests.cs:161
```

The fixture hardcodes absolute expiry dates (`ExpiresAtUtc = 2026-08-03` and
`2026-10-03`). The first is now in the past, so a token the test expects to be
pruned is still counted. It is a time bomb, not a logic regression — the fix is
to build the dates relative to an injected clock rather than hardcoding them.

Until it is fixed, the site honestly reports TaskFlow as **472 / 473 passing**.
Once green, change that metric in `src/data/projects.ts` to `473`.
