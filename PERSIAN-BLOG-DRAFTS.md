# Persian blog drafts — IN THE CMS AS DRAFTS, NEEDS YOUR REVIEW

Translations of the three English posts, now imported.

**Status as of 2026-09-05:** all three are in the CMS with both languages
populated, all three are **`Draft`** with `publishedAtUtc = null`, and
`/en/blog` and `/fa/blog` both show zero posts. Imported via
`scripts/seed-blog-bilingual.mjs`, so every write is in the audit log.

Edit them in the dashboard under **Blog → Edit**; the Persian fields sit under
each English one, marked `(فارسی)`.

**Do not publish until the claim tables below are checked.** Each post lists the
assertions about the real repositories that the Persian must preserve — an
automated check confirms the key terms survive, but only you can confirm the
sense is right.

## Why these are separated from the rest of the translation pass

The English versions were rewritten on 2026-09-02 from claims verified
individually against the actual repositories. A translation can quietly soften a
claim — "SQLite, not PostgreSQL" becoming merely "a database" — and the whole
point of that rewrite was that the posts stop saying things the code does not do.

So each post below lists **the exact claims that must survive translation**.
Check those first; the prose around them is ordinary editing.

---

## Post 1 — `check-then-act-double-booking-guard`

**Title:** The double-booking guard I actually shipped
**Persian:** محافظِ رزرو تکراری که واقعاً پیاده کردم

**Excerpt:** RxClinic از یک خواندن پیش از نوشتن برای جلوگیری از رزرو هم‌زمان
استفاده می‌کند. این یک محافظ واقعی با یک پنجره رقابتی واقعی است، و ارزشش را دارد
که درباره هر دو صادق باشیم.

### Claims that must survive translation

| Claim | Must stay unambiguous |
| --- | --- |
| RxClinic uses **SQLite**, not PostgreSQL | The Persian must not blur this into "یک پایگاه داده" |
| **No unique index** exists on appointments | The only unique index in the repo is on `User.Username` |
| The shipped guard is **check-then-act** and has a real race | Do not let the Persian imply the race is closed |
| The "next steps" section is **intention, not shipped code** | Must remain explicitly labelled as not implemented |
| A unique index **cannot** express range overlap | Needs an exclusion constraint (`EXCLUDE USING gist`), which SQLite lacks |

### Draft body

> هر سامانه نوبت‌دهی با یک نیاز ساده شروع می‌شود: هیچ پزشکی نباید دو نوبت روی
> بازه زمانی یکسان داشته باشد. در RxClinic چیزی که این را تضمین می‌کند یک کوئری
> بلافاصله پیش از insert است، و کل سازوکار همین است.

**آنچه handler انجام می‌دهد**

هم‌پوشانی یک مقایسه بازه‌ای است، نه بررسی تساوی. دو نوبت وقتی تداخل دارند که یکی
پیش از پایان دیگری شروع شود و پس از شروع آن پایان یابد — و فقط نوبت‌های فعال به
حساب می‌آیند؛ یک نوبت لغوشده دوباره آزاد است.

```csharp
// Conflict: same doctor, active status, overlapping time range.
bool overlaps = await _db.Appointments.AnyAsync(a =>
    a.DoctorId == request.DoctorId &&
    (a.Status == AppointmentStatus.Pending || a.Status == AppointmentStatus.Confirmed) &&
    a.StartTime < request.EndTime &&
    a.EndTime > request.StartTime);

if (overlaps)
    return Conflict(new { message = "The selected time slot is already booked for this doctor." });
```

سه جزئیات در این predicate کار واقعی انجام می‌دهند: فیلتر روی status یعنی لغو
کردن، بازه را آزاد می‌کند بدون آنکه تاریخچه حذف شود؛ نامساوی‌های اکید اجازه
می‌دهند نوبت ۰۹:۰۰–۰۹:۳۰ دقیقاً کنار ۰۹:۳۰–۱۰:۰۰ بنشیند بدون تداخل کاذب؛ و همه‌اش
یک `AnyAsync` است، پس فقط یک بررسی وجود هزینه دارد.

**پنجره‌ای که وانمود نمی‌کنم بسته است**

بین آن خواندن و `SaveChangesAsync` چند خط بعد، هیچ چیز جلوی درخواست دوم را
نمی‌گیرد که همان کوئری را اجرا کند و همان پاسخ را بگیرد. دو رزرو هم‌زمان برای یک
بازه می‌توانند هر دو از بررسی عبور کنند. این check-then-act است، و check-then-act
یک وضعیت رقابتی دارد.

