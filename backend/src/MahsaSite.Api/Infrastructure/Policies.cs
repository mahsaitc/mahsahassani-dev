namespace MahsaSite.Api.Infrastructure;

public static class Policies
{
    /// <summary>Account management. Admin only.</summary>
    public const string AdminOnly = "AdminOnly";

    /// <summary>Everything content-related. Admin and Editor both qualify.</summary>
    public const string ContentEditor = "ContentEditor";
}

public static class RateLimitPolicies
{
    public const string Login = "login";
    public const string Upload = "upload";
}
