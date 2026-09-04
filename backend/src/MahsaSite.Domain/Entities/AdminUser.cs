using MahsaSite.Domain.Enums;

namespace MahsaSite.Domain.Entities;

public class AdminUser
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Lower-cased on write; the unique index is over this exact value.</summary>
    public string Email { get; set; } = string.Empty;

    public string DisplayName { get; set; } = string.Empty;

    /// <summary>BCrypt hash. The plaintext password never leaves the request pipeline.</summary>
    public string PasswordHash { get; set; } = string.Empty;

    public UserRole Role { get; set; } = UserRole.Editor;

    /// <summary>
    /// Disabling beats deleting: audit rows reference the user, and a deleted
    /// account would orphan the record of what they changed.
    /// </summary>
    public bool IsActive { get; set; } = true;

    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? LastLoginAtUtc { get; set; }

    /// <summary>
    /// Bumped on password change. Tokens carry the value they were issued with,
    /// so raising it invalidates every session that user has open.
    /// </summary>
    public int TokenVersion { get; set; }
}
