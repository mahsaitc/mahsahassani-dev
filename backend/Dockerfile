# ASP.NET Core content API. Multi-stage: the SDK image restores and publishes,
# the runtime image carries only the published output.
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Project files first so the restore layer is cached until a dependency changes.
COPY MahsaSite.sln ./
COPY src/MahsaSite.Domain/MahsaSite.Domain.csproj src/MahsaSite.Domain/
COPY src/MahsaSite.Application/MahsaSite.Application.csproj src/MahsaSite.Application/
COPY src/MahsaSite.Infrastructure/MahsaSite.Infrastructure.csproj src/MahsaSite.Infrastructure/
COPY src/MahsaSite.Api/MahsaSite.Api.csproj src/MahsaSite.Api/
RUN dotnet restore src/MahsaSite.Api/MahsaSite.Api.csproj

COPY src/ src/
RUN dotnet publish src/MahsaSite.Api/MahsaSite.Api.csproj -c Release -o /app --no-restore /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# The database and uploads live under /data so a volume keeps them across
# rebuilds. Created here and owned by the image's non-root `app` user, so a
# fresh named volume inherits that ownership on first mount.
ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    ConnectionStrings__Default="Data Source=/data/mahsasite.db" \
    Storage__RootPath=/data/uploads
RUN mkdir -p /data/uploads && chown -R app:app /data

COPY --from=build /app .

USER app
VOLUME /data
EXPOSE 8080
ENTRYPOINT ["dotnet", "MahsaSite.Api.dll"]
