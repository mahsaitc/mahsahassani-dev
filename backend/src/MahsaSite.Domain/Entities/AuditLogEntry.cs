namespace MahsaSite.Domain.Entities;

/// <summary>
/// Append-only. Nothing in the API updates or deletes these rows, so the log
/// stays trustworthy even for someone with full dashboard access.
/// </summary>
public class AuditLogEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }

    /// <summary>Denormalised so the entry still reads correctly if the account is renamed.</summary>
    public string UserEmail { get; set; } = string.Empty;

    /// <summary>Verb such as Create, Update, Delete, Login, UploadResume.</summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>Entity type touched, e.g. Post or Project.</summary>
    public string EntityType { get; set; } = string.Empty;

    public string? EntityId { get; set; }

    /// <summary>Human-readable detail, e.g. the title of the post that changed.</summary>
    public string Summary { get; set; } = string.Empty;

    public string? IpAddress { get; set; }
    public DateTimeOffset AtUtc { get; set; } = DateTimeOffset.UtcNow;
}
