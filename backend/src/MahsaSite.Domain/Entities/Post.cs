using MahsaSite.Domain.Enums;

namespace MahsaSite.Domain.Entities;

public class Post
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;

    public string? TitleFa { get; set; }
    public string Excerpt { get; set; } = string.Empty;

    public string? ExcerptFa { get; set; }

    /// <summary>Markdown source. Rendered by the front end, never stored as HTML.</summary>
    public string BodyMarkdown { get; set; } = string.Empty;

    /// <summary>
    /// Persian body. The audited English posts carry verified technical claims,
    /// so a Persian version needs the same fact-check before publishing — see
    /// PRE-LAUNCH.md.
    /// </summary>
    public string? BodyMarkdownFa { get; set; }

    public string? CoverImagePath { get; set; }

    /// <summary>Comma-separated; small enough that a join table would be overhead.</summary>
    public string Tags { get; set; } = string.Empty;

    public PostStatus Status { get; set; } = PostStatus.Draft;

    /// <summary>Set when first published, then preserved across later edits.</summary>
    public DateTimeOffset? PublishedAtUtc { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>Unguessable token that lets a draft be previewed without a login.</summary>
    public string PreviewKey { get; set; } = Guid.NewGuid().ToString("N");
}
