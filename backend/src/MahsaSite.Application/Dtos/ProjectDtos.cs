using System.ComponentModel.DataAnnotations;

namespace MahsaSite.Application.Dtos;

public class ProjectRequest
{
    [Required(ErrorMessage = "Name is required.")]
    [StringLength(80, MinimumLength = 2, ErrorMessage = "Name must be 2-80 characters.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Slug is required.")]
    [RegularExpression("^[a-z0-9]+(?:-[a-z0-9]+)*$", ErrorMessage = "Slug may contain only lower-case letters, numbers and single hyphens.")]
    public string Slug { get; set; } = string.Empty;

    [Required(ErrorMessage = "Tagline is required.")]
    [StringLength(160, ErrorMessage = "Tagline cannot exceed 160 characters.")]
    public string Tagline { get; set; } = string.Empty;

    /// <summary>Optional Persian tagline. Empty falls back to the English one.</summary>
    [StringLength(160, ErrorMessage = "Persian tagline cannot exceed 160 characters.")]
    public string? TaglineFa { get; set; }

    [Required(ErrorMessage = "Summary is required.")]
    [StringLength(600, ErrorMessage = "Summary cannot exceed 600 characters.")]
    public string Summary { get; set; } = string.Empty;

    /// <summary>Optional Persian summary. Empty falls back to the English one.</summary>
    [StringLength(600, ErrorMessage = "Persian summary cannot exceed 600 characters.")]
    public string? SummaryFa { get; set; }

    [Required(ErrorMessage = "GitHub repository name is required for live stats.")]
    [RegularExpression("^[A-Za-z0-9._-]+$", ErrorMessage = "Use the repository name only, not the full URL.")]
    public string RepoName { get; set; } = string.Empty;

    [Url(ErrorMessage = "Demo URL must be a valid absolute URL.")]
    public string? DemoUrl { get; set; }

    /// <summary>Comma-separated tech tags; these drive the homepage filter bar.</summary>
    public string TechTags { get; set; } = string.Empty;

    [RegularExpression("^[0-9]{4}$", ErrorMessage = "Year must be four digits.")]
    public string Year { get; set; } = string.Empty;

    public bool Featured { get; set; }

    [StringLength(160, ErrorMessage = "Alt text cannot exceed 160 characters.")]
    public string MediaAlt { get; set; } = string.Empty;

    public string? VideoPath { get; set; }
    public string? PosterPath { get; set; }
}

public record ProjectResponse(
    Guid Id, string Slug, string Name, string Tagline, string Summary,
    string RepoName, string? DemoUrl, IReadOnlyList<string> Tech, string Year,
    bool Featured, int SortOrder, string? VideoPath, string? PosterPath, string MediaAlt,
    string? TaglineFa, string? SummaryFa);

/// <summary>Reorder payload: the full ordered list of ids as shown in the dashboard.</summary>
public class ReorderRequest
{
    [Required]
    [MinLength(1, ErrorMessage = "Provide at least one id.")]
    public List<Guid> OrderedIds { get; set; } = [];
}
