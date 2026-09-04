namespace MahsaSite.Domain.Enums;

/// <summary>
/// Editor manages content only. Admin additionally manages accounts.
/// Stored as a string so a future role does not renumber the existing rows.
/// </summary>
public enum UserRole
{
    Editor = 0,
    Admin = 1,
}
