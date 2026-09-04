import { site } from '@/lib/site';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SOURCE OF TRUTH — every field below is a fact Mahsa confirmed on 2026-08-30.
 *
 * Nothing here is inferred. If a detail was not on the confirmed list it was
 * left out rather than guessed at — including framework extras (validation
 * libraries, auth schemes), layer counts that were not enumerated, and test
 * totals that were not quoted. Several sections are therefore short. That is
 * intentional: a thin accurate page beats a padded one.
 *
 * Before adding anything here, confirm it against the repository.
 * See PRE-LAUNCH.md for what is still outstanding.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type TechTag =
  | 'ASP.NET Core'
  | 'React'
  | 'TypeScript'
  | 'JavaScript'
  | 'PostgreSQL'
  | 'SQL Server'
  | 'SQLite'
  | 'Redis'
  | 'SignalR'
  | 'EF Core'
  | 'CQRS'
  | 'Hangfire'
  | 'Testing';

export interface CaseSection {
  heading: string;
  body: string;
  bullets?: string[];
}

export interface Project {
  /** URL segment. Lowercase and stable — changing it breaks existing links. */
  slug: string;
  /**
   * Exact GitHub repository name, which is NOT always the slug (the clinic API
   * is published under a different name than its product title). The GitHub
   * stats lookup uses this, so a mismatch silently yields no stats.
   */
  repoName: string;
  name: string;
  tagline: string;
  summary: string;
  /** Year of most recent push, read from the GitHub API. */
  year: string;
  /** Omitted until Mahsa confirms what to claim — see PRE-LAUNCH.md. */
  status?: 'Live' | 'In progress' | 'Archived';
  role?: string;
  featured: boolean;
  tech: TechTag[];
  stack: string[];
  repo: string;
  /**
   * Public demo URL. All five repos have `homepage: null` on GitHub and no
   * deployment exists, so none are set — the card and case study hide the demo
   * button entirely rather than render a dead link.
   */
  demo?: string;
  media: { video?: string; poster: string; alt: string };
  /** Only figures Mahsa quoted directly. Omit rather than estimate. */
  metrics?: { label: string; value: string }[];
  challenge?: CaseSection;
  solution?: CaseSection;
  architecture?: {
    overview?: string;
    layers?: { name: string; detail: string }[];
    flow?: string[];
  };
  outcome?: CaseSection;
}

const repoUrl = (repoName: string) => `${site.github.url}/${repoName}`;

/** The four Clean Architecture projects, described only by their own names. */
const cleanArchitectureLayers = (prefix: string, apiSuffix: 'API' | 'Api') => [
  { name: `${prefix}.Domain`, detail: 'Domain layer.' },
  { name: `${prefix}.Application`, detail: 'Application layer.' },
  { name: `${prefix}.Infrastructure`, detail: 'Infrastructure layer.' },
  { name: `${prefix}.${apiSuffix}`, detail: 'API layer.' },
];

