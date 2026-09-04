/**
 * One-off migration: pushes the content already in src/data/*.ts into the API.
 *
 * The database starts empty by design, but the project entries were verified
 * against the real repositories on 2026-08-30 and that work should not be
 * retyped. This imports exactly what is in those files and invents nothing:
 * fields the CMS has but the static data does not (skill icons aside) are left
 * blank for you to fill in from the dashboard.
 *
 * Timeline entries carry whatever `verified` flag the source file sets. That
 * file was placeholder text until 2026-09-02; it now holds Mahsa's confirmed
 * entries, all verified. Testimonials are skipped entirely — that file is
 * deliberately an empty template.
 *
 * Pass --replace-timeline to delete existing timeline rows first, for when the
 * source entries supersede what is already stored rather than adding to it.
 *
 * Usage:
 *   node --import ./scripts/ts-alias-hook.mjs scripts/import-existing-content.mjs \
 *     --api http://localhost:5099 --email you@example.com --password '...'
 *
 * Re-running is safe: anything whose slug already exists is skipped, not duplicated.
 */

import { projects } from '@/data/projects.ts';
import { skillGroups } from '@/data/skills.ts';
import { timeline } from '@/data/timeline.ts';

function arg(name, fallback = undefined) {
  const index = process.argv.indexOf(`--${name}`);
  if (index !== -1 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

const API = arg('api', 'http://localhost:5099').replace(/\/$/, '');
const EMAIL = arg('email');
const PASSWORD = arg('password');
const DRY_RUN = process.argv.includes('--dry-run');
const REPLACE_TIMELINE = process.argv.includes('--replace-timeline');

if (!EMAIL || !PASSWORD) {
  console.error('Missing credentials.\n  --email <admin email>  --password <password>');
  process.exit(1);
}

let token;

async function call(path, options = {}) {
  const response = await fetch(`${API}/api/${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${options.method ?? 'GET'} ${path} -> ${response.status} ${body.slice(0, 300)}`);
  }

  return response.status === 204 ? null : response.json();
}

async function main() {
  const login = await call('auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  token = login.token;
  console.log(`Signed in as ${login.user.email} (${login.user.role})\n`);

  // ── Projects ──────────────────────────────────────────────────────────────
  const existingProjects = await call('projects');
  const haveSlugs = new Set(existingProjects.map((p) => p.slug));

  console.log('Projects');
  for (const p of projects) {
    if (haveSlugs.has(p.slug)) {
      console.log(`  skip   ${p.slug} (already present)`);
      continue;
    }

    const payload = {
      name: p.name,
      slug: p.slug,
      tagline: p.tagline,
      summary: p.summary,
      repoName: p.repoName,
      // Deliberately null: no repo has a homepage, so there is nothing to link.
      demoUrl: null,
      techTags: p.tech.join(','),
      year: p.year,
      featured: p.featured,
      mediaAlt: p.media.alt,
      // Media lives on disk under the old public/ tree, not in the CMS store.
      // Re-upload through the dashboard to attach it.
      videoPath: null,
      posterPath: null,
    };

    if (DRY_RUN) {
      console.log(`  would create ${p.slug}`);
      continue;
    }

    await call('projects', { method: 'POST', body: JSON.stringify(payload) });
    console.log(`  create ${p.slug}`);
  }

  // ── Skills ────────────────────────────────────────────────────────────────
  const existingSkills = await call('content/skills');
  const haveSkills = new Set(existingSkills.map((s) => `${s.groupName}::${s.name}`));

  console.log('\nSkills');
  let groupOrder = 0;
  for (const group of skillGroups) {
    for (const skill of group.skills) {
      const key = `${group.title}::${skill.name}`;
      if (haveSkills.has(key)) {
        console.log(`  skip   ${skill.name}`);
        continue;
      }

      const payload = {
        groupName: group.title,
        groupOrder,
        name: skill.name,
        iconKey: skill.icon,
        level: skill.level,
        note: skill.note ?? '',
      };

      if (DRY_RUN) {
        console.log(`  would create ${skill.name}`);
        continue;
      }

      await call('content/skills', { method: 'POST', body: JSON.stringify(payload) });
      console.log(`  create ${skill.name} (${group.title})`);
    }
    groupOrder += 1;
  }

  // ── Timeline ──────────────────────────────────────────────────────────────
  const existingTimeline = await call('content/timeline');
  const haveTimeline = new Set(existingTimeline.map((t) => `${t.period}::${t.title}`));

  if (REPLACE_TIMELINE && !DRY_RUN) {
    // Periods and titles both changed, so the skip-by-key check below would not
    // match the old rows and they would linger alongside the new ones.
    console.log('\nTimeline  (--replace-timeline: clearing existing rows)');
    for (const existing of existingTimeline) {
      await call(`content/timeline/${existing.id}`, { method: 'DELETE' });
      console.log(`  delete ${existing.period} ${existing.title}`);
    }
    haveTimeline.clear();
  } else {
    console.log('\nTimeline');
  }

  for (const entry of timeline) {
    const key = `${entry.period}::${entry.title}`;
    if (haveTimeline.has(key)) {
      console.log(`  skip   ${entry.title}`);
      continue;
    }

    // The CMS keeps one description field, so the summary and its bullet
    // points are joined rather than silently dropping the bullets.
    const description = [entry.summary, ...(entry.points ?? [])]
      .filter(Boolean)
      .join('\n');

    const payload = {
      period: entry.period,
      title: entry.title,
      organisation: entry.org,
      description: description.slice(0, 600),
      kind: entry.kind ?? 'work',
      points: (entry.points ?? []).join('\n'),
      tags: (entry.tags ?? []).join(','),
      // Taken from the source file rather than forced: the safety now lives in
      // that file, which marks an entry verified only once it is confirmed.
      verified: entry.verified === true,
    };

    if (DRY_RUN) {
      console.log(`  would create ${entry.title}`);
      continue;
    }

    await call('content/timeline', { method: 'POST', body: JSON.stringify(payload) });
    console.log(`  create ${entry.period.padEnd(6)} ${entry.title}${payload.verified ? '  [verified]' : ''}`);
  }

  console.log('\nDone.');
  console.log('Not imported, on purpose:');
  console.log('  - Testimonials: src/data/testimonials.ts is an empty template.');
  console.log('  - Blog posts:   src/content/posts.ts is unreviewed writing; add via the dashboard.');
  console.log('  - Project media: re-upload posters/clips through Media so they enter the CMS store.');
  console.log('  - About/contact copy: fill in from Page content once you confirm the wording.');
}

main().catch((error) => {
  console.error(`\nImport failed: ${error.message}`);
  process.exit(1);
});
