/**
 * Imports the three audited posts into the CMS with both languages, through the
 * API so every write is audited.
 *
 * ALL THREE STAY UNPUBLISHED, in both languages. The English versions were
 * rewritten on 2026-09-02 from claims verified individually against the real
 * repositories, and the Persian drafts need the same review before anything
 * goes live. See PERSIAN-BLOG-DRAFTS.md for the per-post claim tables.
 *
 * English bodies are converted from the Block[] structures in
 * src/content/posts.ts so the CMS copy matches what the site already renders.
 *
 *   node scripts/seed-blog-bilingual.mjs --email … --password … [--dry-run]
 */
import { posts as englishPosts } from '@/content/posts.ts';

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

/** Block[] -> Markdown, the inverse of markdownToBlocks in src/lib/content.ts. */
function blocksToMarkdown(blocks) {
  return blocks
    .map((b) => {
      switch (b.type) {
        case 'h2':
          return `## ${b.text}`;
        case 'p':
          return b.text;
        case 'ul':
          return b.items.map((i) => `- ${i}`).join('\n');
        case 'quote':
          return `> ${b.text}`;
        case 'code':
          return '```' + (b.lang || '') + '\n' + b.code + '\n```';
        default:
          return '';
      }
    })
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Persian drafts, transcribed from PERSIAN-BLOG-DRAFTS.md.
 *
 * Each entry lists the audited claims the translation must preserve. Those are
 * assertions about the real repositories, not stylistic choices — a Persian
 * version that blurs them is wrong even if it reads well.
 */
const persian = {
  'check-then-act-double-booking-guard': {
    titleFa: 'محافظِ رزرو تکراری که واقعاً پیاده کردم',
    excerptFa:
      'RxClinic از یک خواندن پیش از نوشتن برای جلوگیری از رزرو هم‌زمان استفاده می‌کند. این یک محافظ واقعی با یک پنجره رقابتی واقعی است، و ارزشش را دارد که درباره هر دو صادق باشیم.',
    claims: [
      'RxClinic uses SQLite, not PostgreSQL',
      'No unique index exists on appointments (only User.Username)',
      'The shipped guard is check-then-act and has a real race',
      'The next-steps section is intention, not shipped code',
      'A unique index cannot express range overlap',
    ],
    bodyFa: [
      'هر سامانه نوبت‌دهی با یک نیاز ساده شروع می‌شود: هیچ پزشکی نباید دو نوبت روی بازه زمانی یکسان داشته باشد. در RxClinic چیزی که این را تضمین می‌کند یک کوئری بلافاصله پیش از insert است، و کل سازوکار همین است.',
      '## آنچه handler انجام می‌دهد',
      'هم‌پوشانی یک مقایسه بازه‌ای است، نه بررسی تساوی. دو نوبت وقتی تداخل دارند که یکی پیش از پایان دیگری شروع شود و پس از شروع آن پایان یابد — و فقط نوبت‌های فعال به حساب می‌آیند؛ یک نوبت لغوشده دوباره آزاد است.',
      '```csharp\n// Conflict: same doctor, active status, overlapping time range.\nbool overlaps = await _db.Appointments.AnyAsync(a =>\n    a.DoctorId == request.DoctorId &&\n    (a.Status == AppointmentStatus.Pending || a.Status == AppointmentStatus.Confirmed) &&\n    a.StartTime < request.EndTime &&\n    a.EndTime > request.StartTime);\n\nif (overlaps)\n    return Conflict(new { message = "The selected time slot is already booked for this doctor." });\n```',
      'سه جزئیات در این predicate کار واقعی انجام می‌دهند: فیلتر روی status یعنی لغو کردن، بازه را آزاد می‌کند بدون آنکه تاریخچه حذف شود؛ نامساوی‌های اکید اجازه می‌دهند نوبت ۰۹:۰۰–۰۹:۳۰ دقیقاً کنار ۰۹:۳۰–۱۰:۰۰ بنشیند بدون تداخل کاذب؛ و همه‌اش یک AnyAsync است، پس فقط یک بررسی وجود هزینه دارد.',
      '## پنجره‌ای که وانمود نمی‌کنم بسته است',
      'بین آن خواندن و SaveChangesAsync چند خط بعد، هیچ چیز جلوی درخواست دوم را نمی‌گیرد که همان کوئری را اجرا کند و همان پاسخ را بگیرد. دو رزرو هم‌زمان برای یک بازه می‌توانند هر دو از بررسی عبور کنند. این check-then-act است، و check-then-act یک وضعیت رقابتی دارد.',
      'برای جایی که RxClinic واقعاً اجرا می‌شود — یک پروسه واحد روی یک فایل SQLite — این پنجره باریک است و ریسک عملیاتی کم. صفر نیست، و توصیف صادقانه‌اش این است: «محافظی که زیر باری که برایش ساخته شده دوام می‌آورد»، نه «یک تضمین».',
      '## چرا موتور ذخیره‌سازی هنوز آن را نبسته است',
      'پاسخ غریزی unique index است و غریزه درستی هم هست: یک constraint که پایگاه داده اعمال می‌کند قابل دور زدن نیست. اما هم‌پوشانی، تساوی نیست. یک unique index می‌تواند بگوید «دو نوبت برای این پزشک دقیقاً در این لحظه شروع نشوند»؛ نمی‌تواند بگوید «دو نوبت این پزشک اصلاً هم‌پوشانی نداشته باشند». حالت بازه‌ای به exclusion constraint نیاز دارد، که SQLite ندارد و PostgreSQL از طریق btree_gist دارد.',
      '> ثابت‌ها را به پایین‌ترین لایه‌ای ببرید که می‌تواند اعمالشان کند. نکته اینجاست که آن لایه باید بتواند ثابت را بیان کند — و هم‌پوشانی بازه دقیقاً جایی است که این کار دیگر رایگان نیست.',
      '## قدم‌های بعدی — هنوز پیاده نشده',
      'هر چیزی در این بخش نیت است، نه کدِ اجراشده. امروز RxClinic دقیقاً یک unique index دارد، روی User.Username، و هیچ constraint هم‌پوشانی از هیچ نوعی ندارد.',
      '- بازه‌های با طول ثابت، هم‌پوشانی را به تساوی تبدیل می‌کنند؛ آن‌وقت یک unique index روی (DoctorId, StartTime) با فیلتر روی status‌های فعال، رقابت را کاملاً می‌بندد.\n- ماندن روی بازه‌های دلخواه یعنی مهاجرت به PostgreSQL و یک constraint از نوع EXCLUDE USING gist — تنها گزینه‌ای که هم‌پوشانی واقعی را در موتور اعمال می‌کند.\n- هر دو مسیر نیاز دارند خطای نقض constraint در مرز persistence به همان ۴۰۹ ترجمه شود که مسیر خواندن الان برمی‌گرداند.',
    ].join('\n\n'),
  },

  'cqrs-without-the-ceremony': {
    titleFa: 'CQRS بدون تشریفات',
    excerptFa:
      'به event sourcing، دو پایگاه داده یا message broker نیاز ندارید. به این نیاز دارید که خواندن و نوشتن دیگر یک مدل مشترک نداشته باشند.',
    claims: [
      'The projection runs in memory, after the repository materialises entities',
      'Queries go through repositories, not DbContext directly',
      'No AsNoTracking anywhere in the Application layer',
      'MediatR pinned to 12.4.1 for licensing (12.x Apache-2.0, 13.x is not)',
      'Entities are Project/TaskItem/Label/Team — no Card entity, no Rank',
    ],
    bodyFa: [
      'CQRS شهرت بدی دارد چون معمولاً همراه با event sourcing، سازگاری نهایی و یک broker که کسی نخواسته بود عرضه می‌شود. ایده اصلی بسیار کوچک‌تر و بسیار مفیدتر است: خواندن و نوشتن شکل‌های متفاوتی دارند، پس آن‌ها را به زور از یک مدل عبور ندهید. TaskFlow این‌طور ساخته شده و از هیچ‌کدام از بخش‌های گران‌قیمت استفاده نمی‌کند.',
      '## تنش، به‌صورت مشخص',
      'یک board همه taskهای یک پروژه را می‌خواهد، گروه‌بندی‌شده در ستون‌ها، و هر کارت تخت‌شده به همان چند فیلدی که UI رسم می‌کند. یک تغییر status یک TaskItem را با ثابت‌هایش می‌خواهد تا بتواند یک انتقال غیرمجاز را رد کند. هر دو را از یک گراف موجودیت سرو کنید و یا خواندنی می‌گیرید که بیش از حد fetch می‌کند، یا مدل نوشتنی که نگرانی‌های projection تکه‌تکه‌اش کرده‌اند.',
      'سمت خواندن با typeهایی پاسخ می‌دهد که فقط برای صفحه وجود دارند. هیچ‌کدام از این‌ها یک موجودیت دامنه نیستند:',
      '```csharp\npublic sealed record BoardCardDto(\n    Guid Id,\n    string Key,\n    string Title,\n    TaskPriority Priority,\n    DateTime? DueDateUtc,\n    Guid? AssigneeId,\n    bool IsOverdue,\n    IReadOnlyList<Guid> LabelIds,\n    IReadOnlyList<TaskItemStatus> AllowedStatusTargets);\n```',
      'AllowedStatusTargets جزئیاتی است که بیش از همه از آن دفاع می‌کنم. دامنه از قبل می‌داند از یک status مشخص چه انتقال‌هایی مجاز است، پس مدل خواندن آن‌ها را حمل می‌کند و UI بقیه را غیرفعال نشان می‌دهد بدون آنکه قاعده در TypeScript تکرار شود.',
      '## یک handler، یک شکل',
      'نکته‌ای که باید دقیق بماند: projection در حافظه اجرا می‌شود، پس از آنکه repository موجودیت‌ها را materialize کرده است. این یک projection سمت پایگاه داده نیست. این یک معامله آگاهانه است: خواندن‌ها پشت همان انتزاع repository می‌مانند که نوشتن‌ها، به قیمت بارگذاری بیش از آنچه صفحه دقیقاً لازم دارد.',
      '```csharp\nvar tasks = await _taskItems\n    .ListByProjectAsync(request.ProjectId, cancellationToken)\n    .ConfigureAwait(false);\n```',
      '## آنچه واقعاً می‌پذیرید',
      '- دو پوشه به‌ازای هر feature: Commands و Queries. کل تغییر ساختاری همین است.\n- marker interfaceها روی MediatR — IQuery برای خواندن، ICommand برای نوشتن — تا دو سمت از هم جدا بمانند.\n- کوئری‌ها DTO برمی‌گردانند که برای یک صفحه شکل گرفته است. commandها aggregate بارگذاری می‌کنند و ثابت‌ها را اعمال می‌کنند.\n- یک پایگاه داده، یک تراکنش. بدون سازگاری نهایی، مگر دلیلی داشته باشید.',
      'MediatR عمداً روی نسخه 12.4.1 ثابت شده است: خط 12.x با مجوز Apache-2.0 عرضه می‌شود و 13.x این‌طور نیست.',
      '## آنچه رد می‌کنید',
      'event sourcing، read replicaها، یک read store جداگانه و یک broker همگی تصمیم‌های مستقل‌اند. هرکدام با یک فشار مشخص توجیه می‌شوند — الزامات ممیزی، مقیاس خواندن، یکپارچه‌سازی بین سرویس‌ها. وقتی آن فشار وجود داشت بپذیریدشان، نه چون یک نمودار آن‌ها را کنار حروف CQRS نشان داده بود.',
    ].join('\n\n'),
  },

  'level-triggered-alerts-and-the-inbound-exception': {
    titleFa: 'یک هشدار کمبود موجودی، با یک شرط که ارزش بحث دارد',
    excerptFa:
      'InvenTrack هر بار که یک خروج کالا محصولی را زیر آستانه بگذارد هشدار می‌دهد. بخش جالب، خودِ آستانه نیست — دلیل کنار گذاشتن ورودی‌هاست.',
    claims: [
      'The alert is level-triggered, not edge-triggered',
      'Nothing compares previous vs new quantity',
      'There is no recovery notification',
      'InvenTrack has no domain events',
      'Edge-triggering is future work, not shipped',
    ],
    bodyFa: [
      'InvenTrack هشدارهای کمبود موجودی را از طریق SignalR به داشبورد ارسال می‌کند. قاعده‌ای که تصمیم می‌گیرد هشدار صادر شود یا نه دو بند دارد، و یکی از آن‌ها یک تصمیم طراحی است نه یک بررسی بدیهی.',
      '```csharp\nif (transaction.Type != StockTransactionType.Out || !product.IsLowStock)\n{\n    return;\n}\n```',
      'بند دوم همان آستانه است و روی خود موجودیت زندگی می‌کند، کنار داده‌ای که به آن وابسته است: IsLowStock یعنی QuantityInStock <= LowStockThreshold. بند اول همان است که ارزش توضیح دارد.',
      '## چرا ورودی‌ها ساکت می‌مانند',
      'یک حرکت موجودی یا In است یا Out. دریافت بیست واحد از محصولی که خیلی زیر آستانه است همچنان آن را زیر آستانه نگه می‌دارد، پس یک بررسی ساده «آیا بعد از این نوشتن کم است؟» هشدار صادر می‌کرد. آن هشدار از نظر فنی درست و در عمل بی‌فایده بود: وضعیتی را گزارش می‌کرد که تازه بهتر شده است، انگار چیزی خراب شده باشد.',
      '> یک حرکت ورودی که همچنان محصول را زیر آستانه‌اش می‌گذارد، وضعیتی رو به بهبود است و هشدار نمی‌خواهد.',
      'آن جمله، کامنت بالای متد است و کل توجیه بند اول.',
      '## این چه هست و چه نیست',
      'این یک هشدار level-triggered با یک فیلتر جهت است. تا وقتی محصول کم باشد، هر حرکت خروجی هشدار می‌دهد — پس ارسال ده واحد به‌صورت تک‌تک، ده هشدار تولید می‌کند. این edge-triggered نیست: هیچ چیز مقدار قبلی را با مقدار جدید مقایسه نمی‌کند، پس هیچ چیز لحظه دقیق عبور از آستانه را تشخیص نمی‌دهد.',
      'edge-triggering پاسخ بهتری برای حجم هشدار است، و کاری واقعی است نه یک تغییر یک‌خطی — handler به مقدار قبلی نیاز پیدا می‌کند، که یعنی یا یک خواندن اضافه یا حمل آن از محل تغییر. فیلتر جهت، تقریب ارزان است و آزاردهنده‌ترین دسته هشدار کاذب را به قیمت یک مقایسه enum حذف می‌کند.',
      '## دو چیزی که لایه انتقال درست انجام می‌دهد',
      'hub تایپ‌شده است. کلاینت‌ها به‌جای رشته‌های جادویی به‌صورت interface تعریف شده‌اند، پس تغییر نام یک پیام build را می‌شکند نه production را:',
      '```csharp\npublic interface IStockAlertClient\n{\n    Task LowStockAlert(LowStockAlert alert);\n    Task StockChanged(StockChangedNotification notification);\n}\n```',
      'و شکست در تحویل نمی‌تواند درخواست را با شکست مواجه کند. حرکت موجودی تا زمان انتشار هشدار از قبل commit شده است، پس انتشار داخل try/catch است و خطا لاگ می‌شود نه throw. از دست دادن یک هشدار بد است؛ برگرداندن یک حرکت انبارِ commit‌شده به این دلیل که یک websocket ناراضی بود، بدتر است.',
    ].join('\n\n'),
  },
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

  const existing = await call('posts');
  const bySlug = new Map(existing.map((p) => [p.slug, p]));

  for (const post of englishPosts) {
    const fa = persian[post.slug];
    if (!fa) {
      console.log(`  SKIP ${post.slug} — no Persian draft`);
      continue;
    }

    const body = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      bodyMarkdown: blocksToMarkdown(post.body),
      coverImagePath: null,
      tags: post.tags.join(','),
      // Never published by this script, in either language.
      status: 'Draft',
      publishedAtUtc: null,
      titleFa: fa.titleFa,
      excerptFa: fa.excerptFa,
      bodyMarkdownFa: fa.bodyFa,
    };

    const current = bySlug.get(post.slug);
    console.log(`  ${DRY ? 'would ' : ''}${current ? 'update' : 'create'} ${post.slug}`);
    console.log(`      en ${body.bodyMarkdown.length} chars | fa ${body.bodyMarkdownFa.length} chars | status Draft`);
    console.log(`      claims to preserve: ${fa.claims.length}`);
    fa.claims.forEach((c) => console.log(`        - ${c}`));

    if (DRY) continue;

    if (current) await call(`posts/${current.id}`, { method: 'PUT', body: JSON.stringify(body) });
    else await call('posts', { method: 'POST', body: JSON.stringify(body) });
  }

  if (!DRY) {
    const after = await call('posts');
    const published = await call('posts/published');
    console.log(`\nCMS now holds ${after.length} post(s); ${published.length} published.`);
    after.forEach((p) =>
      console.log(`  ${p.status.padEnd(10)} ${p.slug.padEnd(48)} fa: ${p.bodyMarkdownFa ? 'yes' : 'no'}`),
    );
  }
}

main().catch((error) => {
  console.error(`\nFailed: ${error.message}`);
  process.exit(1);
});
