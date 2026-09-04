/**
 * Single source of truth for identity, links and SEO defaults.
 * Change values here and every meta tag, JSON-LD block and CTA follows.
 */
export const site = {
  name: 'Mahsa Hassani',
  initials: 'MH',
  title: 'Computer Engineer — Software Design',
  role: 'Full-Stack Developer · ASP.NET Core & React',
  tagline: 'I design systems that stay clean under pressure.',
  description:
    'Computer Engineer specialising in software design. Full-stack developer building production systems with ASP.NET Core (Clean Architecture, CQRS, EF Core) and React + TypeScript.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mahsahassani.dev',
  locale: 'en_US',
  /**
   * Default About copy. The dashboard can override headline and body via the
   * `about.headline` / `about.body` settings keys; these are what renders when
   * those keys are unset, so an empty database looks exactly like today.
   *
   * Body is paragraphs separated by a blank line. `**text**` renders emphasised.
   */
  /**
   * Hero copy. Same pattern as `about`: these are the defaults, and the CMS
   * overrides them via the `hero.headline` / `hero.intro` settings keys (plus
   * `.fa` siblings for Persian).
   *
   * Headline is one line per row. The last row takes the gold accent, so the
   * emphasis lands wherever the final line ends.
   *
   * Intro renders `**text**` as the highlighted span, matching the About body.
   */
  hero: {
    headline: ['Software', 'that stays', 'legible.'].join('\n'),
    intro:
      "I'm **Mahsa Hassani** — a computer engineer specialising in software design. " +
      'I build production systems with **ASP.NET Core** and **React**, where the ' +
      'architecture is the feature that keeps paying rent.',
  },

  about: {
    headline: 'Two disciplines, one habit of mind.',
    body: [
      "I'm a computer engineer specialising in software design, working full-stack across ASP.NET Core and React. Most of my energy goes into the part nobody sees on a screenshot: where the boundaries sit, which invariants the type system enforces, and what happens the day a requirement arrives that nobody planned for.",
      'I started in **General Medicine** before moving into engineering. That is not a detour I apologise for — it is the reason I model domains the way I do. Medicine trains you to reason from symptoms to cause under incomplete information, to distrust the first plausible explanation, and to write notes precise enough that a stranger can act on them safely. Debugging a distributed system asks for exactly the same discipline.',
      'Day to day that shows up as: Clean Architecture and CQRS on the back end, typed and accessible React on the front, containers for anything that needs to run twice the same way, and a healthy interest in automation and applied AI.',
    ].join('\n\n'),
  },

  email: 'mahsaitc74@gmail.com',

  /** Empty unless supplied; the CMS `contact.phone` setting overrides it. */
  phone: '',
  location: 'Iran · Remote friendly',
  availability: 'Open to senior back-end & full-stack roles',
  resumePath: '/mahsa-hassani-resume.pdf',
  ogImage: '/images/og.png',
  github: {
    handle: 'mahsaitc',
    url: 'https://github.com/mahsaitc',
  },
  linkedin: {
    handle: 'mahsahassani',
    url: 'https://www.linkedin.com/in/mahsahassani',
  },
  keywords: [
    'Mahsa Hassani',
    'ASP.NET Core developer',
    'Clean Architecture',
    'CQRS',
    'EF Core',
    'React',
    'TypeScript',
    'PostgreSQL',
    'Docker',
    'SignalR',
    'software architecture',
    'full-stack developer',
  ],
} as const;

export const navItems = [
  { href: '#about', key: 'about', label: 'About' },
  { href: '#skills', key: 'skills', label: 'Skills' },
  { href: '#work', key: 'work', label: 'Work' },
  { href: '#journey', key: 'journey', label: 'Journey' },
  { href: '#writing', key: 'writing', label: 'Writing' },
  { href: '#contact', key: 'contact', label: 'Contact' },
] as const;

/** True when the bundle was produced by `npm run build:static`. */
export const isStaticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true';
