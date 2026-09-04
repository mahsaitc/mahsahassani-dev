namespace MahsaSite.Domain.Entities;

/// <summary>
/// Key/value store for the single-instance copy — About text, contact details,
/// availability line. A table per field would be a migration for every new
/// string; this keeps the schema still while the dashboard grows.
/// </summary>
public class SiteSetting
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
