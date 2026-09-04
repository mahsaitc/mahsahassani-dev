import {
  deriveTechFilters,
  loadMarqueeSkills,
  loadPosts,
  loadProjects,
  loadSiteCopy,
  loadSkillGroups,
  loadTestimonials,
  loadTimeline,
} from '@/lib/content';
import { setRequestLocale } from 'next-intl/server';
import { fetchManyRepoStats } from '@/lib/github';
import { videoIfPresent } from '@/lib/media';
import { Hero } from '@/components/sections/hero';
import { About } from '@/components/sections/about';
import { Skills } from '@/components/sections/skills';
import { Projects } from '@/components/sections/projects';
import { Timeline } from '@/components/sections/timeline';
import { Testimonials } from '@/components/sections/testimonials';
import { Writing } from '@/components/sections/writing';
import { Contact } from '@/components/sections/contact';

/**
 * The route segment's revalidate caps the whole page, so it — not the
 * per-fetch setting — decides how soon a dashboard edit shows up. One minute.
 *
 * This does not increase GitHub traffic: fetchRepoStats carries its own
 * `revalidate: 3600`, so stars are still only re-fetched hourly even though the
 * page itself re-renders more often.
 */
export const revalidate = 60;

export default async function HomePage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  setRequestLocale(locale);

  const [projects, testimonials, skillGroups, marquee, timeline, posts, copy] = await Promise.all([
    loadProjects(locale),
    loadTestimonials(locale),
    loadSkillGroups(locale),
    loadMarqueeSkills(),
    loadTimeline(locale),
    loadPosts(locale),
    loadSiteCopy(locale),
  ]);

  // Keyed by slug; looked up by repoName, which differs for the clinic API.
  const stats = await fetchManyRepoStats(
    projects.map((p) => ({ key: p.slug, repoName: p.repoName })),
  );

  // A CMS upload is already a full URL and always exists; a path from the
  // static file still has to be checked against disk before it is offered.
  const videos = Object.fromEntries(
    projects.map((p) => [
      p.slug,
      p.media.video?.startsWith('http') ? p.media.video : videoIfPresent(p.media.video),
    ]),
  );

  return (
    <>
      <Hero
        availability={copy.availability}
        marquee={marquee}
        github={copy.github}
        linkedin={copy.linkedin}
        headline={copy.heroHeadline}
        intro={copy.heroIntro}
      />
      <About
        headline={copy.aboutHeadline}
        body={copy.aboutBody}
        availability={copy.availability}
        location={copy.location}
      />
      <Skills groups={skillGroups} />
      <Projects projects={projects} filters={deriveTechFilters(projects)} stats={stats} videos={videos} />
      <Timeline entries={timeline} />
      {/* Self-hiding until a real, attributed quote is published from the dashboard. */}
      <Testimonials items={testimonials} />
      <Writing posts={posts} />
      <Contact
        email={copy.email}
        phone={copy.phone}
        location={copy.location}
        github={copy.github}
        linkedin={copy.linkedin}
      />
    </>
  );
}
