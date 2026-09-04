namespace MahsaSite.Domain.Entities;

public class Skill
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Heading the skill sits under, e.g. "Back end".</summary>
    public string GroupName { get; set; } = string.Empty;

    public int GroupOrder { get; set; }

    /// <summary>
    /// Subheading for the group. Denormalised onto every skill in it — a group
    /// table for one string would need its own CRUD screen; the read takes the
    /// first non-empty value.
    /// </summary>
    public string GroupBlurb { get; set; } = string.Empty;

    public string? GroupNameFa { get; set; }

    public string? GroupBlurbFa { get; set; }
    public string Name { get; set; } = string.Empty;

    /// <summary>Icon key resolved by the front end's icon map.</summary>
    public string IconKey { get; set; } = string.Empty;

    /// <summary>0-100 meter value. Self-assessed, so the resume prints names only.</summary>
    public int Level { get; set; }

    public string Note { get; set; } = string.Empty;

    /// <summary>Persian note. The skill name itself is never translated.</summary>
    public string? NoteFa { get; set; }
    public int SortOrder { get; set; }
}
