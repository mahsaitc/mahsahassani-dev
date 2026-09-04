/**
 * Builds public/mahsa-hassani-resume.pdf from the same CMS the site renders,
 * so the PDF can never drift from the page.
 *
 *   node --import ./scripts/ts-alias-hook.mjs scripts/generate-resume.mjs
 *   (or: npm run resume)
 *
 * DELIBERATE OMISSIONS — this script refuses to print unverified data:
 *   - Skill proficiency percentages are never printed. They are subjective
 *     estimates, not measurements, and a number like "94%" on a CV invites a
 *     question nobody can answer.
 *   - Timeline entries print only when the API marks them `verified: true`.
 *     The public timeline applies the same rule, so the two can never disagree
 *     about which entries are trustworthy. Everything currently stored is
 *     placeholder text, so the experience section is skipped and a TODO is
 *     reported on stdout instead.
 *   - Contact details come from the CMS. Anything still unset is omitted from
 *     the header and reported as a TODO rather than guessed at.
 *
 * Requires the API to be running; pass --api to point at a different host.
 */
import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import { site } from '@/lib/site.ts';
import { projects as narrativeProjects } from '@/data/projects.ts';

const API = (() => {
  const i = process.argv.indexOf('--api');
  return (i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : process.env.API_BASE_URL || 'http://localhost:5099')
    .replace(/\/$/, '');
})();

async function read(path) {
  const response = await fetch(`${API}/api/${path}`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`GET ${path} -> ${response.status}`);
  return response.json();
}

let apiProjects;
let apiSkills;
let apiTimeline;
let apiSettings;

try {
  [apiProjects, apiSkills, apiTimeline, apiSettings] = await Promise.all([
    read('projects'),
    read('content/skills'),
    read('content/timeline'),
    read('content/settings'),
  ]);
} catch (error) {
  // Refuse rather than emit a PDF missing whole sections without saying so.
  console.error(`Could not reach the content API at ${API}: ${error.message}`);
  console.error('Start it with `npm run api`, or pass --api <url>.');
  process.exit(1);
}

// `stack` and `metrics` are deliberately code-only (see src/lib/content.ts),
// so they are merged in by slug here too. Without this the PDF would silently
// drop the verified test counts and print no stack line at all.
const narrativeBySlug = new Map(narrativeProjects.map((p) => [p.slug, p]));

const projects = apiProjects.map((p) => {
  const narrative = narrativeBySlug.get(p.slug);
  return {
    ...p,
    stack: narrative?.stack ?? p.tech,
    metrics: narrative?.metrics,
  };
});

// Regroup the flat skill list exactly as the site does, so the two agree.
const skillGroups = (() => {
  const groups = new Map();
  for (const skill of apiSkills) {
    const existing = groups.get(skill.groupName);
    if (existing) existing.skills.push(skill);
    else groups.set(skill.groupName, { title: skill.groupName, order: skill.groupOrder, skills: [skill] });
  }
  return [...groups.values()].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
})();

const timeline = apiTimeline;

/**
 * Contact details come from the CMS, falling back to site.ts. Editing them in
 * the dashboard is enough — the PDF and the page cannot disagree about a phone
 * number that only exists in one of them.
 */
const setting = (key, fallback = '') => (apiSettings[key] ?? '').trim() || fallback;
const contactEmail = setting('contact.email', site.email);
const contactPhone = setting('contact.phone', site.phone);
const contactLocation = setting('contact.location', site.location);
const linkedinUrl = setting('social.linkedin', '');

const OUT = path.join(process.cwd(), 'public', 'mahsa-hassani-resume.pdf');
const GOLD = '#8C6A2B';
const INK = '#141210';
const MUTED = '#57514A';
const RULE = '#D8D2C8';

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 54, bottom: 54, left: 54, right: 54 },
  info: {
    Title: `${site.name} — ${site.title}`,
    Author: site.name,
    Subject: site.role,
    Keywords: site.keywords.join(', '),
  },
});
doc.pipe(fs.createWriteStream(OUT));

const W = doc.page.width - doc.page.margins.left - doc.page.margins.right;
const todos = [];

function heading(text) {
  if (doc.y > doc.page.height - 140) doc.addPage();
  doc.moveDown(0.9);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(GOLD).text(text.toUpperCase(), { characterSpacing: 1.6 });
  doc.moveDown(0.25);
  const y = doc.y;
  doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.margins.left + W, y).lineWidth(0.75).strokeColor(RULE).stroke();
  doc.moveDown(0.55);
}

