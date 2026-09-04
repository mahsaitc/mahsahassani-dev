using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MahsaSite.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPersianTranslationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DescriptionFa",
                table: "TimelineEntries",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OrganisationFa",
                table: "TimelineEntries",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PeriodFa",
                table: "TimelineEntries",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TitleFa",
                table: "TimelineEntries",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "QuoteFa",
                table: "Testimonials",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RoleFa",
                table: "Testimonials",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GroupBlurbFa",
                table: "Skills",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GroupNameFa",
                table: "Skills",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NoteFa",
                table: "Skills",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SummaryFa",
                table: "Projects",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TaglineFa",
                table: "Projects",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BodyMarkdownFa",
                table: "Posts",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExcerptFa",
                table: "Posts",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TitleFa",
                table: "Posts",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DescriptionFa",
                table: "TimelineEntries");

            migrationBuilder.DropColumn(
                name: "OrganisationFa",
                table: "TimelineEntries");

            migrationBuilder.DropColumn(
                name: "PeriodFa",
                table: "TimelineEntries");

            migrationBuilder.DropColumn(
                name: "TitleFa",
                table: "TimelineEntries");

            migrationBuilder.DropColumn(
                name: "QuoteFa",
                table: "Testimonials");

            migrationBuilder.DropColumn(
                name: "RoleFa",
                table: "Testimonials");

            migrationBuilder.DropColumn(
                name: "GroupBlurbFa",
                table: "Skills");

            migrationBuilder.DropColumn(
                name: "GroupNameFa",
                table: "Skills");

            migrationBuilder.DropColumn(
                name: "NoteFa",
                table: "Skills");

            migrationBuilder.DropColumn(
                name: "SummaryFa",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "TaglineFa",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "BodyMarkdownFa",
                table: "Posts");

            migrationBuilder.DropColumn(
                name: "ExcerptFa",
                table: "Posts");

            migrationBuilder.DropColumn(
                name: "TitleFa",
                table: "Posts");
        }
    }
}
