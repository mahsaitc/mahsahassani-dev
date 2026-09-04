using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using MahsaSite.Api.Infrastructure;
using MahsaSite.Application.Options;
using MahsaSite.Infrastructure;
using MahsaSite.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddControllers().AddJsonOptions(o =>
{
    // Roles, post status and media kind travel as names, matching how they are
    // stored and keeping the dashboard readable without a numeric lookup table.
    o.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});
builder.Services.AddEndpointsApiExplorer();

// ── Auth ────────────────────────────────────────────────────────────────────
var jwt = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();

if (string.IsNullOrWhiteSpace(jwt.SigningKey) || jwt.SigningKey.Length < 32)
{
    // Refusing to start beats silently signing tokens with a guessable default.
    throw new InvalidOperationException(
        "Jwt:SigningKey must be configured and at least 32 characters. " +
        "Set it via user-secrets in development or an environment variable in production.");
}

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        // Without this the handler rewrites "sub" to the long WS-Federation
        // claim URI, and every lookup by the JWT's own claim names returns null.
        o.MapInboundClaims = false;

        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey)),
            // Tokens expire when they say they do, not five minutes later.
            ClockSkew = TimeSpan.Zero,
        };

        o.Events = new JwtBearerEvents
        {
            // A token stays valid only while it matches the account's current
            // state: deactivating a user or changing a password takes effect
            // immediately rather than at the token's natural expiry.
            OnTokenValidated = async context =>
            {
                var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
                var sub = context.Principal?.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
                var versionClaim = context.Principal?.FindFirstValue("token_version");

                if (!Guid.TryParse(sub, out var userId) || !int.TryParse(versionClaim, out var version))
                {
                    context.Fail("Malformed token.");
                    return;
                }

                var user = await db.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.Id == userId, context.HttpContext.RequestAborted);

                if (user is null || !user.IsActive || user.TokenVersion != version)
                {
                    context.Fail("This session is no longer valid.");
                }
            },
        };
    });

builder.Services.AddAuthorizationBuilder()
    .AddPolicy(Policies.AdminOnly, p => p.RequireRole(nameof(MahsaSite.Domain.Enums.UserRole.Admin)))
    .AddPolicy(Policies.ContentEditor, p => p.RequireRole(
        nameof(MahsaSite.Domain.Enums.UserRole.Admin),
        nameof(MahsaSite.Domain.Enums.UserRole.Editor)));

// ── Rate limiting ───────────────────────────────────────────────────────────
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Keyed on IP: the point is to slow credential stuffing against any account,
    // so limiting per submitted email would let an attacker rotate past it.
    options.AddPolicy(RateLimitPolicies.Login, http =>
        RateLimitPartition.GetFixedWindowLimiter(
            http.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
            }));

    options.AddPolicy(RateLimitPolicies.Upload, http =>
        RateLimitPartition.GetFixedWindowLimiter(
            http.User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub) ?? "anonymous",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 30,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
            }));

    options.OnRejected = async (context, ct) =>
    {
        context.HttpContext.Response.ContentType = "application/problem+json";
        await context.HttpContext.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = StatusCodes.Status429TooManyRequests,
            Title = "Too many requests",
            Detail = "Too many attempts. Wait a minute and try again.",
        }, ct);
    };
});

// ── CORS ────────────────────────────────────────────────────────────────────
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                     ?? ["http://localhost:3000"];

builder.Services.AddCors(o => o.AddPolicy("site", p => p
    .WithOrigins(allowedOrigins)
    .AllowAnyHeader()
    .AllowAnyMethod()));

// Behind nginx on the VPS: without this the audit log records the proxy's IP
// for every request, and the login limiter buckets everyone together.
builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    o.KnownNetworks.Clear();
    o.KnownProxies.Clear();
});

var app = builder.Build();

app.UseForwardedHeaders();
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (!app.Environment.IsDevelopment())
{
    // HSTS and redirect only outside development, where there is no dev cert.
    app.UseHsts();
    app.UseHttpsRedirection();
}

// Uploaded files are served from the storage root rather than wwwroot so the
// directory can live on a separate volume from the deployed binaries.
var storage = app.Services.GetRequiredService<Microsoft.Extensions.Options.IOptions<StorageOptions>>().Value;
var uploadRoot = Path.IsPathRooted(storage.RootPath)
    ? storage.RootPath
    : Path.Combine(builder.Environment.ContentRootPath, storage.RootPath);
Directory.CreateDirectory(uploadRoot);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadRoot),
    RequestPath = storage.PublicPrefix,
    ServeUnknownFileTypes = false,
    OnPrepareResponse = ctx =>
    {
        // Content-addressed names, so a long cache is safe.
        ctx.Context.Response.Headers.CacheControl = "public,max-age=31536000,immutable";
        ctx.Context.Response.Headers.XContentTypeOptions = "nosniff";
    },
});

app.UseCors("site");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

await app.Services.InitialiseDatabaseAsync();

app.Run();

/// <summary>Exposed so the integration tests can drive the real pipeline.</summary>
public partial class Program;
