using MahsaSite.Domain.Enums;

namespace MahsaSite.Application.Dtos;

public record MediaResponse(
    Guid Id, string FileName, string OriginalFileName, string PublicPath,
    MediaKind Kind, string ContentType, long SizeBytes, DateTimeOffset UploadedAtUtc);

public record ResumeVersionResponse(
    Guid Id, string FileName, string PublicPath, long SizeBytes,
    bool IsCurrent, DateTimeOffset UploadedAtUtc, string? Note);

public record AuditEntryResponse(
    Guid Id, string UserEmail, string Action, string EntityType,
    string? EntityId, string Summary, string? IpAddress, DateTimeOffset AtUtc);

/// <summary>Envelope for paged dashboard tables.</summary>
public record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount)
{
    public int TotalPages => PageSize <= 0 ? 0 : (int)Math.Ceiling(TotalCount / (double)PageSize);
}
