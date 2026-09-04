using System.ComponentModel.DataAnnotations;
using MahsaSite.Domain.Enums;

namespace MahsaSite.Application.Dtos;

public class PostRequest
{
    [Required(ErrorMessage = "Title is required.")]
    [StringLength(160, MinimumLength = 3, ErrorMessage = "Title must be 3-160 characters.")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Slug is required.")]
    [RegularExpression("^[a-z0-9]+(?:-[a-z0-9]+)*$", ErrorMessage = "Slug may contain only lower-case letters, numbers and single hyphens.")]
    [StringLength(160, MinimumLength = 3, ErrorMessage = "Slug must be 3-160 characters.")]
    public string Slug { get; set; } = string.Empty;

    [StringLength(400, ErrorMessage = "Excerpt cannot exceed 400 characters.")]
    public string Excerpt { get; set; } = string.Empty;

    [StringLength(160, ErrorMessage = "Persian title cannot exceed 160 characters.")]
    public string? TitleFa { get; set; }

    [StringLength(400, ErrorMessage = "Persian excerpt cannot exceed 400 characters.")]
    public string? ExcerptFa { get; set; }

    /// <summary>
    /// Persian body. The English posts carry audited technical claims, so a
    /// Persian version needs the same fact-check before it is published.
    /// </summary>
    public string? BodyMarkdownFa { get; set; }

    [Required(ErrorMessage = "Content is required.")]
    public string BodyMarkdown { get; set; } = string.Empty;

    public string? CoverImagePath { get; set; }

    /// <summary>Comma-separated. Whitespace around each tag is trimmed on save.</summary>
    public string Tags { get; set; } = string.Empty;

    public PostStatus Status { get; set; } = PostStatus.Draft;

    /// <summary>Optional override; defaults to the moment it first goes live.</summary>
    public DateTimeOffset? PublishedAtUtc { get; set; }
}

public record PostResponse(
    Guid Id, string Slug, string Title, string Excerpt, string BodyMarkdown,
    string? CoverImagePath, IReadOnlyList<string> Tags, PostStatus Status,
    DateTimeOffset? PublishedAtUtc, DateTimeOffset CreatedAtUtc, DateTimeOffset UpdatedAtUtc,
    string? PreviewKey, string? TitleFa, string? ExcerptFa, string? BodyMarkdownFa);
