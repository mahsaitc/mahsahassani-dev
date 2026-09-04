namespace MahsaSite.Application.Abstractions;

public interface IAuditLogger
{
    /// <summary>
    /// Records an action against the current user. Call before SaveChanges so
    /// the audit row commits in the same transaction as the change it describes.
    /// </summary>
    Task WriteAsync(string action, string entityType, string? entityId, string summary, CancellationToken ct = default);

    /// <summary>
    /// Records an action against a named user rather than the JWT holder. Login
    /// runs before a token exists, so without this the row would be attributed
    /// to "system" and the log could not answer "who signed in".
    /// </summary>
    Task WriteForAsync(Guid userId, string userEmail, string action, string entityType, string? entityId, string summary, CancellationToken ct = default);
}
