using MahsaSite.Api.Infrastructure;
using MahsaSite.Application.Abstractions;
using MahsaSite.Application.Dtos;
using MahsaSite.Domain.Entities;
using MahsaSite.Domain.Enums;
using MahsaSite.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MahsaSite.Api.Controllers;

[ApiController]
[Route("api/posts")]
public class PostsController(AppDbContext db, IAuditLogger audit) : ControllerBase
{
    /// <summary>Published posts only. This is what the public blog reads.</summary>
    [HttpGet("published")]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<PostResponse>>> ListPublished(CancellationToken ct)
    {
        var posts = await db.Posts.AsNoTracking()
            .Where(p => p.Status == PostStatus.Published)
            .OrderByDescending(p => p.PublishedAtUtc)
            .ToListAsync(ct);

        // PreviewKey is withheld here: it is a capability, not public metadata.
        return Ok(posts.Select(p => ToResponse(p, includePreviewKey: false)).ToList());
    }

    [HttpGet("published/{slug}")]
    [AllowAnonymous]
    public async Task<ActionResult<PostResponse>> GetPublished(string slug, CancellationToken ct)
    {
        var post = await db.Posts.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Slug == slug && p.Status == PostStatus.Published, ct);

        return post is null ? NotFound() : Ok(ToResponse(post, includePreviewKey: false));
    }

    /// <summary>
    /// Renders a draft for review without a login, using the unguessable key
    /// issued when the post was created.
    /// </summary>
    [HttpGet("preview/{slug}")]
    [AllowAnonymous]
    public async Task<ActionResult<PostResponse>> Preview(string slug, [FromQuery] string key, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(key)) return NotFound();

        var post = await db.Posts.AsNoTracking().FirstOrDefaultAsync(p => p.Slug == slug, ct);
        if (post is null || !CryptographicEquals(post.PreviewKey, key)) return NotFound();

        return Ok(ToResponse(post, includePreviewKey: false));
    }

    // ── Dashboard ───────────────────────────────────────────────────────────

    [HttpGet]
    [Authorize(Policy = Policies.ContentEditor)]
    public async Task<ActionResult<IReadOnlyList<PostResponse>>> List(CancellationToken ct)
    {
        var posts = await db.Posts.AsNoTracking()
            .OrderByDescending(p => p.UpdatedAtUtc)
            .ToListAsync(ct);

        return Ok(posts.Select(p => ToResponse(p, includePreviewKey: true)).ToList());
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = Policies.ContentEditor)]
    public async Task<ActionResult<PostResponse>> Get(Guid id, CancellationToken ct)
    {
        var post = await db.Posts.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id, ct);
        return post is null ? NotFound() : Ok(ToResponse(post, includePreviewKey: true));
    }

    [HttpPost]
    [Authorize(Policy = Policies.ContentEditor)]
    public async Task<ActionResult<PostResponse>> Create(PostRequest request, CancellationToken ct)
    {
        if (await db.Posts.AnyAsync(p => p.Slug == request.Slug, ct))
        {
            ModelState.AddModelError(nameof(request.Slug), "Another post already uses that slug.");
            return ValidationProblem(ModelState);
        }

        var post = new Post();
        Apply(request, post);

        db.Posts.Add(post);
        await audit.WriteAsync("Create", nameof(Post), post.Id.ToString(), $"Created post '{post.Title}'", ct);
        await db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(Get), new { id = post.Id }, ToResponse(post, includePreviewKey: true));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = Policies.ContentEditor)]
    public async Task<ActionResult<PostResponse>> Update(Guid id, PostRequest request, CancellationToken ct)
    {
        var post = await db.Posts.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (post is null) return NotFound();

        if (await db.Posts.AnyAsync(p => p.Slug == request.Slug && p.Id != id, ct))
        {
            ModelState.AddModelError(nameof(request.Slug), "Another post already uses that slug.");
            return ValidationProblem(ModelState);
        }

        Apply(request, post);
        await audit.WriteAsync("Update", nameof(Post), post.Id.ToString(), $"Updated post '{post.Title}'", ct);
        await db.SaveChangesAsync(ct);

        return Ok(ToResponse(post, includePreviewKey: true));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = Policies.ContentEditor)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var post = await db.Posts.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (post is null) return NotFound();

        db.Posts.Remove(post);
        await audit.WriteAsync("Delete", nameof(Post), id.ToString(), $"Deleted post '{post.Title}'", ct);
        await db.SaveChangesAsync(ct);

        return NoContent();
    }

    private static void Apply(PostRequest r, Post post)
    {
        var goingLive = r.Status == PostStatus.Published && post.Status != PostStatus.Published;

        post.Title = r.Title.Trim();
        post.Slug = r.Slug.Trim().ToLowerInvariant();
        post.Excerpt = r.Excerpt.Trim();
        post.TitleFa = Optional(r.TitleFa);
        post.ExcerptFa = Optional(r.ExcerptFa);
        post.BodyMarkdownFa = Optional(r.BodyMarkdownFa);
        post.BodyMarkdown = r.BodyMarkdown;
        post.CoverImagePath = string.IsNullOrWhiteSpace(r.CoverImagePath) ? null : r.CoverImagePath;
        post.Tags = NormaliseTags(r.Tags);
        post.Status = r.Status;
        post.UpdatedAtUtc = DateTimeOffset.UtcNow;

        // An explicit date wins; otherwise the first publish stamps itself and
        // later edits leave the original date alone.
        if (r.PublishedAtUtc is not null)
        {
            post.PublishedAtUtc = r.PublishedAtUtc;
        }
        else if (goingLive)
        {
            post.PublishedAtUtc = DateTimeOffset.UtcNow;
        }
    }

    /// <summary>Blank Persian input stores as null, so "not written yet" has one form.</summary>
    private static string? Optional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    internal static string NormaliseTags(string raw) =>
        string.Join(",", raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Distinct(StringComparer.OrdinalIgnoreCase));

    internal static IReadOnlyList<string> SplitTags(string raw) =>
        raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    /// <summary>Length-independent comparison, so a wrong key cannot be timed out character by character.</summary>
    private static bool CryptographicEquals(string a, string b) =>
        System.Security.Cryptography.CryptographicOperations.FixedTimeEquals(
            System.Text.Encoding.UTF8.GetBytes(a.PadRight(64)[..64]),
            System.Text.Encoding.UTF8.GetBytes(b.PadRight(64)[..64]));

    private static PostResponse ToResponse(Post p, bool includePreviewKey) =>
        new(p.Id, p.Slug, p.Title, p.Excerpt, p.BodyMarkdown, p.CoverImagePath,
            SplitTags(p.Tags), p.Status, p.PublishedAtUtc, p.CreatedAtUtc, p.UpdatedAtUtc,
            includePreviewKey ? p.PreviewKey : null,
            p.TitleFa, p.ExcerptFa, p.BodyMarkdownFa);
}
