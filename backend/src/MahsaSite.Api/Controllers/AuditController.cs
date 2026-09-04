using MahsaSite.Api.Infrastructure;
using MahsaSite.Application.Dtos;
using MahsaSite.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MahsaSite.Api.Controllers;

/// <summary>
/// Read-only by design. Nothing in the API writes to or deletes from the audit
/// table through this surface, so the log stays trustworthy even for an admin.
/// </summary>
[ApiController]
[Route("api/audit")]
[Authorize(Policy = Policies.ContentEditor)]
public class AuditController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<AuditEntryResponse>>> List(
        [FromQuery] string? entityType,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = db.AuditLog.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(entityType))
        {
            query = query.Where(a => a.EntityType == entityType);
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(a => a.AtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return Ok(new PagedResult<AuditEntryResponse>(
            items.Select(a => new AuditEntryResponse(
                a.Id, a.UserEmail, a.Action, a.EntityType, a.EntityId, a.Summary, a.IpAddress, a.AtUtc)).ToList(),
            page, pageSize, total));
    }
}
