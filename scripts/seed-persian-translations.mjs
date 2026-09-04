/**
 * Fills the Persian (…Fa / .fa) fields for the non-blog content, through the API
 * so every write lands in the audit log and goes via the same validation the
 * dashboard uses.
 *
 * Rules applied, matching the existing site UI strings:
 *   - Technology and product names stay in English inside the Persian text:
 *     ASP.NET Core, EF Core, SQLite, SQL Server, React, TypeScript, JavaScript,
 *     SignalR, CQRS, MediatR, PostgreSQL, Redis, Hangfire, Clean Architecture,
 *     Moq, xUnit, react-markdown, Next.js, Tailwind CSS, Docker, GitHub
 *     Actions, Git, Nginx, C#, Web API.
 *   - Project names are proper nouns and are never translated.
 *   - Blog posts are handled by seed-persian-blog.mjs, not here.
 *
 *   node scripts/seed-persian-translations.mjs --email … --password … [--dry-run]
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

/** Site settings. Persian lives under a `.fa` suffixed key. */
const settings = {
  'about.headline.fa': 'دو رشته، یک طرز فکر.',

  'about.body.fa': [
    'من مهندس کامپیوتر با گرایش طراحی نرم‌افزار هستم و به‌صورت full-stack با ASP.NET Core و React کار می‌کنم. بیشتر انرژی‌ام صرف بخشی می‌شود که در تصویر دیده نمی‌شود: اینکه مرزها کجا قرار بگیرند، type system چه ثابت‌هایی را تضمین کند، و روزی که نیازمندی پیش‌بینی‌نشده‌ای از راه برسد چه اتفاقی می‌افتد.',
    'من کار را با **پزشکی عمومی** شروع کردم و بعد به مهندسی آمدم. این یک انحراف از مسیر نیست که بابتش عذر بخواهم — دقیقاً دلیل همان شیوه‌ای است که دامنه‌ها را با آن مدل می‌کنم. پزشکی به شما یاد می‌دهد با اطلاعات ناقص از نشانه به علت برسید، به اولین توضیح محتمل اعتماد نکنید، و یادداشتی بنویسید آن‌قدر دقیق که فردی ناآشنا بتواند با خیال راحت بر اساسش عمل کند. اشکال‌زدایی یک سیستم توزیع‌شده دقیقاً همین انضباط را می‌طلبد.',
    'در عمل این‌طور خودش را نشان می‌دهد: Clean Architecture و CQRS در سمت back end، React تایپ‌شده و در دسترس در سمت front end، container برای هر چیزی که باید دو بار یکسان اجرا شود، و علاقه‌ای جدی به اتوماسیون و هوش مصنوعی کاربردی.',
  ].join('\n\n'),

  'contact.location.fa': 'شیراز، ایران',
  'contact.availability.fa': 'آماده همکاری در نقش‌های ارشد back-end و full-stack',
};

