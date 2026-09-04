namespace MahsaSite.Domain.Entities;

public class Testimonial
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Quote { get; set; } = string.Empty;

    /// <summary>Persian quote. Only ever a translation the author approved.</summary>
    public string? QuoteFa { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;

    public string? RoleFa { get; set; }
    public string Initials { get; set; } = string.Empty;

    /// <summary>Link to the original recommendation, kept for attribution.</summary>
    public string? SourceUrl { get; set; }

    public bool Published { get; set; }
    public int SortOrder { get; set; }
}
