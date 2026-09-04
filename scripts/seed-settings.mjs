/**
 * Writes site settings straight into the CMS, so a known value does not have to
 * be retyped through the dashboard form.
 *
 * Only the keys named on the command line are touched. The settings endpoint
 * upserts, so anything not mentioned keeps whatever it already holds — there is
 * no way for this script to blank a field by omission.
 *
 * Usage:
 *   node scripts/seed-settings.mjs \
 *     --email you@example.com --password '...' \
 *     --set contact.phone=09393056009 \
 *     --set 'contact.location=Shiraz, Iran'
 *
 *   Add --dry-run to print what would be written and exit.
 *
 * To clear a key, pass an empty value (--set contact.phone=). The public site
 * then falls back to whatever src/lib/site.ts declares.
 */

function arg(name, fallback = undefined) {
  const index = process.argv.indexOf(`--${name}`);
  if (index !== -1 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

const API = arg('api', process.env.API_BASE_URL || 'http://localhost:5099').replace(/\/$/, '');
const EMAIL = arg('email');
const PASSWORD = arg('password');
const DRY_RUN = process.argv.includes('--dry-run');

// Every --set flag, in order.
const pairs = [];
process.argv.forEach((a, i) => {
  if (a === '--set' && process.argv[i + 1]) {
    const raw = process.argv[i + 1];
    const eq = raw.indexOf('=');
    if (eq < 1) {
      console.error(`Malformed --set "${raw}". Expected key=value.`);
      process.exit(1);
    }
    pairs.push([raw.slice(0, eq).trim(), raw.slice(eq + 1)]);
  }
});

if (!EMAIL || !PASSWORD) {
  console.error('Missing credentials.\n  --email <admin email>  --password <password>');
  process.exit(1);
}

if (pairs.length === 0) {
  console.error('Nothing to write. Pass at least one --set key=value.');
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
    throw new Error(`${options.method ?? 'GET'} ${path} -> ${response.status} ${(await response.text()).slice(0, 300)}`);
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

  const before = await call('content/settings');

  console.log('Settings');
  for (const [key, value] of pairs) {
    const old = before[key] ?? '';
    const shown = value === '' ? '(cleared)' : value;
    const from = old === '' ? '(unset)' : old;
    console.log(`  ${DRY_RUN ? 'would set' : 'set'}  ${key}\n      ${from}  ->  ${shown}`);
  }

  if (DRY_RUN) {
    console.log('\nDry run — nothing written.');
    return;
  }

  const after = await call('content/settings', {
    method: 'PUT',
    body: JSON.stringify({ values: Object.fromEntries(pairs) }),
  });

  // Read back from the response rather than trusting the request.
  console.log('\nStored:');
  for (const [key] of pairs) {
    console.log(`  ${key} = ${JSON.stringify(after[key] ?? '')}`);
  }

  console.log('\nThe public site picks these up within its revalidation window (60s).');
  console.log('Run `npm run resume` to rebuild the PDF with them.');
}

main().catch((error) => {
  console.error(`\nSeed failed: ${error.message}`);
  process.exit(1);
});
