using MahsaSite.Domain.Enums;

namespace MahsaSite.Domain.Entities;

public class MediaAsset
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Sanitised name actually written to disk.</summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>Name as uploaded, kept for display only — never used as a path.</summary>
    public string OriginalFileName { get; set; } = string.Empty;

    /// <summary>Public URL path, e.g. /uploads/images/xxxx.webp.</summary>
    public string PublicPath { get; set; } = string.Empty;

    public MediaKind Kind { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public DateTimeOffset UploadedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public Guid UploadedByUserId { get; set; }
}
