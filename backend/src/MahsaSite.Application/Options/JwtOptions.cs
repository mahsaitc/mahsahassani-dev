namespace MahsaSite.Application.Options;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "mahsahassani.dev";
    public string Audience { get; set; } = "mahsahassani.dev";

    /// <summary>
    /// Must be supplied via configuration and at least 32 chars. Startup fails
    /// rather than falling back to a built-in default.
    /// </summary>
    public string SigningKey { get; set; } = string.Empty;

    public int LifetimeMinutes { get; set; } = 120;
}
