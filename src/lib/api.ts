import 'server-only';

import type {
  ApiPost,
  ApiProject,
  ApiResumeVersion,
  ApiSkill,
  ApiTestimonial,
  ApiTimelineEntry,
} from '@/lib/api-types';

/**
 * Server-side reader for public content.
 *
 * Every call is wrapped so an unreachable API degrades to an empty result
 * instead of failing the render. A portfolio that builds with sections hidden
 * beats one that will not build at all because the VPS was restarting — and the
 * sections already self-hide when their data is empty.
 *
 * Reads use ISR: the page is served from cache and refreshed in the background,
 * so publishing from the dashboard appears within the revalidate window without
 * a rebuild.
 */

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5099';

/** Seconds before a cached public response is considered stale. */
const REVALIDATE = Number(process.env.API_REVALIDATE_SECONDS ?? 60);

/**
 * Static export (npm run build:static). Pages are frozen at build time and
 * uploads are copied next to them, so media paths stay relative.
 */
const isStaticExport = process.env.NEXT_OUTPUT === 'export';

/**
 * Set by build:static. The degrade-to-empty rule above suits a server that will
 * re-fetch in a minute; a static export would ship the hollow page until the
 * next manual deploy, so there every failure must fail the build instead.
 */
const strict = process.env.STRICT_API === '1';

async function read<T>(path: string, fallback: T, revalidate = REVALIDATE): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/${path}`, {
      next: { revalidate, tags: ['content'] },
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    if (strict) throw new Error(`[api] ${path} unreachable at ${API_BASE}: ${reason}`);
    console.warn(`[api] ${path} unreachable:`, reason);
    return fallback;
  }

  if (!response.ok) {
    // 404 is meaningful for single items; the caller's fallback expresses it.
    if (response.status === 404) return fallback;
    if (strict) throw new Error(`[api] ${path} responded ${response.status}`);
    console.warn(`[api] ${path} responded ${response.status}`);
    return fallback;
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    if (strict) throw new Error(`[api] ${path} returned malformed JSON`);
    console.warn(`[api] ${path} returned malformed JSON:`, error instanceof Error ? error.message : error);
    return fallback;
  }
}

export const getProjects = () => read<ApiProject[]>('projects', []);

export const getProject = (slug: string) =>
  read<ApiProject | null>(`projects/${encodeURIComponent(slug)}`, null);

export const getPublishedPosts = () => read<ApiPost[]>('posts/published', []);

export const getPublishedPost = (slug: string) =>
  read<ApiPost | null>(`posts/published/${encodeURIComponent(slug)}`, null);

/**
 * Draft preview. Never cached — the whole point is to see the current draft,
 * and the key is a capability that should not be baked into a shared cache.
 */
export async function getPostPreview(slug: string, key: string): Promise<ApiPost | null> {
  try {
    const response = await fetch(
      `${API_BASE}/api/posts/preview/${encodeURIComponent(slug)}?key=${encodeURIComponent(key)}`,
      { cache: 'no-store', headers: { Accept: 'application/json' } },
    );
    return response.ok ? ((await response.json()) as ApiPost) : null;
  } catch {
    return null;
  }
}

export const getSkills = () => read<ApiSkill[]>('content/skills', []);
export const getTimeline = () => read<ApiTimelineEntry[]>('content/timeline', []);
export const getTestimonials = () => read<ApiTestimonial[]>('content/testimonials', []);
export const getSettings = () => read<Record<string, string>>('content/settings', {});
export const getCurrentResume = () => read<ApiResumeVersion | null>('resume/current', null);

/**
 * Absolute URL for an uploaded file. Stored paths are API-relative, so they
 * need the API origin prepended before a browser can load them.
 *
 * The static export is the exception: the API is not deployed with it, so the
 * path stays relative (/uploads/...) and scripts/postexport.mjs copies each
 * referenced file into out/uploads. An absolute URL on the API origin is cut
 * back to its path for the same reason.
 */
export function mediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;

  if (isStaticExport) {
    if (path.startsWith(API_BASE)) return path.slice(API_BASE.length) || undefined;
    return path;
  }

  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE}${path}`;
}

/** Groups a flat skill list back into the sections the UI renders. */
export function groupSkills(skills: ApiSkill[]) {
  const groups = new Map<string, { name: string; order: number; items: ApiSkill[] }>();

  for (const skill of skills) {
    const existing = groups.get(skill.groupName);
    if (existing) {
      existing.items.push(skill);
    } else {
      groups.set(skill.groupName, { name: skill.groupName, order: skill.groupOrder, items: [skill] });
    }
  }

  return [...groups.values()]
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
    .map((g) => ({ ...g, items: g.items.sort((a, b) => a.sortOrder - b.sortOrder) }));
}
