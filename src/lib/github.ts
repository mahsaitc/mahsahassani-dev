import { site } from './site';

export interface RepoStats {
  name: string;
  stars: number;
  forks: number;
  language: string | null;
  pushedAt: string | null;
  url: string;
}

/**
 * Unauthenticated GitHub reads are limited to 60/hour per IP, so this runs on the
 * server and is cached for an hour. Set GITHUB_TOKEN to raise the ceiling.
 * Any failure returns null — repo stats are a garnish, never a render blocker.
 */
export async function fetchRepoStats(repoName: string): Promise<RepoStats | null> {
  const url = `https://api.github.com/repos/${site.github.handle}/${repoName}`;
  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  try {
    const res = await fetch(url, { headers, next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      name: data.name,
      stars: data.stargazers_count ?? 0,
      forks: data.forks_count ?? 0,
      language: data.language ?? null,
      pushedAt: data.pushed_at ?? null,
      url: data.html_url,
    };
  } catch {
    return null;
  }
}

/**
 * Takes `{ key, repoName }` pairs because a project's URL slug and its GitHub
 * repository name are not always the same. The returned map is keyed by `key`.
 */
export async function fetchManyRepoStats(entries: { key: string; repoName: string }[]) {
  const results = await Promise.all(entries.map((e) => fetchRepoStats(e.repoName)));
  const map: Record<string, RepoStats> = {};
  results.forEach((r, i) => {
    if (r) map[entries[i].key] = r;
  });
  return map;
}
