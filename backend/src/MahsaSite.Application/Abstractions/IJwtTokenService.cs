using MahsaSite.Domain.Entities;

namespace MahsaSite.Application.Abstractions;

public interface IJwtTokenService
{
    /// <summary>Returns the signed token and the instant it expires.</summary>
    (string Token, DateTimeOffset ExpiresAtUtc) Create(AdminUser user);
}