export const projects: Project[] = [
  {
    slug: 'rxclinic',
    repoName: 'clinic-appointment-api',
    name: 'RxClinic',
    tagline: 'Clinic appointment API and booking front end',
    summary:
      'A clinic appointment system built as a single ASP.NET Core Web API project — deliberately not a layered solution — with EF Core over SQLite for storage and a React front end written in plain JavaScript.',
    year: '2026',
    featured: true,
    tech: ['ASP.NET Core', 'EF Core', 'SQLite', 'React', 'JavaScript'],
    stack: ['ASP.NET Core Web API', 'EF Core', 'SQLite', 'React (JavaScript / JSX)'],
    repo: repoUrl('clinic-appointment-api'),
    media: {
      video: '/media/rxclinic.mp4',
      poster: '/images/projects/rxclinic.svg',
      alt: 'RxClinic appointment booking interface',
    },
    architecture: {
      overview:
        'One ASP.NET Core Web API project rather than a layered Clean Architecture solution, paired with a separate React client. Persistence is EF Core against SQLite.',
      layers: [
        {
          name: 'ASP.NET Core Web API',
          detail: 'A single project — not split into Domain, Application and Infrastructure layers.',
        },
        {
          name: 'React client',
          detail: 'Written in plain JavaScript and JSX, with no TypeScript in the codebase.',
        },
      ],
    },
  },
  {
    slug: 'inventrack',
    repoName: 'InvenTrack',
    name: 'InvenTrack',
    tagline: 'Inventory management with real-time low-stock alerts',
    summary:
      'Inventory system on a Clean Architecture solution, using SignalR to push low-stock alerts to the React and TypeScript front end. EF Core runs against a configurable provider: SQLite by default, or SQL Server.',
    year: '2026',
    featured: true,
    tech: ['ASP.NET Core', 'SignalR', 'EF Core', 'SQLite', 'SQL Server', 'React', 'TypeScript'],
    stack: [
      'ASP.NET Core',
      'Clean Architecture',
      'EF Core — SQLite (default) or SQL Server',
      'SignalR',
      'React + TypeScript',
    ],
    repo: repoUrl('InvenTrack'),
    media: {
      video: '/media/inventrack.mp4',
      poster: '/images/projects/inventrack.svg',
      alt: 'InvenTrack stock dashboard with a low-stock alert',
    },
    architecture: {
      overview:
        'Clean Architecture across API, Application, Domain and Infrastructure projects. Low-stock alerts reach connected clients over SignalR, and the EF Core provider is configurable rather than fixed to one database engine.',
      layers: cleanArchitectureLayers('InvenTrack', 'API'),
    },
  },
  {
    slug: 'articleforge',
    repoName: 'ArticleForge',
    name: 'ArticleForge',
    tagline: 'CMS and blog platform on Clean Architecture',
    summary:
      'Content platform on a Clean Architecture solution, without MediatR or a CQRS split. Content is rendered with react-markdown rather than a rich-text editor, and EF Core runs against SQLite by default or SQL Server.',
    year: '2026',
    featured: true,
    tech: ['ASP.NET Core', 'EF Core', 'SQLite', 'SQL Server', 'React', 'TypeScript'],
    stack: [
      'ASP.NET Core',
      'Clean Architecture',
      'EF Core — SQLite (default) or SQL Server',
      'react-markdown',
      'React + TypeScript',
    ],
    repo: repoUrl('ArticleForge'),
    media: {
      video: '/media/articleforge.mp4',
      poster: '/images/projects/articleforge.svg',
      alt: 'ArticleForge content editing interface',
    },
    architecture: {
      overview:
        'Clean Architecture across Api, Application, Domain and Infrastructure projects, kept deliberately free of MediatR and a CQRS read/write split. Markdown is rendered client-side with react-markdown instead of embedding a rich-text editor.',
      layers: cleanArchitectureLayers('ArticleForge', 'Api'),
    },
  },
  {
    slug: 'taskflow',
    repoName: 'TaskFlow',
    name: 'TaskFlow',
    tagline: 'Team task manager with CQRS, real-time sync and background jobs',
    summary:
      'Task manager built on Clean Architecture with CQRS through MediatR, backed by PostgreSQL. SignalR keeps clients in sync and Hangfire runs background jobs against the same database.',
    year: '2026',
    featured: true,
    tech: ['ASP.NET Core', 'CQRS', 'SignalR', 'Hangfire', 'PostgreSQL'],
    stack: [
      'ASP.NET Core',
      'Clean Architecture',
      'CQRS via MediatR 12.4.1',
      'PostgreSQL (Npgsql)',
      'SignalR',
      'Hangfire + Hangfire.PostgreSql',
    ],
    repo: repoUrl('TaskFlow'),
    media: {
      video: '/media/taskflow.mp4',
      poster: '/images/projects/taskflow.svg',
      alt: 'TaskFlow team task board',
    },
    metrics: [{ label: 'Tests passing', value: '473 / 473' }],
    architecture: {
      overview:
        'Clean Architecture with CQRS handled by MediatR, pinned to 12.4.1 on purpose: the 12.x line is Apache-2.0 licensed and 13.x is not. PostgreSQL is the datastore via Npgsql, SignalR carries real-time updates, and Hangfire.PostgreSql keeps background jobs in the same database.',
    },
    outcome: {
      heading: 'A suite that cannot rot',
      body: 'All 473 tests pass. One had been failing for a reason worth keeping: a refresh-token test pinned a fixed date while the entity stamped creation from the ambient clock, so the two drifted a day apart for every day after it was written. Making the creation instant injectable — defaulted, so no caller changed — let the test pin both clocks to the same instant and removed the class of failure rather than the symptom.',
    },
  },
  {
    slug: 'cartforge',
    repoName: 'CartForge',
    name: 'CartForge',
    tagline: 'E-commerce API with PostgreSQL and Redis',
    summary:
      'Commerce back end on a Clean Architecture solution, storing data in PostgreSQL with Redis alongside it. Its 150-case test suite runs entirely on SQLite and Moq, so no external service is needed to execute it.',
    year: '2026',
    featured: true,
    tech: ['ASP.NET Core', 'PostgreSQL', 'Redis', 'Testing'],
    stack: [
      'ASP.NET Core',
      'Clean Architecture',
      'PostgreSQL (Npgsql)',
      'Redis',
      'xUnit with SQLite + Moq',
    ],
    repo: repoUrl('CartForge'),
    media: {
      video: '/media/cartforge.mp4',
      poster: '/images/projects/cartforge.svg',
      alt: 'CartForge commerce API',
    },
    metrics: [{ label: 'Tests passing', value: '150 / 150' }],
    architecture: {
      overview:
        'Clean Architecture across API, Application, Domain and Infrastructure projects, with PostgreSQL via Npgsql and Redis alongside it.',
      layers: cleanArchitectureLayers('CartForge', 'API'),
    },
    outcome: {
      heading: 'A suite that runs anywhere',
      body: 'All 150 tests pass against SQLite and Moq rather than containerised services, so the suite runs on a laptop or in CI with nothing to provision first.',
    },
  },
];

/** Tags with at least one project, ordered by frequency — drives the filter bar. */
export const techFilters: TechTag[] = (() => {
  const counts = new Map<TechTag, number>();
  for (const p of projects) {
    for (const t of p.tech) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([t]) => t);
})();

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