برای جایی که RxClinic واقعاً اجرا می‌شود — یک پروسه واحد روی یک فایل SQLite —
این پنجره باریک است و ریسک عملیاتی کم. صفر نیست، و توصیف صادقانه‌اش این است:
«محافظی که زیر باری که برایش ساخته شده دوام می‌آورد»، نه «یک تضمین».

**چرا موتور ذخیره‌سازی هنوز آن را نبسته است**

پاسخ غریزی unique index است و غریزه درستی هم هست: یک constraint که پایگاه داده
اعمال می‌کند قابل دور زدن نیست. اما هم‌پوشانی، تساوی نیست. یک unique index
می‌تواند بگوید «دو نوبت برای این پزشک دقیقاً در این لحظه شروع نشوند»؛ نمی‌تواند
بگوید «دو نوبت این پزشک اصلاً هم‌پوشانی نداشته باشند». حالت بازه‌ای به exclusion
constraint نیاز دارد، که SQLite ندارد و PostgreSQL از طریق `btree_gist` دارد.

> ثابت‌ها را به پایین‌ترین لایه‌ای ببرید که می‌تواند اعمالشان کند. نکته اینجاست که
> آن لایه باید بتواند ثابت را بیان کند — و هم‌پوشانی بازه دقیقاً جایی است که این
> کار دیگر رایگان نیست.

**قدم‌های بعدی — هنوز پیاده نشده**

> ⚠️ **هر چیزی در این بخش نیت است، نه کدِ اجراشده.** امروز RxClinic دقیقاً یک
> unique index دارد، روی `User.Username`، و هیچ constraint هم‌پوشانی از هیچ نوعی
> ندارد.

- بازه‌های با طول ثابت، هم‌پوشانی را به تساوی تبدیل می‌کنند؛ آن‌وقت یک unique
  index روی `(DoctorId, StartTime)` با فیلتر روی status‌های فعال، رقابت را کاملاً
  می‌بندد.
- ماندن روی بازه‌های دلخواه یعنی مهاجرت به PostgreSQL و یک constraint از نوع
  `EXCLUDE USING gist` — تنها گزینه‌ای که هم‌پوشانی واقعی را در موتور اعمال می‌کند.
- هر دو مسیر نیاز دارند خطای نقض constraint در مرز persistence به همان ۴۰۹ ترجمه
  شود که مسیر خواندن الان برمی‌گرداند، تا رفتار برای مصرف‌کننده یکسان بماند.

---

## Post 2 — `cqrs-without-the-ceremony`

**Title:** CQRS without the ceremony
**Persian:** CQRS بدون تشریفات

**Excerpt:** به event sourcing، دو پایگاه داده یا message broker نیاز ندارید.
به این نیاز دارید که خواندن و نوشتن دیگر یک مدل مشترک نداشته باشند.

### Claims that must survive translation

| Claim | Must stay unambiguous |
| --- | --- |
| The projection runs **in memory**, after the repository materialises entities | Not a database-side projection |
| Queries go **through repositories** | The post must not imply direct `DbContext` access |
| **No `AsNoTracking`** anywhere in the Application layer | Do not reintroduce this claim |
| MediatR is pinned to **12.4.1** for licensing (12.x Apache-2.0, 13.x is not) | Version and reason must stay exact |
| Entity names are `Project`, `TaskItem`, `Label`, `Team` — **no `Card` entity**, no `Rank` | The read model is `BoardCardDto`, which is a DTO |

### Draft body

CQRS شهرت بدی دارد چون معمولاً همراه با event sourcing، سازگاری نهایی و یک broker
که کسی نخواسته بود عرضه می‌شود. ایده اصلی بسیار کوچک‌تر و بسیار مفیدتر است:
خواندن و نوشتن شکل‌های متفاوتی دارند، پس آن‌ها را به زور از یک مدل عبور ندهید.
TaskFlow این‌طور ساخته شده و از هیچ‌کدام از بخش‌های گران‌قیمت استفاده نمی‌کند.

**تنش، به‌صورت مشخص**

