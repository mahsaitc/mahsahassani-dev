using MahsaSite.Domain.Enums;

namespace MahsaSite.Application.Abstractions;

/// <summary>The authenticated caller, resolved from the JWT on each request.</summary>
public interface ICurrentUser
{
    Guid? Id { get; }
    string? Email { get; }
    UserRole? Role { get; }
    string? IpAddress { get; }
}
