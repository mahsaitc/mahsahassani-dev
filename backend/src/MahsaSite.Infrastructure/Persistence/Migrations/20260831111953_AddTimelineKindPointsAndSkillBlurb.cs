using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MahsaSite.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTimelineKindPointsAndSkillBlurb : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Kind",
                table: "TimelineEntries",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Points",
                table: "TimelineEntries",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "GroupBlurb",
                table: "Skills",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Kind",
                table: "TimelineEntries");

            migrationBuilder.DropColumn(
                name: "Points",
                table: "TimelineEntries");

            migrationBuilder.DropColumn(
                name: "GroupBlurb",
                table: "Skills");
        }
    }
}
