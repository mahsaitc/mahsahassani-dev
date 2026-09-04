using MahsaSite.Api.Infrastructure;
using MahsaSite.Application.Abstractions;
using MahsaSite.Application.Dtos;
using MahsaSite.Domain.Entities;
using MahsaSite.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MahsaSite.Api.Controllers;

/// <summary>
/// Skills, timeline, testimonials and the free-text site settings. These share
/// one controller because each is a flat list the dashboard edits in place.
/// </summary>
[ApiController]
[Route("api/content")]
public class ContentController(AppDbContext db, IAuditLogger audit) : ControllerBase
{
    // ── Skills ──────────────────────────────────────────────────────────────

    [HttpGet("skills")]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<SkillResponse>>> ListSkills(CancellationToken ct)
    {
        var skills = await db.Skills.AsNoTracking()
            .OrderBy(s => s.GroupOrder).ThenBy(s => s.SortOrder).ThenBy(s => s.Name)
            .ToListAsync(ct);

        return Ok(skills.Select(s =>
            ToSkillResponse(s)).ToList());
    }

    [HttpPost("skills")]
    [Authorize(Policy = Policies.ContentEditor)]
    public async Task<ActionResult<SkillResponse>> CreateSkill(SkillRequest r, CancellationToken ct)
    {
        var skill = new Skill
        {
            SortOrder = await NextSortOrderAsync(db.Skills.Select(s => s.SortOrder), ct),
        };
        ApplySkill(r, skill);

        db.Skills.Add(skill);
        await audit.WriteAsync("Create", nameof(Skill), skill.Id.ToString(), $"Added skill '{skill.Name}'", ct);
        await db.SaveChangesAsync(ct);

        return Ok(ToSkillResponse(skill));
    }

    [HttpPut("skills/{id:guid}")]
    [Authorize(Policy = Policies.ContentEditor)]
    public async Task<ActionResult<SkillResponse>> UpdateSkill(Guid id, SkillRequest r, CancellationToken ct)
    {
        var skill = await db.Skills.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (skill is null) return NotFound();

        ApplySkill(r, skill);
        await audit.WriteAsync("Update", nameof(Skill), id.ToString(), $"Updated skill '{skill.Name}'", ct);
        await db.SaveChangesAsync(ct);

        return Ok(ToSkillResponse(skill));
    }

    [HttpDelete("skills/{id:guid}")]
    [Authorize(Policy = Policies.ContentEditor)]
    public async Task<IActionResult> DeleteSkill(Guid id, CancellationToken ct)
    {
        var skill = await db.Skills.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (skill is null) return NotFound();

        db.Skills.Remove(skill);
        await audit.WriteAsync("Delete", nameof(Skill), id.ToString(), $"Removed skill '{skill.Name}'", ct);
        await db.SaveChangesAsync(ct);

        return NoContent();
    }

