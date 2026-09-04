using MahsaSite.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace MahsaSite.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<AdminUser> Users => Set<AdminUser>();
    public DbSet<Post> Posts => Set<Post>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Skill> Skills => Set<Skill>();
    public DbSet<TimelineEntry> TimelineEntries => Set<TimelineEntry>();
    public DbSet<Testimonial> Testimonials => Set<Testimonial>();
    public DbSet<SiteSetting> Settings => Set<SiteSetting>();
    public DbSet<MediaAsset> Media => Set<MediaAsset>();
    public DbSet<ResumeVersion> ResumeVersions => Set<ResumeVersion>();
    public DbSet<AuditLogEntry> AuditLog => Set<AuditLogEntry>();

    /// <summary>
    /// SQLite stores DateTimeOffset as TEXT and refuses to ORDER BY it, which
    /// would break every date-sorted list in the dashboard. Encoding to a long
    /// makes ordering work at the database level and keeps DateTimeOffset as
    /// the domain type. Applied by convention so new entities inherit it.
    /// </summary>
    protected override void ConfigureConventions(ModelConfigurationBuilder builder)
    {
        builder.Properties<DateTimeOffset>().HaveConversion<DateTimeOffsetToBinaryConverter>();
        builder.Properties<DateTimeOffset?>().HaveConversion<DateTimeOffsetToBinaryConverter>();
        base.ConfigureConventions(builder);
    }

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(b);
    }
}
