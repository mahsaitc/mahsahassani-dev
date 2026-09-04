namespace MahsaSite.Application.Options;

public class StorageOptions
{
    public const string SectionName = "Storage";

    /// <summary>Absolute or content-root-relative directory holding every upload.</summary>
    public string RootPath { get; set; } = "uploads";

    /// <summary>URL prefix the files are served under.</summary>
    public string PublicPrefix { get; set; } = "/uploads";

    public long MaxImageBytes { get; set; } = 5 * 1024 * 1024;
    public long MaxVideoBytes { get; set; } = 25 * 1024 * 1024;
    public long MaxDocumentBytes { get; set; } = 10 * 1024 * 1024;

    public string[] AllowedImageExtensions { get; set; } = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
    public string[] AllowedVideoExtensions { get; set; } = [".mp4", ".webm"];
    public string[] AllowedDocumentExtensions { get; set; } = [".pdf"];

    /// <summary>ffmpeg binary used for poster frames. Left empty, poster generation is skipped.</summary>
    public string FfmpegPath { get; set; } = "ffmpeg";
}
