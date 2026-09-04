/**
 * Seeds the hero copy — English defaults plus the Persian translation — into
 * the CMS settings, through the API so the writes are audited.
 *
 * Technology names stay in English inside the Persian text, matching every
 * other translated string on the site.
 *
 *   node scripts/seed-hero-persian.mjs --email … --password … [--dry-run]
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

const values = {
  // English, moved out of hero.tsx so both locales share one source.
  'hero.headline': ['Software', 'that stays', 'legible.'].join('\n'),
  'hero.intro':
    "I'm **Mahsa Hassani** — a computer engineer specialising in software design. " +
    'I build production systems with **ASP.NET Core** and **React**, where the ' +
    'architecture is the feature that keeps paying rent.',

  // Persian. The split puts «خوانا می‌ماند.» on the final line so the gold
  // accent lands on "stays legible", as it does in English.
  'hero.headline.fa': ['نرم‌افزاری', 'که', 'خوانا می‌ماند.'].join('\n'),
  'hero.intro.fa':
    'من **Mahsa Hassani** هستم — مهندس کامپیوتر با گرایش طراحی نرم‌افزار. ' +
    'سیستم‌های production را با **ASP.NET Core** و **React** می‌سازم، جایی که ' +
    'معماری خودش همان ویژگی‌ای است که هزینه‌اش را پس می‌دهد.',
};

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
    throw new Error(`${options.method ?? 'GET'} ${path} -> ${res.status} ${(await res.text()).slice(0, 300)}`);
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

  for (const [key, value] of Object.entries(values)) {
    console.log(`  ${DRY ? 'would set' : 'set'} ${key}`);
    console.log(`      ${value.replace(/\n/g, ' / ').slice(0, 92)}`);
  }

  if (DRY) {
    console.log('\nDry run — nothing written.');
    return;
  }

  const after = await call('content/settings', { method: 'PUT', body: JSON.stringify({ values }) });

  console.log('\nStored:');
  for (const key of Object.keys(values)) {
    console.log(`  ${key} = ${JSON.stringify((after[key] ?? '').slice(0, 46))}…`);
  }
}

main().catch((error) => {
  console.error(`\nFailed: ${error.message}`);
  process.exit(1);
});