// ── Header ──────────────────────────────────────────────────────────────────
doc.font('Times-Roman').fontSize(30).fillColor(INK).text(site.name);
doc.moveDown(0.15);
doc.font('Helvetica').fontSize(11).fillColor(GOLD).text(site.title);
doc.moveDown(0.1);
doc.font('Helvetica').fontSize(9.5).fillColor(MUTED).text(site.role);
doc.moveDown(0.45);

// Only non-empty values reach the line, so an unset phone leaves no stray separator.
const contact = [
  contactEmail,
  contactPhone,
  contactLocation,
  site.url.replace(/^https?:\/\//, ''),
  setting('social.github', site.github.url).replace(/^https?:\/\//, ''),
  linkedinUrl.replace(/^https?:\/\/(www\.)?/, ''),
].filter(Boolean);
doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(contact.join('   ·   '));

if (!contactPhone) {
  todos.push('Phone number — not set. Add it under Page content → Phone to put it on the CV.');
}
if (!contactLocation) {
  todos.push('Location — not set. Add it under Page content → Location.');
}
if (!linkedinUrl) {
  // Only omitted while genuinely unset; a confirmed URL is printed like any
  // other contact detail rather than being withheld.
  todos.push('LinkedIn URL — not set. Add it under Page content → LinkedIn URL.');
}

// ── Profile ─────────────────────────────────────────────────────────────────
heading('Profile');
doc.font('Helvetica').fontSize(9.8).fillColor(INK).text(site.description, { align: 'left', lineGap: 2.2 });

// ── Skills (names only — no invented proficiency figures) ───────────────────
heading('Technical skills');
for (const group of skillGroups) {
  doc.font('Helvetica-Bold').fontSize(9.2).fillColor(INK).text(`${group.title}:  `, { continued: true });
  doc.font('Helvetica').fontSize(9.2).fillColor(MUTED).text(group.skills.map((s) => s.name).join(', '));
  doc.moveDown(0.3);
}

// ── Projects (verified facts only) ──────────────────────────────────────────
heading('Selected projects');
for (const p of projects) {
  if (doc.y > doc.page.height - 150) doc.addPage();

  doc.font('Helvetica-Bold').fontSize(10.5).fillColor(INK).text(p.name, { continued: true });
  doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(`   ${site.github.url.replace(/^https?:\/\//, '')}/${p.repoName}`);
  doc.moveDown(0.15);

  doc.font('Helvetica-Oblique').fontSize(9.2).fillColor(GOLD).text(p.tagline);
  doc.moveDown(0.2);
  doc.font('Helvetica').fontSize(9.2).fillColor(INK).text(p.summary, { lineGap: 1.8 });
  doc.moveDown(0.25);

  if (p.metrics?.length) {
    doc.font('Helvetica-Bold').fontSize(8.6).fillColor(MUTED)
      .text(p.metrics.map((m) => `${m.value} ${m.label.toLowerCase()}`).join('   ·   '));
    doc.moveDown(0.2);
  }

  doc.font('Helvetica').fontSize(8.6).fillColor(MUTED).text(`Stack: ${p.stack.join(', ')}`, { lineGap: 1.4 });
  doc.moveDown(0.65);
}

// ── Experience (verified entries only) ──────────────────────────────────────
const verified = timeline.filter((t) => t.verified);
if (verified.length > 0) {
  heading('Experience & education');
  for (const entry of verified) {
    if (doc.y > doc.page.height - 130) doc.addPage();
    doc.font('Helvetica-Bold').fontSize(10).fillColor(INK).text(entry.title, { continued: true });
    doc.font('Helvetica').fontSize(9).fillColor(GOLD).text(`   ${entry.period}`);
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(entry.organisation);
    doc.moveDown(0.2);
    doc.font('Helvetica').fontSize(9.2).fillColor(INK).text(entry.summary, { lineGap: 1.8 });
    doc.moveDown(0.2);
    for (const point of entry.points) {
      doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(`•  ${point}`, { indent: 6, lineGap: 1.4 });
    }
    doc.moveDown(0.6);
  }
} else {
  todos.push(
    'Experience & education section OMITTED: no timeline entry is marked verified. ' +
      'Fix the placeholder periods/titles/organisations in the dashboard, tick Verified, and re-run.',
  );
}

doc.end();

console.log(`Wrote ${path.relative(process.cwd(), OUT)}`);
console.log(`  projects: ${projects.length}   skill groups: ${skillGroups.length}   verified timeline entries: ${verified.length}`);
if (todos.length) {
  console.log('\nSTILL NEEDS YOUR INPUT:');
  for (const t of todos) console.log(`  - ${t}`);
}
