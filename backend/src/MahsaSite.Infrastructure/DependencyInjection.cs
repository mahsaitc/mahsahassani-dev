using MahsaSite.Application.Abstractions;
using MahsaSite.Application.Options;
using MahsaSite.Domain.Entities;
using MahsaSite.Domain.Enums;
using MahsaSite.Infrastructure.Persistence;
using MahsaSite.Infrastructure.Security;
using MahsaSite.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MahsaSite.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        services.Configure<JwtOptions>(config.GetSection(JwtOptions.SectionName));
        services.Configure<StorageOptions>(config.GetSection(StorageOptions.SectionName));
        services.Configure<SeedAdminOptions>(config.GetSection(SeedAdminOptions.SectionName));

        var connection = config.GetConnectionString("Default") ?? "Data Source=mahsasite.db";
        services.AddDbContext<AppDbContext>(o => o.UseSqlite(connection));

        services.AddHttpContextAccessor();
        services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<ICurrentUser, CurrentUser>();
        services.AddScoped<IAuditLogger, AuditLogger>();
        services.AddSingleton<IFileStorage, LocalFileStorage>();

        return services;
    }

    /// <summary>
    /// Applies migrations, then creates the first admin only when no user exists.
    /// There is no public sign-up route, so without this the API would have no
    /// reachable account on a fresh database.
    /// </summary>
    public static async Task InitialiseDatabaseAsync(this IServiceProvider services, CancellationToken ct = default)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DbInit");

        await db.Database.MigrateAsync(ct);

        if (await db.Users.AnyAsync(ct))
        {
            return;
        }

        var seed = scope.ServiceProvider.GetRequiredService<IOptions<SeedAdminOptions>>().Value;

        if (string.IsNullOrWhiteSpace(seed.Email) || string.IsNullOrWhiteSpace(seed.Password))
        {
            logger.LogWarning(
                "No users exist and SeedAdmin is not configured. Set SeedAdmin:Email and SeedAdmin:Password " +
                "(user-secrets or environment variables) and restart to create the first account.");
            return;
        }

        if (seed.Password.Length < 12)
        {
            logger.LogError("SeedAdmin:Password must be at least 12 characters. No account was created.");
            return;
        }

        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        db.Users.Add(new AdminUser
        {
            Email = seed.Email.Trim().ToLowerInvariant(),
            DisplayName = string.IsNullOrWhiteSpace(seed.DisplayName) ? "Administrator" : seed.DisplayName,
            PasswordHash = hasher.Hash(seed.Password),
            Role = UserRole.Admin,
            IsActive = true,
        });

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Created the initial admin account for {Email}", seed.Email);
    }
}
