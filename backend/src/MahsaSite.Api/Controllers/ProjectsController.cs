using MahsaSite.Api.Infrastructure;
using MahsaSite.Application.Abstractions;
using MahsaSite.Application.Dtos;
using MahsaSite.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectEntity = MahsaSite.Domain.Entities.Project;

namespace MahsaSite.Api.Controllers;

[ApiController]
[Route("api/projects")]
public class ProjectsController(AppDbContext db, IAuditLogger audit, IFileStorage storage) : ControllerBase
{
    /// <summary>Public list, already in dashboard order.</summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<ProjectResponse>>> List(CancellationToken ct)
    {
        var items = await db.Projects.AsNoTracking()
            .OrderBy(p => p.SortOrder)
            .ThenBy(p => p.Name)
            .ToListAsync(ct);

        return Ok(items.Select(ToResponse).ToList());
    }

    [HttpGet("{slug}")]
    [AllowAnonymous]
    public async Task<ActionResult<ProjectResponse>> GetBySlug(string slug, CancellationToken ct)
    {
        var project = await db.Projects.AsNoTracking().FirstOrDefaultAsync(p => p.Slug == slug, ct);
        return project is null ? NotFound() : Ok(ToResponse(project));
    }

    [HttpPost]
    [Authorize(Policy = Policies.ContentEditor)]
    public async Task<ActionResult<ProjectResponse>> Create(ProjectRequest request, CancellationToken ct)
    {
        if (await db.Projects.AnyAsync(p => p.Slug == request.Slug, ct))
        {
            ModelState.AddModelError(nameof(request.Slug), "Another project already uses that slug.");
            return ValidationProblem(ModelState);
        }

        var project = new ProjectEntity
        {
            // New entries land at the end rather than silently taking position 0.
            SortOrder = await db.Projects.AnyAsync(ct) ? await db.Projects.MaxAsync(p => p.SortOrder, ct) + 1 : 0,
        };
        Apply(request, project);

        db.Projects.Add(project);
        await audit.WriteAsync("Create", nameof(ProjectEntity), project.Id.ToString(), $"Created project '{project.Name}'", ct);
        await db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetBySlug), new { slug = project.Slug }, ToResponse(project));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = Policies.ContentEditor)]
    public async Task<ActionResult<ProjectResponse>> Update(Guid id, ProjectRequest request, CancellationToken ct)
    {
        var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (project is null) return NotFound();

        if (await db.Projects.AnyAsync(p => p.Slug == request.Slug && p.Id != id, ct))
        {
            ModelState.AddModelError(nameof(request.Slug), "Another project already uses that slug.");
            return ValidationProblem(ModelState);
        }

        Apply(request, project);
        await audit.WriteAsync("Update", nameof(ProjectEntity), project.Id.ToString(), $"Updated project '{project.Name}'", ct);
        await db.SaveChangesAsync(ct);

        return Ok(ToResponse(project));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = Policies.ContentEditor)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (project is null) return NotFound();

        db.Projects.Remove(project);
        await audit.WriteAsync("Delete", nameof(ProjectEntity), id.ToString(), $"Deleted project '{project.Name}'", ct);
        await db.SaveChangesAsync(ct);

        return NoContent();
    }

    [HttpPut("reorder")]
    [Authorize(Policy = Policies.ContentEditor)]
    public async Task<IActionResult> Reorder(ReorderRequest request, CancellationToken ct)
    {
        var projects = await db.Projects.ToListAsync(ct);
        var byId = projects.ToDictionary(p => p.Id);

        // Reject unknown ids rather than silently ignoring them: a stale
        // dashboard tab would otherwise reshuffle the list in a way nobody asked for.
        var unknown = request.OrderedIds.Where(id => !byId.ContainsKey(id)).ToList();
        if (unknown.Count > 0)
        {
            ModelState.AddModelError(nameof(request.OrderedIds), "The list contains projects that no longer exist. Refresh and try again.");
            return ValidationProblem(ModelState);
        }

        for (var i = 0; i < request.OrderedIds.Count; i++)
        {
            byId[request.OrderedIds[i]].SortOrder = i;
        }

        // Anything the client did not mention keeps a stable position after the rest.
        var trailing = request.OrderedIds.Count;
        foreach (var p in projects.Where(p => !request.OrderedIds.Contains(p.Id)).OrderBy(p => p.SortOrder))
        {
            p.SortOrder = trailing++;
        }

        await audit.WriteAsync("Reorder", nameof(ProjectEntity), null, $"Reordered {request.OrderedIds.Count} projects", ct);
        await db.SaveChangesAsync(ct);

        return NoContent();
    }

    /// <summary>
    /// Attaches an already-uploaded video and, when no poster is set, tries to
    /// derive one from the first seconds of the clip. If ffmpeg is unavailable
    /// the poster stays null and the existing fallback image keeps rendering.
    /// </summary>
    [HttpPost("{id:guid}/generate-poster")]
    [Authorize(Policy = Policies.ContentEditor)]
    public async Task<ActionResult<ProjectResponse>> GeneratePoster(Guid id, CancellationToken ct)
    {
        var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (project is null) return NotFound();

        if (string.IsNullOrWhiteSpace(project.VideoPath))
        {
            ModelState.AddModelError("VideoPath", "Upload a video for this project first.");
            return ValidationProblem(ModelState);
        }

        var poster = await storage.TryGeneratePosterAsync(project.VideoPath, ct);
        if (poster is null)
        {
            return Problem(
                title: "Poster could not be generated",
                detail: "ffmpeg is not available on the server, so no frame could be extracted. Upload a poster image instead.",
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }

        project.PosterPath = poster.PublicPath;
        project.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await audit.WriteAsync("GeneratePoster", nameof(ProjectEntity), project.Id.ToString(), $"Generated poster for '{project.Name}'", ct);
        await db.SaveChangesAsync(ct);

        return Ok(ToResponse(project));
    }

    private static void Apply(ProjectRequest r, ProjectEntity p)
    {
        p.Name = r.Name.Trim();
        p.Slug = r.Slug.Trim().ToLowerInvariant();
        p.Tagline = r.Tagline.Trim();
        p.TaglineFa = Optional(r.TaglineFa);
        p.Summary = r.Summary.Trim();
        p.SummaryFa = Optional(r.SummaryFa);
        p.RepoName = r.RepoName.Trim();
        p.DemoUrl = string.IsNullOrWhiteSpace(r.DemoUrl) ? null : r.DemoUrl.Trim();
        p.TechTags = PostsController.NormaliseTags(r.TechTags);
        p.Year = r.Year.Trim();
        p.Featured = r.Featured;
        p.MediaAlt = r.MediaAlt.Trim();
        p.VideoPath = string.IsNullOrWhiteSpace(r.VideoPath) ? null : r.VideoPath;
        p.PosterPath = string.IsNullOrWhiteSpace(r.PosterPath) ? null : r.PosterPath;
        p.UpdatedAtUtc = DateTimeOffset.UtcNow;
    }

    /// <summary>Blank Persian input stores as null, so "not written yet" has one form.</summary>
    private static string? Optional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static ProjectResponse ToResponse(ProjectEntity p) =>
        new(p.Id, p.Slug, p.Name, p.Tagline, p.Summary, p.RepoName, p.DemoUrl,
            PostsController.SplitTags(p.TechTags), p.Year, p.Featured, p.SortOrder,
            p.VideoPath, p.PosterPath, p.MediaAlt, p.TaglineFa, p.SummaryFa);
}
