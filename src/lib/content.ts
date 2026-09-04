import 'server-only';

import {
  getProjects,
  getPublishedPost,
  getPublishedPosts,
  getSettings,
  getSkills,
  getTestimonials,
  getTimeline,
  mediaUrl,
} from '@/lib/api';
import { projects as staticProjects, type Project, type TechTag } from '@/data/projects';
import { site } from '@/lib/site';
import type { TimelineKind } from '@/components/sections/timeline';
import type { ApiPost, ApiProject, ApiSkill, ApiTimelineEntry, IconKeyLike } from '@/lib/api-types';

/**
 * Bridges the CMS to the shapes the existing page components already render.
 *
 * The dashboard manages the card fields Mahsa asked for — name, summary, tech
 * tags, repo name, demo URL, media. The case-study narrative (architecture,
 * outcome) has no CMS equivalent, so it is merged in from src/data/projects.ts
 * by slug. That keeps the verified 2026-08-30 write-up intact while the card
 * itself becomes editable, and means a project added from the dashboard renders
 * a correct, shorter case study rather than a broken one.
 */


/**
 * Picks the Persian value when one has been written, otherwise the English one.
 *
 * This is the single fallback rule for the whole site. A missing translation
 * shows the English text rather than a blank, and nothing is ever machine
 * translated — an empty Persian field means Mahsa has not written it yet, which
 * is different from it being empty on purpose.
 */
export function pick(locale: string, en: string, fa: string | null | undefined): string {
  if (locale !== 'fa') return en;
  const translated = fa?.trim();
  return translated && translated.length > 0 ? translated : en;
}

/** True when the Persian version of a field is still missing. */
export const needsTranslation = (fa: string | null | undefined) => !fa || fa.trim().length === 0;

/** Narrative sections that live in code, keyed by slug. */
const narrativeBySlug = new Map(staticProjects.map((p) => [p.slug, p]));

export interface MergedProject extends Project {
  /** True when the record came from the CMS rather than the static file. */
  fromCms: boolean;
}

function fromApi(api: ApiProject, locale: string): MergedProject {
  const narrative = narrativeBySlug.get(api.slug);

  return {
    slug: api.slug,
    repoName: api.repoName,
    // Project names are proper nouns and stay as written in both locales.
    name: api.name,
    tagline: pick(locale, api.tagline, api.taglineFa),
    summary: pick(locale, api.summary, api.summaryFa),
    year: api.year,
    featured: api.featured,
    // Tags are free text in the CMS; the union is a compile-time convenience.
    tech: api.tech as TechTag[],
    stack: narrative?.stack ?? api.tech,
    repo: `https://github.com/mahsaitc/${api.repoName}`,
    demo: api.demoUrl ?? undefined,
    media: {
      // CMS uploads win; otherwise fall back to whatever the file declared.
      video: mediaUrl(api.videoPath) ?? narrative?.media.video,
      poster: mediaUrl(api.posterPath) ?? narrative?.media.poster ?? '/images/projects/placeholder.svg',
      alt: api.mediaAlt || narrative?.media.alt || api.name,
    },
    metrics: narrative?.metrics,
    challenge: narrative?.challenge,
    solution: narrative?.solution,
    architecture: narrative?.architecture,
    outcome: narrative?.outcome,
    fromCms: true,
  };
}

/**
 * Projects for the public site. Falls back to the static file when the API is
 * unreachable or still empty, so the site never renders an empty portfolio
 * because the backend happened to be restarting.
 */
export async function loadProjects(locale = 'en'): Promise<MergedProject[]> {
  const api = await getProjects();
  if (api.length > 0) return api.map((p) => fromApi(p, locale));

  return staticProjects.map((p) => ({ ...p, fromCms: false }));
}

export async function loadProject(slug: string, locale = 'en'): Promise<MergedProject | null> {
  const all = await loadProjects(locale);
  return all.find((p) => p.slug === slug) ?? null;
}

/** Published testimonials, already in dashboard order. */
export async function loadTestimonials(locale = 'en') {
  const items = await getTestimonials();
  return items.map((t) => ({
    quote: pick(locale, t.quote, t.quoteFa),
    // A person's name is never translated.
    name: t.name,
    role: pick(locale, t.role, t.roleFa),
    initials: t.initials,
    source: t.sourceUrl ?? undefined,
  }));
}

