namespace MahsaSite.Domain.Entities;

public class Project
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>URL segment for the case-study page.</summary>
    public string Slug { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
    public string Tagline { get; set; } = string.Empty;

    /// <summary>Persian tagline. Null or empty falls back to <see cref="Tagline"/>.</summary>
    public string? TaglineFa { get; set; }
    public string Summary { get; set; } = string.Empty;

    /// <summary>Persian summary. Null or empty falls back to <see cref="Summary"/>.</summary>
    public string? SummaryFa { get; set; }

    /// <summary>
    /// Exact GitHub repository name, which is not always the slug. The live
    /// stats lookup uses this, so a mismatch silently yields no stats.
    /// </summary>
    public string RepoName { get; set; } = string.Empty;

    /// <summary>Null when nothing is deployed — the demo button then stays hidden.</summary>
    public string? DemoUrl { get; set; }

    /// <summary>Comma-separated tech tags; drives the homepage filter bar.</summary>
    public string TechTags { get; set; } = string.Empty;

    public string Year { get; set; } = string.Empty;
    public bool Featured { get; set; }

    /// <summary>Manual ordering from the dashboard. Lower sorts first.</summary>
    public int SortOrder { get; set; }

    public string? VideoPath { get; set; }
    public string? PosterPath { get; set; }
    public string MediaAlt { get; set; } = string.Empty;

    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
