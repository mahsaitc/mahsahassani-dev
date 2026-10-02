using System.Text;

namespace MahsaSite.Infrastructure.Storage;

/// <summary>
/// Content sniffing for uploads. A caller controls both the filename and the
/// declared content type, so the first bytes decide what a file really is.
///
/// Every whitelisted extension has a check here; an extension without one is
/// rejected rather than waved through. On top of that, AVIF/HEIF containers are
/// refused under any name: they are ISO-BMFF files that only differ from MP4 by
/// their brand, and the image pipeline that would decode them (sharp/libheif
/// behind next/image) has had remote-code-execution bugs.
/// </summary>
public static class FileSignatures
{
    /// <summary>Bytes read from the start of a file; enough for every check below.</summary>
    public const int HeaderLength = 64;

    /// <summary>
    /// ISO-BMFF brands used by HEIF-family images (AVIF, HEIC/HEIF, image
    /// sequences). Matched against the major brand and every compatible brand.
    /// </summary>
    private static readonly HashSet<string> HeifBrands = new(StringComparer.Ordinal)
    {
        "avif", "avis", "avio",
        "heic", "heix", "heim", "heis", "hevc", "hevx", "hevm", "hevs",
        "mif1", "mif2", "msf1", "miaf", "heif",
    };

    private static readonly Dictionary<string, Func<ReadOnlyMemory<byte>, bool>> Checks =
        new(StringComparer.OrdinalIgnoreCase)
        {
            [".jpg"] = h => StartsWith(h, 0xFF, 0xD8, 0xFF),
            [".jpeg"] = h => StartsWith(h, 0xFF, 0xD8, 0xFF),
            [".png"] = h => StartsWith(h, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A),
            [".gif"] = h => StartsWith(h, "GIF87a"u8) || StartsWith(h, "GIF89a"u8),
            // RIFF <size:4> WEBP
            [".webp"] = h => StartsWith(h, "RIFF"u8) && At(h, 8, "WEBP"u8),
            [".svg"] = LooksLikeSvg,
            // ISO-BMFF: <size:4> ftyp <brand:4>. HEIF brands are refused separately.
            [".mp4"] = h => At(h, 4, "ftyp"u8),
            // EBML magic (Matroska/WebM).
            [".webm"] = h => StartsWith(h, 0x1A, 0x45, 0xDF, 0xA3),
            [".pdf"] = h => StartsWith(h, "%PDF-"u8),
        };

    /// <summary>
    /// Returns null when <paramref name="header"/> is a valid file for
    /// <paramref name="extension"/>, otherwise a message safe to show the uploader.
    /// </summary>
    public static string? Validate(ReadOnlyMemory<byte> header, string extension)
    {
        if (IsHeifContainer(header))
        {
            return "AVIF and HEIF images are not accepted. Convert the file to JPEG, PNG or WebP.";
        }

        if (!Checks.TryGetValue(extension, out var check))
        {
            return $"No content check is defined for {extension} files.";
        }

        return check(header) ? null : $"File contents do not match a valid {extension} file.";
    }

    /// <summary>True for an ISO-BMFF file whose major or compatible brands are HEIF-family.</summary>
    public static bool IsHeifContainer(ReadOnlyMemory<byte> header)
    {
        var h = header.Span;
        if (h.Length < 12 || !h.Slice(4, 4).SequenceEqual("ftyp"u8)) return false;

        // The ftyp box size bounds the brand list; clamp to what was read.
        var boxSize = (int)Math.Min((uint)(h[0] << 24 | h[1] << 16 | h[2] << 8 | h[3]), (uint)h.Length);
        if (boxSize < 16) boxSize = Math.Min(16, h.Length);

        // Major brand at 8, minor version at 12, compatible brands from 16.
        if (HeifBrands.Contains(Encoding.ASCII.GetString(h.Slice(8, 4)))) return true;
        for (var offset = 16; offset + 4 <= boxSize; offset += 4)
        {
            if (HeifBrands.Contains(Encoding.ASCII.GetString(h.Slice(offset, 4)))) return true;
        }

        return false;
    }

    /// <summary>
    /// SVG is text, so this only rejects obvious binaries posing as SVG: after
    /// an optional UTF-8 BOM and whitespace the file must open with '&lt;'
    /// (an XML declaration, a comment or the &lt;svg&gt; element itself).
    /// </summary>
    private static bool LooksLikeSvg(ReadOnlyMemory<byte> header)
    {
        var h = header.Span;
        var i = h.StartsWith((ReadOnlySpan<byte>)[0xEF, 0xBB, 0xBF]) ? 3 : 0;
        while (i < h.Length && h[i] is (byte)' ' or (byte)'\t' or (byte)'\r' or (byte)'\n') i++;
        return i < h.Length && h[i] == (byte)'<';
    }

    private static bool StartsWith(ReadOnlyMemory<byte> header, params byte[] signature) =>
        header.Span.StartsWith(signature);

    private static bool StartsWith(ReadOnlyMemory<byte> header, ReadOnlySpan<byte> signature) =>
        header.Span.StartsWith(signature);

    private static bool At(ReadOnlyMemory<byte> header, int offset, ReadOnlySpan<byte> signature) =>
        header.Length >= offset + signature.Length && header.Span.Slice(offset, signature.Length).SequenceEqual(signature);
}
