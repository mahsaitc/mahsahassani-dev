namespace MahsaSite.Application.Options;

/// <summary>
/// The very first admin, created on startup only when the user table is empty.
/// There is no public sign-up route, so this is the only way in initially.
/// </summary>
public class SeedAdminOptions
{
    public const string SectionName = "SeedAdmin";

    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = "Administrator";
    public string Password { get; set; } = string.Empty;
}
