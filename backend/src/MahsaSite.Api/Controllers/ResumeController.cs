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
[Route("api/resume")]
public class ResumeController(
    AppDbContext db,
    IFileStorage storage,
    IAuditLogger audit,
    ICurrentUser currentUser) : ControllerBase
{
    /// <summary>
    /// What the public download button points at. Returns 404 until the first
    /// upload, so the button can hide rather than serve a missing file.
    /// </summary>
    [HttpGet("current")]
    [AllowAnonymous]
    public async Task<ActionResult<ResumeVersionResponse>> Current(CancellationToken ct)
    {
        var current = await db.ResumeVersions.AsNoTracking().FirstOrDefaultAsync(r => r.IsCurrent, ct);
        return current is null ? NotFound() : Ok(ToResponse(current));
    }

    [HttpGet("versions")]
    [Authorize(Policy = Policies.ContentEditor)]
    public async Task<ActionResult<IReadOnlyList<ResumeVersionResponse>>> Versions(CancellationToken ct)
    {
        var versions = await db.ResumeVersions.AsNoTracking()
            .OrderByDescending(r => r.UploadedAtUtc)
            .ToListAsync(ct);

        return Ok(versions.Select(ToResponse).ToList());
    }

    /// <summary>
    /// Uploads a new resume and makes it current. Older versions keep their
    /// files and rows, so a bad upload can be rolled back rather than recovered
    /// from a backup.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = Policies.ContentEditor)]
    [EnableRateLimiting(RateLimitPolicies.Upload)]
    [RequestSizeLimit(15 * 1024 * 1024)]
    public async Task<ActionResult<ResumeVersionResponse>> Upload(IFormFile file, [FromForm] string? note, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
        {
            ModelState.AddModelError(nameof(file), "Choose a PDF to upload.");
            return ValidationProblem(ModelState);
        }

        await using var stream = file.OpenReadStream();
        var stored = await storage.SaveAsync(stream, file.FileName, file.ContentType, MediaKind.Document, ct);

        // Exactly one row may be current; the filtered unique index enforces it,
        // so the previous one is demoted before the new row is added.
        var previous = await db.ResumeVersions.Where(r => r.IsCurrent).ToListAsync(ct);
        foreach (var p in previous) p.IsCurrent = false;
        await db.SaveChangesAsync(ct);

        var version = new ResumeVersion
        {
            FileName = stored.FileName,
            PublicPath = stored.PublicPath,
            SizeBytes = stored.SizeBytes,
            IsCurrent = true,
            UploadedByUserId = currentUser.Id ?? Guid.Empty,
            Note = string.IsNullOrWhiteSpace(note) ? null : note.Trim(),
        };

        db.ResumeVersions.Add(version);
        await audit.WriteAsync("UploadResume", nameof(ResumeVersion), version.Id.ToString(),
            $"Uploaded resume '{Path.GetFileName(file.FileName)}'", ct);
        await db.SaveChangesAsync(ct);

        await PruneAsync(ct);
        return Ok(ToResponse(version));
    }

    /// <summary>Promotes an older version back to current.</summary>
    [HttpPost("versions/{id:guid}/restore")]
    [Authorize(Policy = Policies.ContentEditor)]
    public async Task<ActionResult<ResumeVersionResponse>> Restore(Guid id, CancellationToken ct)
    {
        var target = await db.ResumeVersions.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (target is null) return NotFound();
        if (target.IsCurrent) return Ok(ToResponse(target));

        foreach (var r in await db.ResumeVersions.Where(x => x.IsCurrent).ToListAsync(ct))
        {
            r.IsCurrent = false;
        }
        await db.SaveChangesAsync(ct);

        target.IsCurrent = true;
        await audit.WriteAsync("RestoreResume", nameof(ResumeVersion), id.ToString(),
            $"Restored resume version from {target.UploadedAtUtc:yyyy-MM-dd}", ct);
        await db.SaveChangesAsync(ct);

        return Ok(ToResponse(target));
    }

    /// <summary>
    /// Keeps the current version plus the five most recent, deleting the files
    /// behind anything older so the disk does not grow without bound.
    /// </summary>
    private async Task PruneAsync(CancellationToken ct)
    {
        const int keep = 5;

        var stale = await db.ResumeVersions
            .Where(r => !r.IsCurrent)
            .OrderByDescending(r => r.UploadedAtUtc)
            .Skip(keep)
            .ToListAsync(ct);

        if (stale.Count == 0) return;

        foreach (var version in stale)
        {
            storage.Delete(version.PublicPath);
            db.ResumeVersions.Remove(version);
        }

        await db.SaveChangesAsync(ct);
    }

    private static ResumeVersionResponse ToResponse(ResumeVersion r) =>
        new(r.Id, r.FileName, r.PublicPath, r.SizeBytes, r.IsCurrent, r.UploadedAtUtc, r.Note);
}