// ── Skills ──────────────────────────────────────────────────────────────────

export interface LoadedSkillGroup {
  id: string;
  title: string;
  blurb: string;
  skills: { name: string; icon: IconKeyLike; level: number; note: string }[];
}

/**
 * Skills, regrouped from the CMS's flat list into the sections the component
 * renders. Returns an empty array when nothing is stored, which the section
 * treats as "render nothing" rather than an error.
 */
export async function loadSkillGroups(locale = 'en'): Promise<LoadedSkillGroup[]> {
  const skills = await getSkills();
  if (skills.length === 0) return [];

  const groups = new Map<string, { title: string; order: number; blurb: string; items: ApiSkill[] }>();

  for (const skill of skills) {
    // Grouped by the English name so a half-translated set cannot split one
    // group into two.
    const existing = groups.get(skill.groupName);
    const blurb = pick(locale, skill.groupBlurb, skill.groupBlurbFa);

    if (existing) {
      existing.items.push(skill);
      // The blurb is denormalised onto every row; the first non-empty one wins.
      if (!existing.blurb && blurb) existing.blurb = blurb;
    } else {
      groups.set(skill.groupName, {
        title: pick(locale, skill.groupName, skill.groupNameFa),
        order: skill.groupOrder,
        blurb,
        items: [skill],
      });
    }
  }

  return [...groups.entries()]
    .sort((a, b) => a[1].order - b[1].order || a[0].localeCompare(b[0]))
    .map(([englishTitle, group]) => ({
      // Anchor id stays derived from the English name so links survive a locale switch.
      id: englishTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: group.title,
      blurb: group.blurb,
      skills: group.items
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((s) => ({
          // Technology names are never translated.
          name: s.name,
          icon: s.iconKey as IconKeyLike,
          level: s.level,
          note: pick(locale, s.note, s.noteFa),
        })),
    }));
}

/** Flat name list for the hero marquee, in dashboard order. */
export async function loadMarqueeSkills(): Promise<string[]> {
  // Always English: the marquee is a list of technology names.
  const groups = await loadSkillGroups('en');
  return groups.flatMap((g) => g.skills.map((s) => s.name));
}

// ── Timeline ────────────────────────────────────────────────────────────────

export interface LoadedTimelineEntry {
  kind: TimelineKind;
  period: string;
  title: string;
  org: string;
  summary: string;
  points: string[];
  tags: string[];
}

/**
 * Timeline entries for the public site.
 *
 * Unverified entries are filtered out HERE, not in the component, so every
 * consumer — the public section and the resume PDF — inherits the rule from one
 * place and the two can never disagree about which entries are trustworthy.
 *
 * The placeholder entries were replaced on 2026-09-02 with eight confirmed
 * ones, all verified. Anything added later starts unverified and stays off the
 * site until it is ticked in the dashboard.
 */
export async function loadTimeline(locale = 'en'): Promise<LoadedTimelineEntry[]> {
  const entries = await getTimeline();

  return entries
    .filter((e) => e.verified)
    .map((e: ApiTimelineEntry) => ({
      kind: e.kind,
      period: pick(locale, e.period, e.periodFa),
      title: pick(locale, e.title, e.titleFa),
      org: pick(locale, e.organisation, e.organisationFa),
      summary: pick(locale, e.description, e.descriptionFa),
      points: e.points,
      // Tech tags stay in their original form in both locales.
      tags: e.tags,
    }));
}

// ── Blog ────────────────────────────────────────────────────────────────────

/** Mirrors the Block union the existing post renderer already understands. */
export type PostBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'code'; lang: string; code: string };

export interface LoadedPost {
  slug: string;
  title: string;
  excerpt: string;
  body: PostBlock[];
  coverImage?: string;
  tags: string[];
  date: string | null;
  readingMinutes: number;
}

/**
 * Converts the dashboard's Markdown into the block list the post page renders.
 *
 * Deliberately small: it handles the five shapes `BlockView` can draw and
 * nothing else. Adding a Markdown library would pull a parser, a sanitiser and
 * a styling layer into the bundle to render structures the design has no styles
 * for anyway. Anything unrecognised falls through as a paragraph, so no input
 * is ever dropped silently.
 */