/** Projects, keyed by slug. Names are never translated. */
const projects = {
  rxclinic: {
    TaglineFa: 'API نوبت‌دهی کلینیک به‌همراه رابط کاربری رزرو',
    SummaryFa:
      'سامانه نوبت‌دهی کلینیک که به‌صورت یک پروژه واحد ASP.NET Core Web API ساخته شده — عمداً بدون معماری لایه‌ای — با EF Core روی SQLite برای ذخیره‌سازی و یک front end با React که با JavaScript ساده نوشته شده است.',
  },
  inventrack: {
    TaglineFa: 'مدیریت انبار با هشدارهای بلادرنگ کمبود موجودی',
    SummaryFa:
      'سامانه انبار روی یک راهکار Clean Architecture، که با SignalR هشدارهای کمبود موجودی را به front end نوشته‌شده با React و TypeScript ارسال می‌کند. EF Core روی یک provider قابل‌پیکربندی اجرا می‌شود: به‌صورت پیش‌فرض SQLite، یا SQL Server.',
  },
  articleforge: {
    TaglineFa: 'سامانه مدیریت محتوا و وبلاگ بر پایه Clean Architecture',
    SummaryFa:
      'بستر انتشار محتوا روی یک راهکار Clean Architecture، بدون MediatR و بدون تفکیک CQRS. محتوا به‌جای ویرایشگر متن غنی با react-markdown رندر می‌شود و EF Core به‌صورت پیش‌فرض روی SQLite یا روی SQL Server اجرا می‌شود.',
  },
  taskflow: {
    TaglineFa: 'مدیریت وظایف تیمی با CQRS، همگام‌سازی بلادرنگ و کارهای پس‌زمینه',
    SummaryFa:
      'مدیریت وظایف بر پایه Clean Architecture با CQRS از طریق MediatR، با PostgreSQL به‌عنوان پایگاه داده. SignalR کلاینت‌ها را همگام نگه می‌دارد و Hangfire کارهای پس‌زمینه را روی همان پایگاه داده اجرا می‌کند.',
  },
  cartforge: {
    TaglineFa: 'API فروشگاهی با PostgreSQL و Redis',
    SummaryFa:
      'back end فروشگاهی روی یک راهکار Clean Architecture، با ذخیره داده در PostgreSQL و Redis در کنار آن. مجموعه تست ۱۵۰ موردی آن کاملاً روی SQLite و Moq اجرا می‌شود، بنابراین برای اجرای آن به هیچ سرویس بیرونی نیازی نیست.',
  },
};

/** Timeline. Project-name titles stay English; only real prose is translated. */
const timeline = {
  'Doctor of General Medicine': { TitleFa: 'دکترای پزشکی عمومی' },
  'ASP.NET Core Certification': { TitleFa: 'گواهی‌نامه ASP.NET Core' },
  'Computer Engineering — Software Design, Shiraz University': {
    TitleFa: 'مهندسی کامپیوتر — گرایش طراحی نرم‌افزار، دانشگاه شیراز',
  },
  // RxClinic / InvenTrack / ArticleForge / TaskFlow / CartForge are product
  // names and are deliberately left untranslated.
};

/** Skill group names, and the per-skill notes. Skill names never change. */
const skillGroups = {
  'Back end': 'back end',
  'Front end': 'front end',
  'Data & caching': 'داده و کش',
  'Platform & delivery': 'پلتفرم و استقرار',
};

const skillNotes = {
  'ASP.NET Core': 'Minimal APIs، middleware، احراز هویت مبتنی بر policy',
  'C#': 'record‌ها، Span، source generator‌ها',
  'EF Core': 'projection، کوئری‌های کامپایل‌شده، migration',
  SignalR: 'ارسال بلادرنگ تغییرات به کلاینت‌های متصل',
  xUnit: 'تست‌های واحد و یکپارچگی',
  React: 'hook‌ها، suspense، انضباط در رندر',
  TypeScript: 'generic‌ها، discriminated union‌ها، strict mode',
  'Next.js': 'App Router، server component‌ها، ISR',
  'Tailwind CSS': 'توکن‌های طراحی به‌جای کلاس‌های موردی',
  PostgreSQL: 'ایندکس‌گذاری، constraint‌ها، query plan',
  Redis: 'کش در کنار یک پایگاه داده رابطه‌ای',
  Docker: 'بیلدهای چندمرحله‌ای، استک‌های Compose',
  'GitHub Actions': 'بیلدهای ماتریسی، تست‌های مبتنی بر container',
  Git: 'جریان trunk-based، تاریخچه قابل‌بازبینی',
  Nginx: 'پراکسی معکوس، TLS، هدرهای کش',
  'AI tooling': 'یکپارچه‌سازی LLM، embedding، اتوماسیون',
};