یک board همه taskهای یک پروژه را می‌خواهد، گروه‌بندی‌شده در ستون‌ها، و هر کارت
تخت‌شده به همان چند فیلدی که UI رسم می‌کند. یک تغییر status یک `TaskItem` را با
ثابت‌هایش می‌خواهد تا بتواند یک انتقال غیرمجاز را رد کند. هر دو را از یک گراف
موجودیت سرو کنید و یا خواندنی می‌گیرید که بیش از حد fetch می‌کند، یا مدل نوشتنی
که نگرانی‌های projection تکه‌تکه‌اش کرده‌اند.

سمت خواندن با typeهایی پاسخ می‌دهد که فقط برای صفحه وجود دارند. هیچ‌کدام از
این‌ها یک موجودیت دامنه نیستند:

```csharp
public sealed record BoardCardDto(
    Guid Id,
    string Key,
    string Title,
    TaskPriority Priority,
    DateTime? DueDateUtc,
    Guid? AssigneeId,
    bool IsOverdue,
    IReadOnlyList<Guid> LabelIds,
    IReadOnlyList<TaskItemStatus> AllowedStatusTargets);
```

`AllowedStatusTargets` جزئیاتی است که بیش از همه از آن دفاع می‌کنم. دامنه از قبل
می‌داند از یک status مشخص چه انتقال‌هایی مجاز است، پس مدل خواندن آن‌ها را حمل
می‌کند و UI بقیه را غیرفعال نشان می‌دهد بدون آنکه قاعده در TypeScript تکرار شود.

**یک handler، یک شکل**

> ⚠️ نکته‌ای که باید دقیق بماند: projection **در حافظه** اجرا می‌شود، پس از آنکه
> repository موجودیت‌ها را materialize کرده است. این یک projection سمت پایگاه داده
> نیست. این یک معامله آگاهانه است: خواندن‌ها پشت همان انتزاع repository می‌مانند
> که نوشتن‌ها، به قیمت بارگذاری بیش از آنچه صفحه دقیقاً لازم دارد.

```csharp
var tasks = await _taskItems
    .ListByProjectAsync(request.ProjectId, cancellationToken)
    .ConfigureAwait(false);
```

**آنچه واقعاً می‌پذیرید**

- دو پوشه به‌ازای هر feature: `Commands` و `Queries`. کل تغییر ساختاری همین است.
- marker interfaceها روی MediatR — `IQuery` برای خواندن، `ICommand` برای نوشتن —
  تا دو سمت از هم جدا بمانند.
- کوئری‌ها DTO برمی‌گردانند که برای یک صفحه شکل گرفته است. commandها aggregate
  بارگذاری می‌کنند و ثابت‌ها را اعمال می‌کنند.
- یک پایگاه داده، یک تراکنش. بدون سازگاری نهایی، مگر دلیلی داشته باشید.

MediatR عمداً روی نسخه **12.4.1** ثابت شده است: خط 12.x با مجوز Apache-2.0 عرضه
می‌شود و 13.x این‌طور نیست.

**آنچه رد می‌کنید**

event sourcing، read replicaها، یک read store جداگانه و یک broker همگی تصمیم‌های
مستقل‌اند. هرکدام با یک فشار مشخص توجیه می‌شوند — الزامات ممیزی، مقیاس خواندن،
یکپارچه‌سازی بین سرویس‌ها. وقتی آن فشار وجود داشت بپذیریدشان، نه چون یک نمودار
آن‌ها را کنار حروف CQRS نشان داده بود.

---

## Post 3 — `level-triggered-alerts-and-the-inbound-exception`

**Title:** A low-stock alert with one condition worth arguing about
**Persian:** یک هشدار کمبود موجودی، با یک شرط که ارزش بحث دارد

**Excerpt:** InvenTrack هر بار که یک خروج کالا محصولی را زیر آستانه بگذارد هشدار
می‌دهد. بخش جالب، خودِ آستانه نیست — دلیل کنار گذاشتن ورودی‌هاست.

### Claims that must survive translation

| Claim | Must stay unambiguous |
| --- | --- |
| The alert is **level-triggered**, not edge-triggered | Ten outbound movements produce ten alerts |
| **Nothing compares previous vs new quantity** | No edge detection exists |
| There is **no recovery notification** | `IStockAlertClient` has `LowStockAlert` and `StockChanged`; neither is a recovery |
| InvenTrack has **no domain events** | Do not reintroduce that claim |
| Edge-triggering is described as **future work**, not something shipped | |

### Draft body

InvenTrack هشدارهای کمبود موجودی را از طریق SignalR به داشبورد ارسال می‌کند.
قاعده‌ای که تصمیم می‌گیرد هشدار صادر شود یا نه دو بند دارد، و یکی از آن‌ها یک
تصمیم طراحی است نه یک بررسی بدیهی.

