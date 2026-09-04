namespace MahsaSite.Domain.Entities;

/// <summary>
/// Every upload becomes a row. The newest current row is what the public
/// download button serves; older ones stay retrievable rather than being
/// overwritten in place.
/// </summary>
public class ResumeVersion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FileName { get; set; } = string.Empty;
    public string PublicPath { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public bool IsCurrent { get; set; }
    public DateTimeOffset UploadedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public Guid UploadedByUserId { get; set; }
    public string? Note { get; set; }
}