async function main() {
  const login = await call('auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  token = login.token;
  console.log(`Signed in as ${login.user.email} (${login.user.role})\n`);

  let writes = 0;

  // ── Settings ──────────────────────────────────────────────────────────────
  // The settings endpoint upserts and only touches the keys it is given, so
  // the English values are untouched by this call.
  console.log('Settings');
  for (const [key, value] of Object.entries(settings)) {
    console.log(`  ${DRY ? 'would set' : 'set'} ${key} (${value.length} chars)`);
  }
  if (!DRY) {
    await call('content/settings', { method: 'PUT', body: JSON.stringify({ values: settings }) });
    writes += Object.keys(settings).length;
  }

  // ── Projects ──────────────────────────────────────────────────────────────
  console.log('\nProjects');
  const apiProjects = await call('projects');
  for (const p of apiProjects) {
    const fa = projects[p.slug];
    if (!fa) continue;

    // Full payload: PUT replaces the record, so the English fields are sent
    // back unchanged rather than being blanked.
    const body = {
      name: p.name,
      slug: p.slug,
      tagline: p.tagline,
      summary: p.summary,
      repoName: p.repoName,
      demoUrl: p.demoUrl,
      techTags: p.tech.join(','),
      year: p.year,
      featured: p.featured,
      mediaAlt: p.mediaAlt,
      videoPath: p.videoPath,
      posterPath: p.posterPath,
      taglineFa: fa.TaglineFa,
      summaryFa: fa.SummaryFa,
    };

    console.log(`  ${DRY ? 'would set' : 'set'} ${p.slug}`);
    if (!DRY) {
      await call(`projects/${p.id}`, { method: 'PUT', body: JSON.stringify(body) });
      writes++;
    }
  }

  // ── Timeline ──────────────────────────────────────────────────────────────
  console.log('\nTimeline');
  const apiTimeline = await call('content/timeline');
  for (const t of apiTimeline) {
    const fa = timeline[t.title];
    if (!fa) continue;

    const body = {
      period: t.period,
      kind: t.kind,
      title: t.title,
      organisation: t.organisation,
      description: t.description,
      points: t.points.join('\n'),
      tags: t.tags.join(','),
      verified: t.verified,
      periodFa: t.periodFa,
      titleFa: fa.TitleFa,
      organisationFa: t.organisationFa,
      descriptionFa: t.descriptionFa,
    };

    console.log(`  ${DRY ? 'would set' : 'set'} "${t.title.slice(0, 46)}"`);
    if (!DRY) {
      await call(`content/timeline/${t.id}`, { method: 'PUT', body: JSON.stringify(body) });
      writes++;
    }
  }
  console.log('  skipped (product names): RxClinic, InvenTrack, ArticleForge, TaskFlow, CartForge');

  // ── Skills ────────────────────────────────────────────────────────────────
  console.log('\nSkills');
  const apiSkills = await call('content/skills');
  for (const s of apiSkills) {
    const groupFa = skillGroups[s.groupName];
    const noteFa = skillNotes[s.name];
    if (!groupFa && !noteFa) continue;

    const body = {
      groupName: s.groupName,
      groupOrder: s.groupOrder,
      groupBlurb: s.groupBlurb,
      name: s.name,
      iconKey: s.iconKey,
      level: s.level,
      note: s.note,
      groupNameFa: groupFa ?? s.groupNameFa,
      groupBlurbFa: s.groupBlurbFa,
      noteFa: noteFa ?? s.noteFa,
    };

    if (!DRY) {
      await call(`content/skills/${s.id}`, { method: 'PUT', body: JSON.stringify(body) });
      writes++;
    }
  }
  console.log(`  ${DRY ? 'would update' : 'updated'} ${apiSkills.length} skill rows`);
  console.log('  group blurbs skipped — the English blurbs are empty, nothing to translate');

  console.log('\nTestimonials\n  none published — nothing to translate');
  console.log('Blog posts\n  handled separately by seed-persian-blog.mjs');

  console.log(`\n${DRY ? 'Dry run complete.' : `Done. ${writes} write(s) through the API.`}`);
}

main().catch((error) => {
  console.error(`\nFailed: ${error.message}`);
  process.exit(1);
});
