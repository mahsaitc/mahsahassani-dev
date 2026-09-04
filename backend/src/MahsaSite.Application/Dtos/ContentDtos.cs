using System.ComponentModel.DataAnnotations;

namespace MahsaSite.Application.Dtos;

public class SkillRequest
{
    [Required(ErrorMessage = "Group name is required.")]
    [StringLength(60, ErrorMessage = "Group name cannot exceed 60 characters.")]
    public string GroupName { get; set; } = string.Empty;

    public int GroupOrder { get; set; }

    [StringLength(200, ErrorMessage = "Group blurb cannot exceed 200 characters.")]
    public string GroupBlurb { get; set; } = string.Empty;

    [StringLength(60, ErrorMessage = "Persian group name cannot exceed 60 characters.")]
    public string? GroupNameFa { get; set; }

    [StringLength(200, ErrorMessage = "Persian group blurb cannot exceed 200 characters.")]
    public string? GroupBlurbFa { get; set; }

    [Required(ErrorMessage = "Skill name is required.")]
    [StringLength(60, ErrorMessage = "Skill name cannot exceed 60 characters.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Icon key is required.")]
    public string IconKey { get; set; } = string.Empty;

    [Range(0, 100, ErrorMessage = "Level must be between 0 and 100.")]
    public int Level { get; set; }

    [StringLength(120, ErrorMessage = "Note cannot exceed 120 characters.")]
    public string Note { get; set; } = string.Empty;

    [StringLength(120, ErrorMessage = "Persian note cannot exceed 120 characters.")]
    public string? NoteFa { get; set; }
}

public record SkillResponse(
    Guid Id, string GroupName, int GroupOrder, string GroupBlurb, string Name,
    string IconKey, int Level, string Note, int SortOrder,
    string? GroupNameFa, string? GroupBlurbFa, string? NoteFa);

public class TimelineRequest
{
    [Required(ErrorMessage = "Period is required.")]
    [StringLength(60, ErrorMessage = "Period cannot exceed 60 characters.")]
    public string Period { get; set; } = string.Empty;

    [RegularExpression("^(work|education|milestone|certification|project)$", ErrorMessage = "Kind must be work, education, milestone, certification or project.")]
    public string Kind { get; set; } = "work";

    [StringLength(60, ErrorMessage = "Persian period cannot exceed 60 characters.")]
    public string? PeriodFa { get; set; }

    [StringLength(120, ErrorMessage = "Persian title cannot exceed 120 characters.")]
    public string? TitleFa { get; set; }

    [StringLength(120, ErrorMessage = "Persian organisation cannot exceed 120 characters.")]
    public string? OrganisationFa { get; set; }

    [StringLength(600, ErrorMessage = "Persian description cannot exceed 600 characters.")]
    public string? DescriptionFa { get; set; }

    [Required(ErrorMessage = "Title is required.")]
    [StringLength(120, ErrorMessage = "Title cannot exceed 120 characters.")]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Optional: a certification or degree may be recorded before its issuer or
    /// institution is confirmed, and an empty value is better than a guessed one.
    /// The public entry simply omits the line.
    /// </summary>
    [StringLength(120, ErrorMessage = "Organisation cannot exceed 120 characters.")]
    public string Organisation { get; set; } = string.Empty;

    [StringLength(600, ErrorMessage = "Description cannot exceed 600 characters.")]
    public string Description { get; set; } = string.Empty;

    public string Tags { get; set; } = string.Empty;

    /// <summary>One bullet point per line.</summary>
    public string Points { get; set; } = string.Empty;

    /// <summary>
    /// Unverified entries are withheld from the public timeline AND the resume
    /// PDF, not just flagged in the dashboard.
    /// </summary>
    public bool Verified { get; set; }
}

public record TimelineResponse(
    Guid Id, string Period, string Kind, string Title, string Organisation, string Description,
    IReadOnlyList<string> Points, IReadOnlyList<string> Tags, bool Verified, int SortOrder,
    string? PeriodFa, string? TitleFa, string? OrganisationFa, string? DescriptionFa);

public class TestimonialRequest
{
    [Required(ErrorMessage = "Quote is required.")]
    [StringLength(800, MinimumLength = 10, ErrorMessage = "Quote must be 10-800 characters.")]
    public string Quote { get; set; } = string.Empty;

    [Required(ErrorMessage = "Name is required — unattributed quotes are not published.")]
    [StringLength(80, ErrorMessage = "Name cannot exceed 80 characters.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Role is required.")]
    [StringLength(120, ErrorMessage = "Role cannot exceed 120 characters.")]
    public string Role { get; set; } = string.Empty;

    [Required(ErrorMessage = "Initials are required.")]
    [StringLength(3, MinimumLength = 1, ErrorMessage = "Use 1-3 characters for initials.")]
    public string Initials { get; set; } = string.Empty;

    [Url(ErrorMessage = "Source must be a valid absolute URL.")]
    public string? SourceUrl { get; set; }

    [StringLength(800, ErrorMessage = "Persian quote cannot exceed 800 characters.")]
    public string? QuoteFa { get; set; }

    [StringLength(120, ErrorMessage = "Persian role cannot exceed 120 characters.")]
    public string? RoleFa { get; set; }

    public bool Published { get; set; }
}

public record TestimonialResponse(
    Guid Id, string Quote, string Name, string Role, string Initials, string? SourceUrl,
    bool Published, int SortOrder, string? QuoteFa, string? RoleFa);

public class SettingsRequest
{
    /// <summary>Key/value pairs to upsert. Keys absent from the payload are left alone.</summary>
    [Required]
    public Dictionary<string, string> Values { get; set; } = [];
}
