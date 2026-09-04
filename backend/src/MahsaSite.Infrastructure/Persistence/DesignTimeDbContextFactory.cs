using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace MahsaSite.Infrastructure.Persistence;

/// <summary>
/// Used only by "dotnet ef". Without it the tooling boots the API host, which
/// deliberately refuses to start without a JWT signing key configured — so
/// creating a migration would require production secrets to be present.
/// </summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite("Data Source=design-time.db")
            .Options;

        return new AppDbContext(options);
    }
}
