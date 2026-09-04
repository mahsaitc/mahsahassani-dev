using MahsaSite.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MahsaSite.Api.Controllers;

[ApiController]
[Route("api/health")]
[AllowAnonymous]
public class HealthController(AppDbContext db) : ControllerBase
{
    /// <summary>
    /// Used by the Next.js layer to decide whether the API is reachable before
    /// rendering, and by the VPS process manager as a liveness probe.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var canConnect = await db.Database.CanConnectAsync(ct);
        return canConnect
            ? Ok(new { status = "ok", database = "connected" })
            : StatusCode(StatusCodes.Status503ServiceUnavailable, new { status = "degraded", database = "unreachable" });
    }
}
