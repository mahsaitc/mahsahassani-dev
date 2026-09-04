using MahsaSite.Api.Infrastructure;
using MahsaSite.Application.Abstractions;
using MahsaSite.Application.Dtos;
using MahsaSite.Domain.Entities;
using MahsaSite.Domain.Enums;
using MahsaSite.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace MahsaSite.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    AppDbContext db,
    IPasswordHasher hasher,
    IJwtTokenService tokens,
    IAuditLogger audit,
    ICurrentUser currentUser) : ControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.Login)]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

        // One message and one code for every failure mode below, so the response
        // never reveals whether an address has an account behind it.
        var valid = user is not null
                    && user.IsActive
                    && hasher.Verify(request.Password, user.PasswordHash);

        if (!valid)
        {
            return Unauthorized(new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Sign-in failed",
                Detail = "That email and password combination was not recognised.",
            });
        }

        user!.LastLoginAtUtc = DateTimeOffset.UtcNow;
        await audit.WriteForAsync(user.Id, user.Email, "Login", nameof(AdminUser), user.Id.ToString(), "Signed in", ct);
        await db.SaveChangesAsync(ct);

        var (token, expires) = tokens.Create(user);
        return Ok(new LoginResponse(token, expires, ToSummary(user)));
    }

    /// <summary>Lets the dashboard confirm a stored token is still good on load.</summary>
    [HttpGet("me")]
    [Authorize(Policy = Policies.ContentEditor)]
    public async Task<ActionResult<UserSummary>> Me(CancellationToken ct)
    {
        var id = currentUser.Id;
        if (id is null) return Unauthorized();

        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id, ct);
        return user is null ? Unauthorized() : Ok(ToSummary(user));
    }

    [HttpPost("change-password")]
    [Authorize(Policy = Policies.ContentEditor)]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request, CancellationToken ct)
    {
        var id = currentUser.Id;
        if (id is null) return Unauthorized();

        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null) return Unauthorized();

        if (!hasher.Verify(request.CurrentPassword, user.PasswordHash))
        {
            ModelState.AddModelError(nameof(request.CurrentPassword), "Current password is incorrect.");
            return ValidationProblem(ModelState);
        }

        if (hasher.Verify(request.NewPassword, user.PasswordHash))
        {
            ModelState.AddModelError(nameof(request.NewPassword), "New password must differ from the current one.");
            return ValidationProblem(ModelState);
        }

        user.PasswordHash = hasher.Hash(request.NewPassword);
        // Signs out every other session holding a token issued before this change.
        user.TokenVersion++;

        await audit.WriteAsync("ChangePassword", nameof(AdminUser), user.Id.ToString(), $"{user.Email} changed their password", ct);
        await db.SaveChangesAsync(ct);

        return NoContent();
    }

    // ── Account management: Admin only ──────────────────────────────────────

    [HttpGet("users")]
    [Authorize(Policy = Policies.AdminOnly)]
    public async Task<ActionResult<IReadOnlyList<UserSummary>>> ListUsers(CancellationToken ct)
    {
        var users = await db.Users.AsNoTracking().OrderBy(u => u.Email).ToListAsync(ct);
        return Ok(users.Select(ToSummary).ToList());
    }

    [HttpPost("users")]
    [Authorize(Policy = Policies.AdminOnly)]
    public async Task<ActionResult<UserSummary>> CreateUser(CreateUserRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        if (await db.Users.AnyAsync(u => u.Email == email, ct))
        {
            ModelState.AddModelError(nameof(request.Email), "An account with that email already exists.");
            return ValidationProblem(ModelState);
        }

        var user = new AdminUser
        {
            Email = email,
            DisplayName = request.DisplayName.Trim(),
            PasswordHash = hasher.Hash(request.Password),
            Role = request.Role,
        };

        db.Users.Add(user);
        await audit.WriteAsync("Create", nameof(AdminUser), user.Id.ToString(), $"Created {user.Role} account {user.Email}", ct);
        await db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(ListUsers), new { id = user.Id }, ToSummary(user));
    }

    [HttpPut("users/{id:guid}")]
    [Authorize(Policy = Policies.AdminOnly)]
    public async Task<ActionResult<UserSummary>> UpdateUser(Guid id, UpdateUserRequest request, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null) return NotFound();

        var isSelf = currentUser.Id == id;
        var wouldRemoveLastAdmin = user.Role == UserRole.Admin
                                   && (request.Role != UserRole.Admin || !request.IsActive)
                                   && !await db.Users.AnyAsync(u => u.Id != id && u.Role == UserRole.Admin && u.IsActive, ct);

        // Locking the last admin out would leave the account pages unreachable
        // with no way back in short of editing the database by hand.
        if (wouldRemoveLastAdmin)
        {
            ModelState.AddModelError(nameof(request.Role), "This is the last active admin. Promote another admin first.");
            return ValidationProblem(ModelState);
        }

        if (isSelf && !request.IsActive)
        {
            ModelState.AddModelError(nameof(request.IsActive), "You cannot deactivate your own account.");
            return ValidationProblem(ModelState);
        }

        user.DisplayName = request.DisplayName.Trim();
        user.Role = request.Role;

        if (user.IsActive != request.IsActive)
        {
            user.IsActive = request.IsActive;
            // Deactivating must end open sessions, not wait for token expiry.
            user.TokenVersion++;
        }

        await audit.WriteAsync("Update", nameof(AdminUser), user.Id.ToString(), $"Updated account {user.Email}", ct);
        await db.SaveChangesAsync(ct);

        return Ok(ToSummary(user));
    }

    private static UserSummary ToSummary(AdminUser u) =>
        new(u.Id, u.Email, u.DisplayName, u.Role, u.IsActive, u.CreatedAtUtc, u.LastLoginAtUtc);
}
