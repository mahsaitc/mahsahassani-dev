namespace MahsaSite.Domain.Entities;

public class TimelineEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Period { get; set; } = string.Empty;

    /// <summary>Persian period label, for calendars or wording that differ.</summary>
    public string? PeriodFa { get; set; }

    /// <summary>work | education | milestone — selects the icon on the public timeline.</summary>
    public string Kind { get; set; } = "work";
    public string Title { get; set; } = string.Empty;

    /// <summary>Persian title. Project names stay untranslated by convention.</summary>
    public string? TitleFa { get; set; }
    public string Organisation { get; set; } = string.Empty;

    public string? OrganisationFa { get; set; }
    public string Description { get; set; } = string.Empty;

    public string? DescriptionFa { get; set; }

    /// <summary>Comma-separated tags shown on the entry.</summary>
    public string Tags { get; set; } = string.Empty;

    /// <summary>
    /// Newline-separated bullet points rendered under the summary. Kept as one
    /// column rather than a child table: they are always read and written with
    /// the entry, never queried on their own.
    /// </summary>
    public string Points { get; set; } = string.Empty;

    /// <summary>
    /// The resume generator prints only verified entries, so an unconfirmed
    /// draft can sit in the dashboard without reaching the PDF.
    /// </summary>
    public bool Verified { get; set; }

    public int SortOrder { get; set; }
}
