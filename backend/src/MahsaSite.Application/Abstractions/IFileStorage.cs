using MahsaSite.Domain.Enums;

namespace MahsaSite.Application.Abstractions;

public record StoredFile(string FileName, string PublicPath, long SizeBytes, string ContentType);

public interface IFileStorage
{
    /// <summary>
    /// Validates and writes an upload. Throws <see cref="UploadRejectedException"/>
    /// when the extension, declared type, or size fails the whitelist.
    /// </summary>
    Task<StoredFile> SaveAsync(Stream content, string originalFileName, string contentType, MediaKind kind, CancellationToken ct = default);

    /// <summary>Deletes a file by its public path. Returns false when it was already gone.</summary>
    bool Delete(string publicPath);

    /// <summary>
    /// Extracts a still frame from a stored video via ffmpeg. Returns null when
    /// ffmpeg is unavailable, leaving the existing poster fallback in place.
    /// </summary>
    Task<StoredFile?> TryGeneratePosterAsync(string videoPublicPath, CancellationToken ct = default);
}

public class UploadRejectedException(string message) : Exception(message);