export function markdownToBlocks(markdown: string): PostBlock[] {
  const blocks: PostBlock[] = [];
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');

  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: 'p', text: paragraph.join(' ').trim() });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length > 0) {
      blocks.push({ type: 'ul', items: [...list] });
      list = [];
    }
  };
  const flushAll = () => {
    flushParagraph();
    flushList();
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Fenced code: consume through the closing fence so its contents are never
    // reinterpreted as Markdown.
    if (trimmed.startsWith('```')) {
      flushAll();
      const lang = trimmed.slice(3).trim();
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        body.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'code', lang: lang || 'text', code: body.join('\n') });
      continue;
    }

    if (trimmed === '') {
      flushAll();
      continue;
    }

    // Any heading level maps to h2 — the design has one in-article heading style.
    const heading = /^#{1,6}\s+(.*)$/.exec(trimmed);
    if (heading) {
      flushAll();
      blocks.push({ type: 'h2', text: heading[1].trim() });
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      flushAll();
      blocks.push({ type: 'quote', text: trimmed.replace(/^>\s?/, '').trim() });
      continue;
    }

    const bullet = /^[-*+]\s+(.*)$/.exec(trimmed);
    if (bullet) {
      flushParagraph();
      list.push(bullet[1].trim());
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flushAll();
  return blocks;
}

/** Roughly 200 words a minute, floored at one. */
function readingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function toPost(p: ApiPost, locale: string): LoadedPost {
  // The English posts carry audited technical claims. A Persian body is only
  // ever shown when it has actually been written; it is never derived here.
  const body = pick(locale, p.bodyMarkdown, p.bodyMarkdownFa);

  return {
    slug: p.slug,
    title: pick(locale, p.title, p.titleFa),
    excerpt: pick(locale, p.excerpt, p.excerptFa),
    body: markdownToBlocks(body),
    coverImage: mediaUrl(p.coverImagePath),
    tags: p.tags,
    date: p.publishedAtUtc,
    readingMinutes: readingMinutes(body),
  };
}

export async function loadPosts(locale = 'en'): Promise<LoadedPost[]> {
  return (await getPublishedPosts()).map((p) => toPost(p, locale));
}

export async function loadPost(slug: string, locale = 'en'): Promise<LoadedPost | null> {
  const post = await getPublishedPost(slug);
  return post ? toPost(post, locale) : null;
}

// ── Site copy ───────────────────────────────────────────────────────────────

export interface LoadedSiteCopy {
  heroHeadline: string;
  heroIntro: string;
  aboutHeadline: string;
  aboutBody: string;
  email: string;
  phone: string;
  location: string;
  availability: string;
  github: string;
  linkedin: string;
}

/**
 * Editable copy, layered over the structural config in site.ts.
 *
 * site.ts still owns everything the CMS has no business editing — the domain,
 * nav, SEO defaults, JSON-LD. Only these seven strings are dashboard-managed,
 * and each falls back to the value in site.ts when the key is unset, so an
 * empty database renders exactly what the site renders today.
 */
export async function loadSiteCopy(locale = 'en'): Promise<LoadedSiteCopy> {
  const settings = await getSettings();

  /**
   * Settings are key/value, so Persian lives under a `.fa` suffixed key rather
   * than a parallel column. Same rule as everywhere else: an unset Persian key
   * falls back to English.
   */
  const value = (key: string, fallback: string) => {
    const english = settings[key]?.trim() || fallback;
    if (locale !== 'fa') return english;
    return settings[`${key}.fa`]?.trim() || english;
  };

  return {
    heroHeadline: value('hero.headline', site.hero.headline),
    heroIntro: value('hero.intro', site.hero.intro),
    aboutHeadline: value('about.headline', site.about.headline),
    aboutBody: value('about.body', site.about.body),
    email: value('contact.email', site.email),
    phone: value('contact.phone', site.phone),
    location: value('contact.location', site.location),
    availability: value('contact.availability', site.availability),
    github: value('social.github', site.github.url),
    linkedin: value('social.linkedin', site.linkedin.url),
  };
}

/** Derived filter list, so a tag added in the dashboard appears in the filter bar. */
export function deriveTechFilters(list: MergedProject[]): TechTag[] {
  const counts = new Map<TechTag, number>();
  for (const p of list) {
    for (const t of p.tech) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
    .map(([t]) => t);
}