```csharp
if (transaction.Type != StockTransactionType.Out || !product.IsLowStock)
{
    return;
}
```

بند دوم همان آستانه است و روی خود موجودیت زندگی می‌کند، کنار داده‌ای که به آن
وابسته است: `IsLowStock` یعنی `QuantityInStock <= LowStockThreshold`. بند اول
همان است که ارزش توضیح دارد.

**چرا ورودی‌ها ساکت می‌مانند**

یک حرکت موجودی یا `In` است یا `Out`. دریافت بیست واحد از محصولی که خیلی زیر آستانه
است همچنان آن را زیر آستانه نگه می‌دارد، پس یک بررسی ساده «آیا بعد از این نوشتن
کم است؟» هشدار صادر می‌کرد. آن هشدار از نظر فنی درست و در عمل بی‌فایده بود:
وضعیتی را گزارش می‌کرد که تازه بهتر شده است، انگار چیزی خراب شده باشد.

> یک حرکت ورودی که همچنان محصول را زیر آستانه‌اش می‌گذارد، وضعیتی رو به بهبود است
> و هشدار نمی‌خواهد.

آن جمله، کامنت بالای متد است و کل توجیه بند اول.

**این چه هست و چه نیست**

> ⚠️ این یک هشدار **level-triggered** با یک فیلتر جهت است. تا وقتی محصول کم باشد،
> هر حرکت خروجی هشدار می‌دهد — پس ارسال ده واحد به‌صورت تک‌تک، ده هشدار تولید
> می‌کند. این **edge-triggered نیست**: هیچ چیز مقدار قبلی را با مقدار جدید مقایسه
> نمی‌کند، پس هیچ چیز لحظه دقیق عبور از آستانه را تشخیص نمی‌دهد.

edge-triggering پاسخ بهتری برای حجم هشدار است، و کاری واقعی است نه یک تغییر یک‌خطی
— handler به مقدار قبلی نیاز پیدا می‌کند، که یعنی یا یک خواندن اضافه یا حمل آن از
محل تغییر. فیلتر جهت، تقریب ارزان است و آزاردهنده‌ترین دسته هشدار کاذب را به قیمت
یک مقایسه enum حذف می‌کند.

**دو چیزی که لایه انتقال درست انجام می‌دهد**

hub تایپ‌شده است. کلاینت‌ها به‌جای رشته‌های جادویی به‌صورت interface تعریف شده‌اند،
پس تغییر نام یک پیام build را می‌شکند نه production را:

```csharp
public interface IStockAlertClient
{
    Task LowStockAlert(LowStockAlert alert);
    Task StockChanged(StockChangedNotification notification);
}
```

و شکست در تحویل نمی‌تواند درخواست را با شکست مواجه کند. حرکت موجودی تا زمان انتشار
هشدار از قبل commit شده است، پس انتشار داخل try/catch است و خطا لاگ می‌شود نه
throw. از دست دادن یک هشدار بد است؛ برگرداندن یک حرکت انبارِ commit‌شده به این
دلیل که یک websocket ناراضی بود، بدتر است.

---

## Terms I was unsure about

Flagged for your judgement — all kept as noted, none guessed silently.

| English | What I used | Why I am unsure |
| --- | --- | --- |
| invariants | ثابت‌ها | Common in Persian CS writing, but `invariant` untranslated is also widely used |
| check-then-act | kept English | No settled Persian idiom; translating loses the term of art |
| race / race condition | وضعیت رقابتی / پنجره رقابتی | Both circulate; some writers keep `race condition` |
| exclusion constraint | kept English | Postgres feature name — I judged it a proper term |
| projection | projection | Kept English throughout; مدل‌سازی/فرافکنی both read wrong here |
| materialize | materialize | Kept English |
| aggregate (DDD) | aggregate | Kept English — the DDD sense, not "تجمیع" |
| marker interface | marker interface | Kept English |
| level-triggered / edge-triggered | kept English | The electronics metaphor is the whole point; translating breaks it |
| eventual consistency | سازگاری نهایی | Standard, but confirm you like it |
| board | board | Kept English; تخته reads oddly for a Kanban board |
| "premium feel" (site UI) | not translated | Not in this pass |

---

## What is NOT in this file

- No post has been written to the CMS. All `…Fa` fields on posts remain null.
- No post is published, in either language.
- The English posts are unchanged.