    [HttpPut("skills/reorder")]
    [Authorize(Policy = Policies.ContentEditor)]
    public async Task<IActionResult> ReorderSkills(ReorderRequest request, CancellationToken ct)
    {
        var skills = await db.Skills.ToListAsync(ct);
        var applied = ApplyOrder(skills, s => s.Id, (s, i) => s.SortOrder = i, request.OrderedIds);
        if (!applied)
        {
            ModelState.AddModelError(nameof(request.OrderedIds), "The list contains skills that no longer exist. Refresh and try again.");
            return ValidationProblem(ModelState);
        }

        await audit.WriteAsync("Reorder", nameof(Skill), null, $"Reordered {request.OrderedIds.Count} skills", ct);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    // ── Timeline ────────────────────────────────────────────────────────────

    [HttpGet("timeline")]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<TimelineResponse>>> ListTimeline(CancellationToken ct)
    {
        var entries = await db.TimelineEntries.AsNoTracking().OrderBy(t => t.SortOrder).ToListAsync(ct);
        return Ok(entries.Select(ToTimelineResponse).ToList());
    }

    [HttpPost("timeline")]
    [Authorize(Policy = Policies.ContentEditor)]
    public async Task<ActionResult<TimelineResponse>> CreateTimeline(TimelineRequest r, CancellationToken ct)
    {
        var entry = new TimelineEntry
        {
            SortOrder = await NextSortOrderAsync(db.TimelineEntries.Select(t => t.SortOrder), ct),
        };
        ApplyTimeline(r, entry);

        db.TimelineEntries.Add(entry);
        await audit.WriteAsync("Create", nameof(TimelineEntry), entry.Id.ToString(), $"Added timeline entry '{entry.Title}'", ct);
        await db.SaveChangesAsync(ct);

        return Ok(ToTimelineResponse(entry));
    }

    [HttpPut("timeline/{id:guid}")]
    [Authorize(Policy = Policies.ContentEditor)]
    public async Task<ActionResult<TimelineResponse>> UpdateTimeline(Guid id, TimelineRequest r, CancellationToken ct)
    {
        var entry = await db.TimelineEntries.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (entry is null) return NotFound();

        ApplyTimeline(r, entry);
        await audit.WriteAsync("Update", nameof(TimelineEntry), id.ToString(), $"Updated timeline entry '{entry.Title}'", ct);
        await db.SaveChangesAsync(ct);

        return Ok(ToTimelineResponse(entry));
    }

    [HttpDelete("timeline/{id:guid}")]
    [Authorize(Policy = Policies.ContentEditor)]
    public async Task<IActionResult> DeleteTimeline(Guid id, CancellationToken ct)
    {
        var entry = await db.TimelineEntries.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (entry is null) return NotFound();

        db.TimelineEntries.Remove(entry);
        await audit.WriteAsync("Delete", nameof(TimelineEntry), id.ToString(), $"Deleted timeline entry '{entry.Title}'", ct);
        await db.SaveChangesAsync(ct);

        return NoContent();
    }

    // ── Testimonials ────────────────────────────────────────────────────────

    /// <summary>
    /// Published testimonials only. The section self-hides on an empty list, so
    /// nothing renders until a real, attributed quote is published.
    /// </summary>
    [HttpGet("testimonials")]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<TestimonialResponse>>> ListPublishedTestimonials(CancellationToken ct)
    {
        var items = await db.Testimonials.AsNoTracking()
            .Where(t => t.Published)
            .OrderBy(t => t.SortOrder)
            .ToListAsync(ct);

        return Ok(items.Select(ToTestimonialResponse).ToList());
    }

    [HttpGet("testimonials/all")]
    [Authorize(Policy = Policies.ContentEditor)]
    public async Task<ActionResult<IReadOnlyList<TestimonialResponse>>> ListAllTestimonials(CancellationToken ct)
    {
        var items = await db.Testimonials.AsNoTracking().OrderBy(t => t.SortOrder).ToListAsync(ct);
        return Ok(items.Select(ToTestimonialResponse).ToList());
    }

    [HttpPost("testimonials")]
    [Authorize(Policy = Policies.ContentEditor)]
    public async Task<ActionResult<TestimonialResponse>> CreateTestimonial(TestimonialRequest r, CancellationToken ct)
    {
        var item = new Testimonial
        {
            SortOrder = await NextSortOrderAsync(db.Testimonials.Select(t => t.SortOrder), ct),
        };
        ApplyTestimonial(r, item);

        db.Testimonials.Add(item);
        await audit.WriteAsync("Create", nameof(Testimonial), item.Id.ToString(), $"Added testimonial from {item.Name}", ct);
        await db.SaveChangesAsync(ct);

        return Ok(ToTestimonialResponse(item));
    }

    [HttpPut("testimonials/{id:guid}")]
    [Authorize(Policy = Policies.ContentEditor)]
    public async Task<ActionResult<TestimonialResponse>> UpdateTestimonial(Guid id, TestimonialRequest r, CancellationToken ct)
    {
        var item = await db.Testimonials.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (item is null) return NotFound();

        ApplyTestimonial(r, item);
        await audit.WriteAsync("Update", nameof(Testimonial), id.ToString(), $"Updated testimonial from {item.Name}", ct);
        await db.SaveChangesAsync(ct);

        return Ok(ToTestimonialResponse(item));
    }

    [HttpDelete("testimonials/{id:guid}")]
    [Authorize(Policy = Policies.ContentEditor)]
    public async Task<IActionResult> DeleteTestimonial(Guid id, CancellationToken ct)
    {
        var item = await db.Testimonials.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (item is null) return NotFound();

        db.Testimonials.Remove(item);
        await audit.WriteAsync("Delete", nameof(Testimonial), id.ToString(), $"Deleted testimonial from {item.Name}", ct);
        await db.SaveChangesAsync(ct);

        return NoContent();
    }

    // ── Settings ────────────────────────────────────────────────────────────

    [HttpGet("settings")]
    [AllowAnonymous]
    public async Task<ActionResult<Dictionary<string, string>>> GetSettings(CancellationToken ct)
    {
        var settings = await db.Settings.AsNoTracking().ToDictionaryAsync(s => s.Key, s => s.Value, ct);
        return Ok(settings);
    }

    [HttpPut("settings")]
    [Authorize(Policy = Policies.ContentEditor)]
    public async Task<ActionResult<Dictionary<string, string>>> UpdateSettings(SettingsRequest request, CancellationToken ct)
    {
        foreach (var (key, value) in request.Values)
        {
            var trimmedKey = key.Trim();
            if (trimmedKey.Length is 0 or > 80)
            {
                ModelState.AddModelError(nameof(request.Values), $"'{key}' is not a valid setting key.");
                return ValidationProblem(ModelState);
            }

            var existing = await db.Settings.FirstOrDefaultAsync(s => s.Key == trimmedKey, ct);
            if (existing is null)
            {
                db.Settings.Add(new SiteSetting { Key = trimmedKey, Value = value });
            }
            else
            {
                existing.Value = value;
                existing.UpdatedAtUtc = DateTimeOffset.UtcNow;
            }
        }

        await audit.WriteAsync("Update", nameof(SiteSetting), null,
            $"Updated settings: {string.Join(", ", request.Values.Keys)}", ct);
        await db.SaveChangesAsync(ct);

        var all = await db.Settings.AsNoTracking().ToDictionaryAsync(s => s.Key, s => s.Value, ct);
        return Ok(all);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private static async Task<int> NextSortOrderAsync(IQueryable<int> orders, CancellationToken ct) =>
        await orders.AnyAsync(ct) ? await orders.MaxAsync(ct) + 1 : 0;

    /// <summary>
    /// Applies an explicit order, returning false when the payload references
    /// something that has since been deleted.
    /// </summary>
    private static bool ApplyOrder<T>(List<T> items, Func<T, Guid> idOf, Action<T, int> setOrder, List<Guid> orderedIds)
    {
        var byId = items.ToDictionary(idOf);
        if (orderedIds.Any(id => !byId.ContainsKey(id))) return false;

        for (var i = 0; i < orderedIds.Count; i++) setOrder(byId[orderedIds[i]], i);

        var trailing = orderedIds.Count;
        foreach (var item in items.Where(x => !orderedIds.Contains(idOf(x))))
        {
            setOrder(item, trailing++);
        }

        return true;
    }


    /// <summary>
    /// Persian fields are stored null when blank, so "no translation yet" has
    /// one representation rather than two. The public site falls back to
    /// English on null.
    /// </summary>
    private static string? Optional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static SkillResponse ToSkillResponse(Skill s) =>
        new(s.Id, s.GroupName, s.GroupOrder, s.GroupBlurb, s.Name, s.IconKey, s.Level, s.Note, s.SortOrder,
            s.GroupNameFa, s.GroupBlurbFa, s.NoteFa);

    private static void ApplySkill(SkillRequest r, Skill s)
    {
        s.GroupName = r.GroupName.Trim();
        s.GroupOrder = r.GroupOrder;
        s.GroupBlurb = r.GroupBlurb.Trim();
        s.GroupNameFa = Optional(r.GroupNameFa);
        s.GroupBlurbFa = Optional(r.GroupBlurbFa);
        s.Name = r.Name.Trim();
        s.IconKey = r.IconKey.Trim();
        s.Level = r.Level;
        s.Note = r.Note.Trim();
        s.NoteFa = Optional(r.NoteFa);
    }

    private static void ApplyTimeline(TimelineRequest r, TimelineEntry t)
    {
        t.Period = r.Period.Trim();
        t.Title = r.Title.Trim();
        t.Organisation = r.Organisation.Trim();
        t.Description = r.Description.Trim();
        t.Tags = PostsController.NormaliseTags(r.Tags);
        t.Kind = string.IsNullOrWhiteSpace(r.Kind) ? "work" : r.Kind.Trim();
        t.PeriodFa = Optional(r.PeriodFa);
        t.TitleFa = Optional(r.TitleFa);
        t.OrganisationFa = Optional(r.OrganisationFa);
        t.DescriptionFa = Optional(r.DescriptionFa);
        // Blank lines would render as empty bullets, so they are dropped on write.
        t.Points = string.Join('\n', SplitLines(r.Points));
        t.Verified = r.Verified;
    }

    private static void ApplyTestimonial(TestimonialRequest r, Testimonial t)
    {
        t.Quote = r.Quote.Trim();
        t.Name = r.Name.Trim();
        t.Role = r.Role.Trim();
        t.Initials = r.Initials.Trim().ToUpperInvariant();
        t.SourceUrl = string.IsNullOrWhiteSpace(r.SourceUrl) ? null : r.SourceUrl.Trim();
        t.QuoteFa = Optional(r.QuoteFa);
        t.RoleFa = Optional(r.RoleFa);
        t.Published = r.Published;
    }

    /// <summary>Splits a multi-line field, dropping blanks and surrounding whitespace.</summary>
    private static string[] SplitLines(string raw) =>
        raw.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    private static TimelineResponse ToTimelineResponse(TimelineEntry t) =>
        new(t.Id, t.Period, t.Kind, t.Title, t.Organisation, t.Description,
            SplitLines(t.Points), PostsController.SplitTags(t.Tags), t.Verified, t.SortOrder,
            t.PeriodFa, t.TitleFa, t.OrganisationFa, t.DescriptionFa);

    private static TestimonialResponse ToTestimonialResponse(Testimonial t) =>
        new(t.Id, t.Quote, t.Name, t.Role, t.Initials, t.SourceUrl, t.Published, t.SortOrder,
            t.QuoteFa, t.RoleFa);
}
