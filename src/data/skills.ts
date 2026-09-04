export type IconKey =
  | 'dotnet'
  | 'csharp'
  | 'efcore'
  | 'signalr'
  | 'react'
  | 'typescript'
  | 'nextjs'
  | 'tailwind'
  | 'postgres'
  | 'redis'
  | 'docker'
  | 'githubactions'
  | 'git'
  | 'nginx'
  | 'xunit'
  | 'openai';

export interface Skill {
  name: string;
  icon: IconKey;
  /** 0-100. Used for the meter width and the aria-valuenow, nothing else. */
  level: number;
  note: string;
}

export interface SkillGroup {
  id: string;
  title: string;
  blurb: string;
  skills: Skill[];
}

export const skillGroups: SkillGroup[] = [
  {
    id: 'backend',
    title: 'Back end',
    blurb: 'Where most of my thinking happens — domain models, boundaries and data.',
    skills: [
      { name: 'ASP.NET Core', icon: 'dotnet', level: 95, note: 'Minimal APIs, middleware, policy-based auth' },
      { name: 'C#', icon: 'csharp', level: 94, note: 'Records, spans, source generators' },
      { name: 'EF Core', icon: 'efcore', level: 92, note: 'Projections, compiled queries, migrations' },
      { name: 'SignalR', icon: 'signalr', level: 86, note: 'Pushing live updates to connected clients' },
      { name: 'xUnit', icon: 'xunit', level: 88, note: 'Unit and integration suites' },
    ],
  },
  {
    id: 'frontend',
    title: 'Front end',
    blurb: 'Typed, accessible interfaces that survive contact with real data.',
    skills: [
      { name: 'React', icon: 'react', level: 92, note: 'Hooks, suspense, render discipline' },
      { name: 'TypeScript', icon: 'typescript', level: 93, note: 'Generics, discriminated unions, strict mode' },
      { name: 'Next.js', icon: 'nextjs', level: 87, note: 'App Router, server components, ISR' },
      { name: 'Tailwind CSS', icon: 'tailwind', level: 90, note: 'Design tokens over ad-hoc classes' },
    ],
  },
  {
    id: 'data',
    title: 'Data & caching',
    blurb: 'Schemas that hold their shape, and caches that invalidate on purpose.',
    skills: [
      { name: 'PostgreSQL', icon: 'postgres', level: 89, note: 'Indexing, constraints, query plans' },
      { name: 'Redis', icon: 'redis', level: 82, note: 'Caching alongside a relational store' },
    ],
  },
  {
    id: 'platform',
    title: 'Platform & delivery',
    blurb: 'Getting it to production repeatably, then keeping it observable.',
    skills: [
      { name: 'Docker', icon: 'docker', level: 88, note: 'Multi-stage builds, Compose stacks' },
      { name: 'GitHub Actions', icon: 'githubactions', level: 86, note: 'Matrix builds, container-backed tests' },
      { name: 'Git', icon: 'git', level: 91, note: 'Trunk-based flow, reviewable history' },
      { name: 'Nginx', icon: 'nginx', level: 78, note: 'Reverse proxy, TLS, caching headers' },
      { name: 'AI tooling', icon: 'openai', level: 80, note: 'LLM integration, embeddings, automation' },
    ],
  },
];

/** Flat list for the marquee strip under the hero. */
export const marqueeSkills = skillGroups.flatMap((g) => g.skills.map((s) => s.name));

export const principles = [
  {
    title: 'Boundaries first',
    body: 'Layers exist so a change in one place cannot quietly become a change in five. I draw the seam before writing the feature.',
  },
  {
    title: 'Invariants in the type system',
    body: 'If an invalid state can be represented, it will eventually be constructed. Constructors, not comments, enforce the rules.',
  },
  {
    title: 'Tests where the bugs live',
    body: 'Between components, not inside them. A suite that runs anywhere, with nothing to provision first, is a suite that actually gets run.',
  },
  {
    title: 'Fail loudly, early',
    body: 'A typed conflict at the boundary is cheaper than a silent overwrite discovered three weeks later in a support ticket.',
  },
];
