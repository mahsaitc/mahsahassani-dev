/**
 * Second half of `npm run build:static`. Runs after `next build` has written
 * ./out and turns it into something cPanel can serve as-is:
 *
 *   1. Copies deploy/cpanel/.htaccess and contact.php into out/.
 *   2. Finds every /uploads/... path the exported pages reference and downloads
 *      exactly those files from the API into out/uploads/. Only published
 *      content is rendered, so drafts' media never leave the machine.
 *   3. Fails if any page still points at the API origin — that URL would be
 *      dead on the shared host.
 *
 * Any failure exits non-zero so a broken export is never mistaken for a
 * deployable one.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd());

const OUT = path.resolve('out');
const DEPLOY = path.resolve('deploy', 'cpanel');
const UPLOADS_PREFIX = '/uploads/';
const API_BASE = (process.env.API_BASE_URL ?? 'http://localhost:5099').replace(/\/+$/, '');

/** Files that carry page content: HTML plus the RSC payloads used on client navigation. */
const SCANNED = new Set(['.html', '.txt', '.xml', '.json']);

const fail = (message) => {
  console.error(`\n[postexport] ${message}`);
  process.exit(1);
};

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])),
  );
  return files.flat();
}

try {
  await fs.access(path.join(OUT, 'index.html')).catch(() => fs.access(path.join(OUT, 'en', 'index.html')));
} catch {
  fail('out/ has no exported pages. Did `next build` run with NEXT_OUTPUT=export?');
}

// 1. Server-side pieces of the static build.
for (const name of ['.htaccess', 'contact.php']) {
  await fs.copyFile(path.join(DEPLOY, name), path.join(OUT, name));
}

// 2. Collect referenced uploads and 3. catch leaked API origins in one pass.
const pageFiles = (await walk(OUT)).filter((f) => SCANNED.has(path.extname(f)));
const referenced = new Set();
const leaks = [];
const uploadRef = /\/uploads\/[A-Za-z0-9._~%\-/]+/g;

for (const file of pageFiles) {
  const text = await fs.readFile(file, 'utf8');
  if (text.includes(API_BASE)) leaks.push(path.relative(OUT, file));
  for (const match of text.matchAll(uploadRef)) referenced.add(match[0]);
}

if (leaks.length > 0) {
  fail(`${leaks.length} exported file(s) still reference ${API_BASE}:\n  ${leaks.slice(0, 10).join('\n  ')}`);
}

const uploadsRoot = path.join(OUT, 'uploads');
let bytes = 0;

for (const ref of [...referenced].sort()) {
  // Resolve inside out/uploads only; a crafted path must not escape it.
  const relative = decodeURIComponent(ref.slice(UPLOADS_PREFIX.length));
  const target = path.resolve(uploadsRoot, relative);
  if (!target.startsWith(uploadsRoot + path.sep)) fail(`refusing suspicious upload path ${ref}`);

  let response;
  try {
    response = await fetch(`${API_BASE}${ref}`);
  } catch (error) {
    fail(`could not reach ${API_BASE}${ref}: ${error.message}`);
  }
  if (!response.ok) fail(`${API_BASE}${ref} responded ${response.status}`);

  const data = Buffer.from(await response.arrayBuffer());
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, data);
  bytes += data.length;
}

// A config with real values must never sit in the web root.
for (const name of ['config.php', 'config.sample.php']) {
  if (await fs.access(path.join(OUT, name)).then(() => true, () => false)) {
    fail(`out/${name} exists — remove it; config belongs outside public_html.`);
  }
}

console.log(
  `[postexport] copied .htaccess, contact.php and ${referenced.size} upload(s) ` +
    `(${(bytes / 1024).toFixed(0)} KB) from ${API_BASE}. out/ is ready to upload.`,
);
