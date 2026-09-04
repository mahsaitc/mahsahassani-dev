using MahsaSite.Application.Abstractions;
using MahsaSite.Domain.Entities;
using MahsaSite.Infrastructure.Persistence;

namespace MahsaSite.Infrastructure.Security;

public class AuditLogger(AppDbContext db, ICurrentUser currentUser) : IAuditLogger
{
    /// <summary>
    /// Adds the row to the change tracker without saving. The caller's own
    /// SaveChanges commits it alongside the change being described, so an
    /// action can never be recorded for a write that was rolled back.
    /// </summary>
    public Task WriteAsync(string action, string entityType, string? entityId, string summary, CancellationToken ct = default) =>
        WriteForAsync(currentUser.Id ?? Guid.Empty, currentUser.Email ?? "system", action, entityType, entityId, summary, ct);

    public Task WriteForAsync(Guid userId, string userEmail, string action, string entityType, string? entityId, string summary, CancellationToken ct = default)
    {
        db.AuditLog.Add(new AuditLogEntry
        {
            UserId = userId,
            UserEmail = userEmail,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Summary = summary.Length > 400 ? summary[..400] : summary,
            IpAddress = currentUser.IpAddress,
        });
        return Task.CompletedTask;
    }
}
