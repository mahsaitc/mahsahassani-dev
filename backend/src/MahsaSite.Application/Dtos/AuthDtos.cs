using System.ComponentModel.DataAnnotations;
using MahsaSite.Domain.Enums;

namespace MahsaSite.Application.Dtos;

public class LoginRequest
{
    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Enter a valid email address.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required.")]
    public string Password { get; set; } = string.Empty;
}

public record LoginResponse(string Token, DateTimeOffset ExpiresAtUtc, UserSummary User);

public record UserSummary(Guid Id, string Email, string DisplayName, UserRole Role, bool IsActive, DateTimeOffset CreatedAtUtc, DateTimeOffset? LastLoginAtUtc);

public class CreateUserRequest
{
    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Enter a valid email address.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Display name is required.")]
    [StringLength(80, MinimumLength = 2, ErrorMessage = "Display name must be 2-80 characters.")]
    public string DisplayName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required.")]
    [StringLength(128, MinimumLength = 12, ErrorMessage = "Password must be at least 12 characters.")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Role is required.")]
    public UserRole Role { get; set; } = UserRole.Editor;
}

public class ChangePasswordRequest
{
    [Required(ErrorMessage = "Current password is required.")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "New password is required.")]
    [StringLength(128, MinimumLength = 12, ErrorMessage = "New password must be at least 12 characters.")]
    public string NewPassword { get; set; } = string.Empty;
}

public class UpdateUserRequest
{
    [Required(ErrorMessage = "Display name is required.")]
    [StringLength(80, MinimumLength = 2, ErrorMessage = "Display name must be 2-80 characters.")]
    public string DisplayName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Role is required.")]
    public UserRole Role { get; set; }

    public bool IsActive { get; set; } = true;
}
