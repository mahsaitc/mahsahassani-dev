/**
 * Applies the approved translation decisions and publishes the three posts.
 *
 * Run after Mahsa approved the terminology table in PERSIAN-BLOG-DRAFTS.md on
 * 2026-09-05. Goes through the API so each write is audited.
 *
 *   node scripts/publish-persian.mjs --email … --password … [--dry-run]
 */
function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : undefined;
}

const API = (arg('api') ?? process.env.API_BASE_URL ?? 'http://localhost:5099').replace(/\/$/, '');
const EMAIL = arg('email');
const PASSWORD = arg('password');
const DRY = process.argv.includes('--dry-run');

if (!EMAIL || !PASSWORD) {
  console.error('Missing credentials. Pass --email and --password.');
  process.exit(1);
}

/**
 * The one approved copy change: the Persian hero now uses the Persian form of
 * the name. Technology names stay in English, as everywhere else.
 */
const heroIntroFa =
  'من **مهسا حسنی** هستم — مهندس کامپیوتر با گرایش طراحی نرم‌افزار. ' +
  'سیستم‌های production را با **ASP.NET Core** و **React** می‌سازم، جایی که ' +
  'معماری خودش همان ویژگی‌ای است که هزینه‌اش را پس می‌دهد.';

let token;

async function call(path, options = {}) {
  const res = await fetch(`${API}/api/${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`${options.method ?? 'GET'} ${path} -> ${res.status} ${(await res.text()).slice(0, 400)}`);
  }
  return res.status === 204 ? null : res.json();
}

async function main() {
  const login = await call('auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  token = login.token;
  console.log(`Signed in as ${login.user.email}\n`);

  // ── 1. Hero name ──────────────────────────────────────────────────────────
  console.log('Hero');
  console.log(`  ${DRY ? 'would set' : 'set'} hero.intro.fa — name now مهسا حسنی`);
  if (!DRY) {
    await call('content/settings', {
      method: 'PUT',
      body: JSON.stringify({ values: { 'hero.intro.fa': heroIntroFa } }),
    });
  }

  // ── 2. Publish ────────────────────────────────────────────────────────────
  console.log('\nPosts');
  const posts = await call('posts');
  const publishedAt = new Date().toISOString();

  for (const p of posts) {
    if (!p.bodyMarkdownFa) {
      // Refuse to publish a post whose Persian side is missing: /fa would
      // silently fall back to English on a page presented as translated.
      console.log(`  SKIP ${p.slug} — no Persian body`);
      continue;
    }

    const body = {
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      bodyMarkdown: p.bodyMarkdown,
      coverImagePath: p.coverImagePath,
      tags: p.tags.join(','),
      status: 'Published',
      // Explicit rather than letting the API stamp it, so all three share one
      // publish moment instead of drifting by however long the loop takes.
      publishedAtUtc: p.publishedAtUtc ?? publishedAt,
      titleFa: p.titleFa,
      excerptFa: p.excerptFa,
      bodyMarkdownFa: p.bodyMarkdownFa,
    };

    console.log(`  ${DRY ? 'would publish' : 'publish'} ${p.slug}`);
    if (!DRY) await call(`posts/${p.id}`, { method: 'PUT', body: JSON.stringify(body) });
  }

  if (DRY) {
    console.log('\nDry run — nothing written.');
    return;
  }

  const after = await call('posts');
  const live = await call('posts/published');
  console.log(`\n${live.length} of ${after.length} post(s) published.`);
  after.forEach((p) =>
    console.log(
      `  ${p.status.padEnd(10)} ${(p.publishedAtUtc ?? 'null').slice(0, 19).padEnd(20)} fa:${p.bodyMarkdownFa ? 'yes' : 'no '} ${p.slug}`,
    ),
  );
}

main().catch((error) => {
  console.error(`\nFailed: ${error.message}`);
  process.exit(1);
});
