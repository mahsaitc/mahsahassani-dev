/**
 * Posts are structured blocks rather than MDX on purpose: no extra build
 * pipeline, no runtime markdown parser, and the renderer stays ~40 lines.
 * Swap this module for MDX later without touching the blog components.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * REWRITTEN 2026-09-02 against the actual repositories.
 *
 * The earlier drafts described fixes that were never made: a PostgreSQL unique
 * index RxClinic does not have, an AsNoTracking/no-repository read path TaskFlow
 * does not use, and an edge-triggered alert refactor InvenTrack never received.
 * Every code sample below is copied from the repository it describes, and every
 * claim was re-checked against the source. Where a technique is a future
 * intention rather than shipped code, it is labelled as such in the prose.
 *
 * These are drafts. The CMS is the publishing surface — nothing here reaches the
 * site, which reads published posts from the API.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'code'; lang: string; code: string };

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // ISO
  readingMinutes: number;
  tags: string[];
  body: Block[];
}

export const posts: Post[] = [
  {
    slug: 'check-then-act-double-booking-guard',
    title: 'The double-booking guard I actually shipped',
    excerpt:
      'RxClinic prevents overlapping appointments with a read before the write. That is a real guard with a real race window, and it is worth being honest about both.',
    date: '2025-11-18',
    readingMinutes: 5,
    tags: ['ASP.NET Core', 'EF Core', 'SQLite', 'Concurrency'],
    body: [
      {
        type: 'p',
        text: 'RxClinic is a clinic appointment API: patients book slots, staff book on their behalf, and no doctor should end up with two appointments over the same minutes. The guard that enforces this is a query immediately before the insert, and it is the whole mechanism.',
      },
      { type: 'h2', text: 'What the handler does' },
      {
        type: 'p',
        text: 'Overlap is a range comparison, not an equality check. Two appointments collide when one starts before the other ends and ends after the other starts, and only appointments still in play count — a cancelled slot is free again.',
      },
      {
        type: 'code',
        lang: 'csharp',
        code: `// Conflict: same doctor, active status, overlapping time range.
bool overlaps = await _db.Appointments.AnyAsync(a =>
    a.DoctorId == request.DoctorId &&
    (a.Status == AppointmentStatus.Pending || a.Status == AppointmentStatus.Confirmed) &&
    a.StartTime < request.EndTime &&
    a.EndTime > request.StartTime);

if (overlaps)
    return Conflict(new { message = "The selected time slot is already booked for this doctor." });`,
      },
      {
        type: 'p',
        text: 'Three details in that predicate are doing real work. Status filtering means cancellations release the slot without deleting history. The strict inequalities let a 09:00-09:30 appointment sit flush against a 09:30-10:00 one instead of falsely colliding. And the whole thing is one AnyAsync, so it costs a single existence check rather than loading the day.',
      },
      { type: 'h2', text: 'The window I am not pretending is closed' },
      {
        type: 'p',
        text: 'Between that read and the SaveChangesAsync a few lines later, nothing stops a second request from running the same query and getting the same answer. Two concurrent bookings for the same slot can both pass the check and both insert. This is check-then-act, and check-then-act has a race.',
      },
      {
        type: 'p',
        text: 'For where RxClinic actually runs — a single process against a SQLite file — that window is narrow and the operational risk is small. It is not zero, and the honest description is "a guard that holds under the load it was built for", not "a guarantee".',
      },
      { type: 'h2', text: 'Why the storage engine has not closed it for me' },
      {
        type: 'p',
        text: 'The reflex answer is a unique index, and it is the right instinct: a constraint the database enforces cannot be raced past, however many processes are running. But overlap is not equality. A unique index can enforce "no two appointments for this doctor start at exactly this instant"; it cannot express "no two appointments for this doctor overlap at all". The range case needs an exclusion constraint, which SQLite does not have and PostgreSQL does, via btree_gist.',
      },
      {
        type: 'quote',
        text: 'Push invariants to the lowest layer that can enforce them. The catch is that the lowest layer has to be able to express the invariant — and range overlap is where that stops being free.',
      },
      { type: 'h2', text: 'Next steps — not yet implemented' },
      {
        type: 'p',
        text: 'Everything in this section is intention, not shipped code. RxClinic today has exactly one unique index, on User.Username, and no overlap constraint of any kind.',
      },
      {
        type: 'ul',
        items: [
          'Fixed-length slots would make overlap collapse into equality, and a unique index on (DoctorId, StartTime) filtered to active statuses would then close the race outright.',
          'Staying with arbitrary ranges means moving to PostgreSQL and an EXCLUDE USING gist constraint — the only option here that enforces true overlap in the engine.',
          'Either route needs the unique-violation exception translated at the persistence boundary into the same 409 the read path already returns, so callers see one behaviour.',
        ],
      },
      {
        type: 'p',
        text: 'Until one of those lands, the read-before-write guard is what is running, and saying so is more useful than describing a constraint that is not there.',
      },
    ],
  },
  {
    slug: 'cqrs-without-the-ceremony',
    title: 'CQRS without the ceremony',
    excerpt:
      'You do not need event sourcing, two databases, or a message broker. You need to stop making reads and writes share a model.',
    date: '2025-09-02',
    readingMinutes: 6,
    tags: ['CQRS', 'Architecture', 'MediatR', 'PostgreSQL'],
    body: [
      {
        type: 'p',
        text: 'CQRS has an unfortunate reputation because it usually arrives packaged with event sourcing, eventual consistency and a broker nobody asked for. The core idea is much smaller and much more useful: reads and writes have different shapes, so stop forcing them through one model. TaskFlow is built this way and uses none of the expensive parts.',
      },
      { type: 'h2', text: 'The tension made concrete' },
      {
        type: 'p',
        text: 'A board wants every task in a project, grouped into columns, each card flattened to the handful of fields the UI draws. A status change wants one TaskItem loaded with its invariants intact so it can refuse an illegal transition. Serve both from the same entity graph and you get either an over-fetching read or a write model shredded by projection concerns.',
      },
      {
        type: 'p',
        text: 'The read side answers with types that exist only for the screen. Nothing here is a domain entity:',
      },
      {
        type: 'code',
        lang: 'csharp',
        code: `public sealed record BoardCardDto(
    Guid Id,
    string Key,
    string Title,
    TaskPriority Priority,
    DateTime? DueDateUtc,
    Guid? AssigneeId,
    bool IsOverdue,
    IReadOnlyList<Guid> LabelIds,
    IReadOnlyList<TaskItemStatus> AllowedStatusTargets);

public sealed record BoardColumnDto(TaskItemStatus Status, IReadOnlyList<BoardCardDto> Cards);

public sealed record BoardDto(Guid ProjectId, IReadOnlyList<BoardColumnDto> Columns);`,
      },
      {
        type: 'p',
        text: 'AllowedStatusTargets is the detail I would defend hardest. The domain already knows which transitions are legal from a given status, so the read model carries them and the UI greys out the rest without duplicating the rule in TypeScript. The read side stays dumb; the domain stays the single source of that answer.',
      },
      { type: 'h2', text: 'One handler, one shape' },
      {
        type: 'p',
        text: 'The query handler checks access, asks a repository for the tasks, and shapes them. Every column is emitted even when empty, so the board does not reflow as cards move between them:',
      },
      {
        type: 'code',
        lang: 'csharp',
        code: `var tasks = await _taskItems
    .ListByProjectAsync(request.ProjectId, cancellationToken)
    .ConfigureAwait(false);

var columns = columnOrder
    .Select(status => new BoardColumnDto(
        status,
        tasks
            .Where(task => task.Status == status)
            .OrderByDescending(task => task.Priority)
            .ThenBy(task => task.DueDateUtc ?? DateTime.MaxValue)
            .ThenBy(task => task.CreatedAtUtc)
            .Select(task => new BoardCardDto(
                task.Id,
                task.Key,
                task.Title,
                task.Priority,
                task.DueDateUtc,
                task.AssigneeId,
                task.IsOverdue(asOfUtc),
                task.Labels.Select(link => link.LabelId).ToArray(),
                task.AllowedStatusTargets().OrderBy(target => target).ToArray()))
            .ToArray()))
    .ToArray();`,
      },
      {
        type: 'p',
        text: 'Worth being precise about what this is not: the projection runs in memory, after the repository has materialised the entities. It is not a database-side projection, and there is no ordering trick hiding in the repository — the sort is right there in the handler. That is a deliberate trade. Reads stay behind the same repository abstraction as writes, at the cost of loading more than the screen strictly needs.',
      },
      { type: 'h2', text: 'What you actually adopt' },
      {
        type: 'ul',
        items: [
          'Two folders per feature: Commands and Queries. That is the whole structural change.',
          'Marker interfaces over MediatR — IQuery for reads, ICommand for writes — so the two sides stay visually separate and the pipeline can treat them differently later.',
          'Queries return DTOs shaped for a screen. Commands load aggregates and enforce invariants. Neither borrows the other’s model.',
          'One database, same transaction. No eventual consistency unless you have a reason.',
        ],
      },
      {
        type: 'p',
        text: 'The marker interfaces are four lines and earn their place: IQuery<T> : IRequest<T> and ICommand : IRequest<Unit>. Wrapping commands in a transaction and leaving queries alone becomes a pipeline behaviour rather than a convention people have to remember.',
      },
      { type: 'h2', text: 'What you skip' },
      {
        type: 'p',
        text: 'Event sourcing, read replicas, a separate read store, and a broker are all independent decisions. Each is justified by a specific pressure — audit requirements, read scale, cross-service integration. Adopt them when that pressure exists, not because a diagram showed them next to the letters CQRS.',
      },
      {
        type: 'quote',
        text: 'Separating the models is the pattern. Everything else usually attached to the acronym is an optional, expensive add-on.',
      },
    ],
  },
  {
    slug: 'level-triggered-alerts-and-the-inbound-exception',
    title: 'A low-stock alert with one condition worth arguing about',
    excerpt:
      'InvenTrack alerts whenever an outbound movement leaves a product low. The interesting part is not the threshold — it is why inbound movements are excluded.',
    date: '2025-06-21',
    readingMinutes: 4,
    tags: ['SignalR', 'Realtime', 'Design'],
    body: [
      {
        type: 'p',
        text: 'InvenTrack pushes low-stock alerts to a dashboard over SignalR. The rule that decides whether an alert fires is two clauses long, and one of them is a design decision rather than an obvious check.',
      },
      {
        type: 'code',
        lang: 'csharp',
        code: `if (transaction.Type != StockTransactionType.Out || !product.IsLowStock)
{
    return;
}`,
      },
      {
        type: 'p',
        text: 'The second clause is the threshold, and it lives on the entity beside the data it depends on: IsLowStock is QuantityInStock <= LowStockThreshold. The first clause is the one worth explaining.',
      },
      { type: 'h2', text: 'Why inbound movements stay quiet' },
      {
        type: 'p',
        text: 'A stock movement is either In or Out. Receiving twenty units of a product sitting well below its threshold still leaves it below the threshold, so a naive "is it low after this write" check would fire an alert. That alert would be technically true and actively unhelpful: it reports a situation that just got better as though something had gone wrong.',
      },
      {
        type: 'quote',
        text: 'An inbound movement that still leaves the product below its threshold is an improving situation and does not warrant an alert.',
      },
      {
        type: 'p',
        text: 'That sentence is the comment above the method, and it is the whole justification for the first clause. The alert is not really about the level being low — it is about the level being low and having just got lower.',
      },
      { type: 'h2', text: 'What this is and is not' },
      {
        type: 'p',
        text: 'This is a level-triggered alert with a direction filter. It fires on every outbound movement while the product is low, so shipping ten units one at a time from an already-low product produces ten alerts. It is not edge-triggered: nothing compares the previous quantity with the new one, so nothing detects the single moment the threshold is crossed.',
      },
      {
        type: 'p',
        text: 'Edge-triggering is the better answer for alert volume, and it is a real piece of work rather than a one-line change — the handler would need the previous value, which means either an extra read or carrying it through from the mutation. The direction filter is the cheap approximation, and it removes the most annoying category of false alert for the cost of one enum comparison.',
      },
      { type: 'h2', text: 'Two things the transport gets right' },
      {
        type: 'p',
        text: 'The hub is typed. Clients are declared as an interface rather than magic strings, so renaming a message breaks the build instead of production:',
      },
      {
        type: 'code',
        lang: 'csharp',
        code: `public interface IStockAlertClient
{
    /// <summary>Raised only when a movement leaves a product at or below its threshold.</summary>
    Task LowStockAlert(LowStockAlert alert);

    /// <summary>Raised for every committed movement, so open screens can refresh their data.</summary>
    Task StockChanged(StockChangedNotification notification);
}`,
      },
      {
        type: 'p',
        text: 'And delivery failures cannot fail the request. The stock movement is already committed by the time the alert is published, so the publish is wrapped and a failure is logged rather than thrown — the interface says so explicitly, and the caller catches anyway. Losing an alert is bad; rolling back a committed warehouse movement because a websocket was unhappy is worse.',
      },
      {
        type: 'quote',
        text: 'Notifying about a state change is a side effect of that change, not part of it. If the notification can fail the write, it is wired in the wrong direction.',
      },
    ],
  },
];

export const getPost = (slug: string) => posts.find((p) => p.slug === slug);

export const sortedPosts = [...posts].sort((a, b) => b.date.localeCompare(a.date));
