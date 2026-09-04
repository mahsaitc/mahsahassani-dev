export type TimelineKind = 'work' | 'education' | 'milestone' | 'certification' | 'project';

export interface TimelineEntry {
  /**
   * Only verified entries reach the public timeline AND the resume PDF, so an
   * unconfirmed draft can sit here without ever being published.
   */
  verified?: boolean;
  period: string;
  title: string;
  /** Institution or issuer. Empty is correct when it has not been supplied. */
  org: string;
  kind: TimelineKind;
  summary: string;
  points: string[];
  tags: string[];
}

/**
 * CONFIRMED BY MAHSA — 2026-09-02. These replaced the earlier placeholder
 * periods and titles entirely, and every entry is marked verified.
 *
 * This file is now only the seed for `npm run import:content`. The database is
 * the live source; edit through the dashboard from here on, or these values
 * will drift from what the site actually renders.
 *
 * Oldest first, matching the order the entries were given in.
 *
 * `org`, `summary`, `points` and `tags` are deliberately empty: no institution,
 * issuer or description was supplied, and the component omits an empty line
 * rather than showing a gap. Fill them in from the dashboard.
 */
export const timeline: TimelineEntry[] = [
  {
    verified: true,
    period: '1999',
    title: 'Doctor of General Medicine',
    org: '',
    kind: 'education',
    summary: '',
    points: [],
    tags: [],
  },
  {
    verified: true,
    period: '2020',
    title: 'ASP.NET Core Certification',
    org: '',
    kind: 'certification',
    summary: '',
    points: [],
    tags: [],
  },
  {
    verified: true,
    period: '2024',
    title: 'Computer Engineering — Software Design, Shiraz University',
    org: '',
    kind: 'education',
    summary: '',
    points: [],
    tags: [],
  },
  {
    verified: true,
    period: '2025',
    title: 'RxClinic',
    org: '',
    kind: 'project',
    summary: '',
    points: [],
    tags: [],
  },
  {
    verified: true,
    period: '2025',
    title: 'InvenTrack',
    org: '',
    kind: 'project',
    summary: '',
    points: [],
    tags: [],
  },
  {
    verified: true,
    period: '2025',
    title: 'ArticleForge',
    org: '',
    kind: 'project',
    summary: '',
    points: [],
    tags: [],
  },
  {
    verified: true,
    period: '2026',
    title: 'TaskFlow',
    org: '',
    kind: 'project',
    summary: '',
    points: [],
    tags: [],
  },
  {
    verified: true,
    period: '2026',
    title: 'CartForge',
    org: '',
    kind: 'project',
    summary: '',
    points: [],
    tags: [],
  },
];
