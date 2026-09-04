using MahsaSite.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MahsaSite.Infrastructure.Persistence.Configurations;

public class AdminUserConfiguration : IEntityTypeConfiguration<AdminUser>
{
    public void Configure(EntityTypeBuilder<AdminUser> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.Email).IsRequired().HasMaxLength(256);
        b.Property(x => x.DisplayName).IsRequired().HasMaxLength(80);
        b.Property(x => x.PasswordHash).IsRequired();
        // Emails are lower-cased before write, so a plain unique index is enough
        // to stop two accounts differing only by case.
        b.HasIndex(x => x.Email).IsUnique();
        b.Property(x => x.Role).HasConversion<string>().HasMaxLength(16);
    }
}

public class PostConfiguration : IEntityTypeConfiguration<Post>
{
    public void Configure(EntityTypeBuilder<Post> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.Slug).IsRequired().HasMaxLength(160);
        b.Property(x => x.Title).IsRequired().HasMaxLength(160);
        b.Property(x => x.Excerpt).HasMaxLength(400);
        b.Property(x => x.BodyMarkdown).IsRequired();
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(16);
        b.HasIndex(x => x.Slug).IsUnique();
        // The public list filters on status then orders by date; one index covers both.
        b.HasIndex(x => new { x.Status, x.PublishedAtUtc });
    }
}

public class ProjectConfiguration : IEntityTypeConfiguration<Project>
{
    public void Configure(EntityTypeBuilder<Project> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.Slug).IsRequired().HasMaxLength(120);
        b.Property(x => x.Name).IsRequired().HasMaxLength(80);
        b.Property(x => x.RepoName).IsRequired().HasMaxLength(120);
        b.Property(x => x.Tagline).HasMaxLength(160);
        b.Property(x => x.Summary).HasMaxLength(600);
        b.HasIndex(x => x.Slug).IsUnique();
        b.HasIndex(x => x.SortOrder);
    }
}

public class SkillConfiguration : IEntityTypeConfiguration<Skill>
{
    public void Configure(EntityTypeBuilder<Skill> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.GroupName).IsRequired().HasMaxLength(60);
        b.Property(x => x.Name).IsRequired().HasMaxLength(60);
        b.Property(x => x.IconKey).IsRequired().HasMaxLength(40);
        b.Property(x => x.Note).HasMaxLength(120);
        b.HasIndex(x => new { x.GroupOrder, x.SortOrder });
    }
}

public class TimelineEntryConfiguration : IEntityTypeConfiguration<TimelineEntry>
{
    public void Configure(EntityTypeBuilder<TimelineEntry> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.Period).IsRequired().HasMaxLength(60);
        b.Property(x => x.Title).IsRequired().HasMaxLength(120);
        b.Property(x => x.Organisation).IsRequired().HasMaxLength(120);
        b.Property(x => x.Description).HasMaxLength(600);
        b.HasIndex(x => x.SortOrder);
    }
}

public class TestimonialConfiguration : IEntityTypeConfiguration<Testimonial>
{
    public void Configure(EntityTypeBuilder<Testimonial> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.Quote).IsRequired().HasMaxLength(800);
        b.Property(x => x.Name).IsRequired().HasMaxLength(80);
        b.Property(x => x.Role).IsRequired().HasMaxLength(120);
        b.Property(x => x.Initials).IsRequired().HasMaxLength(3);
        b.HasIndex(x => x.SortOrder);
    }
}

public class SiteSettingConfiguration : IEntityTypeConfiguration<SiteSetting>
{
    public void Configure(EntityTypeBuilder<SiteSetting> b)
    {
        b.HasKey(x => x.Key);
        b.Property(x => x.Key).HasMaxLength(80);
        b.Property(x => x.Value).IsRequired();
    }
}

public class MediaAssetConfiguration : IEntityTypeConfiguration<MediaAsset>
{
    public void Configure(EntityTypeBuilder<MediaAsset> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.FileName).IsRequired().HasMaxLength(200);
        b.Property(x => x.OriginalFileName).IsRequired().HasMaxLength(260);
        b.Property(x => x.PublicPath).IsRequired().HasMaxLength(400);
        b.Property(x => x.Kind).HasConversion<string>().HasMaxLength(16);
        b.HasIndex(x => x.UploadedAtUtc);
    }
}

public class ResumeVersionConfiguration : IEntityTypeConfiguration<ResumeVersion>
{
    public void Configure(EntityTypeBuilder<ResumeVersion> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.FileName).IsRequired().HasMaxLength(200);
        b.Property(x => x.PublicPath).IsRequired().HasMaxLength(400);
        // Filtered unique index: exactly one row may be the current resume.
        b.HasIndex(x => x.IsCurrent).IsUnique().HasFilter("\"IsCurrent\" = 1");
    }
}

public class AuditLogEntryConfiguration : IEntityTypeConfiguration<AuditLogEntry>
{
    public void Configure(EntityTypeBuilder<AuditLogEntry> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.UserEmail).IsRequired().HasMaxLength(256);
        b.Property(x => x.Action).IsRequired().HasMaxLength(40);
        b.Property(x => x.EntityType).IsRequired().HasMaxLength(40);
        b.Property(x => x.Summary).HasMaxLength(400);
        // The dashboard reads this newest-first, always.
        b.HasIndex(x => x.AtUtc).IsDescending();
    }
}
