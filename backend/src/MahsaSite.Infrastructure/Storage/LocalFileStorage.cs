using System.Diagnostics;
using MahsaSite.Application.Abstractions;
using MahsaSite.Application.Options;
using MahsaSite.Domain.Enums;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MahsaSite.Infrastructure.Storage;

/// <summary>
/// Writes uploads to local disk under one root, in a folder per kind.
///
/// The uploaded filename is never used as a path. A fresh random name is
/// generated and only the extension is carried across, after that extension has
/// been checked against the whitelist for the declared kind. That removes path
/// traversal, null-byte tricks, and double-extension attacks in one step
/// instead of trying to sanitise a hostile string into safety.
/// </summary>
public class LocalFileStorage(
    IOptions<StorageOptions> options,
    ILogger<LocalFileStorage> logger) : IFileStorage
{
    private readonly StorageOptions _options = options.Value;

    private static readonly Dictionary<MediaKind, string> Folders = new()
    {
        [MediaKind.Image] = "images",
        [MediaKind.Video] = "videos",
        [MediaKind.Document] = "documents",
    };

    public async Task<StoredFile> SaveAsync(
        Stream content, string originalFileName, string contentType, MediaKind kind, CancellationToken ct = default)
    {
        var extension = Path.GetExtension(originalFileName ?? string.Empty).ToLowerInvariant();
        var allowed = AllowedExtensions(kind);

        if (string.IsNullOrWhiteSpace(extension) || !allowed.Contains(extension))
        {
            var kindLabel = kind.ToString().ToLowerInvariant();
            throw new UploadRejectedException(
                $"That is not an accepted {kindLabel} type. Allowed: {string.Join(", ", allowed)}.");
        }

        var maxBytes = MaxBytes(kind);
        if (content.CanSeek && content.Length > maxBytes)
        {
            throw new UploadRejectedException(
                $"File is {Human(content.Length)}; the limit is {Human(maxBytes)}.");
        }

        await using var buffered = await BufferAsync(content, maxBytes, ct);
        VerifySignature(buffered, extension);

        var folder = Path.Combine(RootPath(), Folders[kind]);
        Directory.CreateDirectory(folder);

        // Random name, whitelisted extension. The original is kept only as a label.
        var storedName = Guid.NewGuid().ToString("N") + extension;
        var fullPath = Path.Combine(folder, storedName);

        await using (var target = File.Create(fullPath))
        {
            buffered.Position = 0;
            await buffered.CopyToAsync(target, ct);
        }

        var publicPath = _options.PublicPrefix + "/" + Folders[kind] + "/" + storedName;
        logger.LogInformation("Stored {Kind} upload {Path} ({Size} bytes)", kind, publicPath, buffered.Length);

        return new StoredFile(storedName, publicPath, buffered.Length, contentType);
    }

    public bool Delete(string publicPath)
    {
        var full = ResolveInsideRoot(publicPath);
        if (full is null || !File.Exists(full)) return false;
        File.Delete(full);
        return true;
    }

    public async Task<StoredFile?> TryGeneratePosterAsync(string videoPublicPath, CancellationToken ct = default)
    {
        var source = ResolveInsideRoot(videoPublicPath);
        if (source is null || !File.Exists(source)) return null;

        var folder = Path.Combine(RootPath(), Folders[MediaKind.Image]);
        Directory.CreateDirectory(folder);

        var storedName = Guid.NewGuid().ToString("N") + ".jpg";
        var target = Path.Combine(folder, storedName);

        // One frame at the one-second mark: past any fade-in, still cheap.
        var arguments = string.Concat(
            "-y -ss 00:00:01 -i \"", source, "\" -frames:v 1 -q:v 3 \"", target, "\"");

        var psi = new ProcessStartInfo(_options.FfmpegPath)
        {
            Arguments = arguments,
            RedirectStandardError = true,
            RedirectStandardOutput = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };

        try
        {
            using var process = Process.Start(psi);
            if (process is null) return null;

            await process.WaitForExitAsync(ct);

            if (process.ExitCode != 0 || !File.Exists(target))
            {
                logger.LogWarning(
                    "ffmpeg could not produce a poster for {Video} (exit {Code})", videoPublicPath, process.ExitCode);
                return null;
            }
        }
        catch (Exception ex) when (ex is System.ComponentModel.Win32Exception or FileNotFoundException)
        {
            // ffmpeg not installed. Callers keep the existing poster fallback.
            logger.LogInformation("ffmpeg unavailable; skipping poster generation for {Video}", videoPublicPath);
            return null;
        }

        var info = new FileInfo(target);
        var publicPath = _options.PublicPrefix + "/" + Folders[MediaKind.Image] + "/" + storedName;
        return new StoredFile(storedName, publicPath, info.Length, "image/jpeg");
    }

    private string[] AllowedExtensions(MediaKind kind) => kind switch
    {
        MediaKind.Image => _options.AllowedImageExtensions,
        MediaKind.Video => _options.AllowedVideoExtensions,
        MediaKind.Document => _options.AllowedDocumentExtensions,
        _ => [],
    };

    private long MaxBytes(MediaKind kind) => kind switch
    {
        MediaKind.Image => _options.MaxImageBytes,
        MediaKind.Video => _options.MaxVideoBytes,
        MediaKind.Document => _options.MaxDocumentBytes,
        _ => 0,
    };

    private string RootPath() =>
        Path.IsPathRooted(_options.RootPath)
            ? _options.RootPath
            : Path.Combine(Directory.GetCurrentDirectory(), _options.RootPath);

    /// <summary>
    /// Maps a public path back to disk, returning null if the result would land
    /// outside the storage root. Guards against a stored path containing
    /// traversal segments ever reaching File.Delete.
    /// </summary>
    private string? ResolveInsideRoot(string publicPath)
    {
        if (string.IsNullOrWhiteSpace(publicPath)) return null;
        if (!publicPath.StartsWith(_options.PublicPrefix, StringComparison.Ordinal)) return null;

        var relative = publicPath[_options.PublicPrefix.Length..].TrimStart('/', '\\');
        var root = Path.GetFullPath(RootPath());
        var candidate = Path.GetFullPath(Path.Combine(root, relative));

        return candidate.StartsWith(root, StringComparison.OrdinalIgnoreCase) ? candidate : null;
    }

    /// <summary>
    /// Copies into memory with a hard ceiling, so a request that understates its
    /// length cannot stream unbounded data onto the disk.
    /// </summary>
    private static async Task<MemoryStream> BufferAsync(Stream source, long maxBytes, CancellationToken ct)
    {
        var buffer = new MemoryStream();
        var chunk = new byte[81920];
        long total = 0;
        int read;

        while ((read = await source.ReadAsync(chunk, ct)) > 0)
        {
            total += read;
            if (total > maxBytes)
            {
                await buffer.DisposeAsync();
                throw new UploadRejectedException($"File exceeds the {Human(maxBytes)} limit.");
            }
            await buffer.WriteAsync(chunk.AsMemory(0, read), ct);
        }

        buffer.Position = 0;
        return buffer;
    }

    /// <summary>
    /// A caller can claim any filename and content type, so the first bytes
    /// decide: a .webp whose header is an AVIF container is rejected regardless
    /// of what the multipart headers declared. See <see cref="FileSignatures"/>.
    /// </summary>
    private static void VerifySignature(Stream content, string extension)
    {
        var header = new byte[FileSignatures.HeaderLength];
        content.Position = 0;
        var read = content.ReadAtLeast(header, header.Length, throwOnEndOfStream: false);
        content.Position = 0;

        var problem = FileSignatures.Validate(header.AsMemory(0, read), extension);
        if (problem is not null)
        {
            throw new UploadRejectedException(problem);
        }
    }

    private static string Human(long bytes) =>
        bytes >= 1024 * 1024
            ? (bytes / 1024d / 1024d).ToString("0.#") + " MB"
            : (bytes / 1024d).ToString("0.#") + " KB";
}
