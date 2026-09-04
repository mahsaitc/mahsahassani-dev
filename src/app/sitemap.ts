import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';
import { loadPosts, loadProjects } from '@/lib/content';
import { routing } from '@/i18n/routing';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Sourced from the CMS so a project or post added from the dashboard is
  // indexed on the next revalidation instead of waiting for a code change.
  const [projects, sortedPosts] = await Promise.all([loadProjects(), loadPosts()]);

  const now = new Date();
  const { locales, defaultLocale } = routing;

  /**
   * One entry per locale, each carrying the full alternates set. Search engines
   * need every version to point at every other, not just at the default.
   */
  const alternatesFor = (path: string) => ({
    languages: Object.fromEntries(locales.map((l) => [l, `${site.url}/${l}${path}`])),
  });

  const localised = (path: string, changeFrequency: 'monthly' | 'weekly' | 'yearly', priority: number, lastModified = now) =>
    locales.map((locale) => ({
      url: `${site.url}/${locale}${path}`,
      lastModified,
      changeFrequency,
      priority: locale === defaultLocale ? priority : priority * 0.9,
      alternates: alternatesFor(path),
    }));

  return [
    ...localised('', 'monthly', 1),
    ...localised('/blog', 'weekly', 0.7),
    ...projects.flatMap((p) => localised(`/projects/${p.slug}`, 'monthly', 0.8)),
    ...sortedPosts.flatMap((p) =>
      localised(`/blog/${p.slug}`, 'yearly', 0.6, p.date ? new Date(p.date) : now),
    ),
  ];
}
