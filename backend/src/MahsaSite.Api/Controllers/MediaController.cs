using MahsaSite.Api.Infrastructure;
using MahsaSite.Application.Abstractions;
using MahsaSite.Application.Dtos;
using MahsaSite.Domain.Entities;
using MahsaSite.Domain.Enums;
using MahsaSite.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace MahsaSite.Api.Controllers;

[ApiController]
[Route("api/media")]
[Authorize(Policy = Policies.ContentEditor)]
public class MediaController(
    AppDbContext db,
    IFileStorage storage,
    IAuditLogger audit,
    ICurrentUser currentUser) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<MediaResponse>>> List(
        [FromQuery] MediaKind? kind,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 40,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.Media.AsNoTracking();
        if (kind is not null) query = query.Where(m => m.Kind == kind);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(m => m.UploadedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return Ok(new PagedResult<MediaResponse>(
            items.Select(ToResponse).ToList(), page, pageSize, total));
    }

    [HttpPost]
    [EnableRateLimiting(RateLimitPolicies.Upload)]
    [RequestSizeLimit(30 * 1024 * 1024)]
    public async Task<ActionResult<MediaResponse>> Upload(IFormFile file, [FromForm] MediaKind kind, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
        {
            ModelState.AddModelError(nameof(file), "Choose a file to upload.");
            return ValidationProblem(ModelState);
        }

        // Validation lives in the storage layer; an UploadRejectedException is
        // translated to a 400 with a message written for the form.
        await using var stream = file.OpenReadStream();
        var stored = await storage.SaveAsync(stream, file.FileName, file.ContentType, kind, ct);

        var asset = new MediaAsset
        {
            FileName = stored.FileName,
            OriginalFileName = Path.GetFileName(file.FileName),
            PublicPath = stored.PublicPath,
            Kind = kind,
            ContentType = stored.ContentType,
            SizeBytes = stored.SizeBytes,
            UploadedByUserId = currentUser.Id ?? Guid.Empty,
        };

        db.Media.Add(asset);
        await audit.WriteAsync("Upload", nameof(MediaAsset), asset.Id.ToString(),
            $"Uploaded {kind} '{asset.OriginalFileName}'", ct);
        await db.SaveChangesAsync(ct);

        return Ok(ToResponse(asset));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var asset = await db.Media.FirstOrDefaultAsync(m => m.Id == id, ct);
        if (asset is null) return NotFound();

        // Warn rather than block: the dashboard shows what would break so the
        // decision stays with the person, but the reference is named explicitly.
        var usedByProject = await db.Projects
            .Where(p => p.VideoPath == asset.PublicPath || p.PosterPath == asset.PublicPath)
            .Select(p => p.Name)
            .FirstOrDefaultAsync(ct);

        var usedByPost = await db.Posts
            .Where(p => p.CoverImagePath == asset.PublicPath)
            .Select(p => p.Title)
            .FirstOrDefaultAsync(ct);

        if (usedByProject is not null || usedByPost is not null)
        {
            var user = usedByProject ?? usedByPost;
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "File is in use",
                Detail = $"This file is still referenced by '{user}'. Remove it there first, then delete the file.",
            });
        }

        storage.Delete(asset.PublicPath);
        db.Media.Remove(asset);

        await audit.WriteAsync("Delete", nameof(MediaAsset), id.ToString(),
            $"Deleted {asset.Kind} '{asset.OriginalFileName}'", ct);
        await db.SaveChangesAsync(ct);

        return NoContent();
    }

    private static MediaResponse ToResponse(MediaAsset m) =>
        new(m.Id, m.FileName, m.OriginalFileName, m.PublicPath, m.Kind, m.ContentType, m.SizeBytes, m.UploadedAtUtc);
}
