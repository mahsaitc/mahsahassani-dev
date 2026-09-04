using MahsaSite.Application.Abstractions;
using Microsoft.AspNetCore.Mvc;

namespace MahsaSite.Api.Infrastructure;

/// <summary>
/// Turns known failures into clean ProblemDetails and keeps anything unexpected
/// from leaking a stack trace to the dashboard.
/// </summary>
public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (UploadRejectedException ex)
        {
            // Caller error, and the message is written to be shown in the form.
            logger.LogInformation("Upload rejected: {Reason}", ex.Message);
            await WriteAsync(context, StatusCodes.Status400BadRequest, "Upload rejected", ex.Message);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception on {Method} {Path}", context.Request.Method, context.Request.Path);
            await WriteAsync(context, StatusCodes.Status500InternalServerError,
                "Something went wrong", "The request could not be completed. The error has been logged.");
        }
    }

    private static async Task WriteAsync(HttpContext context, int status, string title, string detail)
    {
        if (context.Response.HasStarted) return;

        context.Response.Clear();
        context.Response.StatusCode = status;
        context.Response.ContentType = "application/problem+json";

        await context.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = detail,
        });
    }
}
