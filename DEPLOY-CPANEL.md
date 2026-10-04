# Deploying to cPanel shared hosting

The public site (`/en`, `/fa`) as plain files for Apache + PHP. No Node, .NET
or Docker on the host. The admin dashboard and the API stay on your machine;
content is read from the local API at build time and frozen into HTML.

Any content change in the dashboard needs a rebuild and re-upload.

## 1. Build

1. Start the local API on port 5099 — either one:
   - `npm run api` (dev database), or
   - `docker compose up -d api` (Docker volume database).
2. Build with the real domain. `.env.local` points `NEXT_PUBLIC_SITE_URL` at a
   local server, so override it on the command line:

   ```powershell
   $env:NEXT_PUBLIC_SITE_URL = 'https://mahsahassani.dev'; npm run build:static
   ```

   ```bash
   NEXT_PUBLIC_SITE_URL=https://mahsahassani.dev npm run build:static
   ```

The build fails, deliberately, if:

- any API request fails (`STRICT_API=1`) — start the API and retry;
- the sitemap still points at localhost — set `NEXT_PUBLIC_SITE_URL`;
- an exported page still references the API origin, or an upload cannot be
  downloaded.

Output is `out/`. Only uploads referenced by published content are copied into
`out/uploads/`.

`build:static` reuses `.next/` as its working directory (Next does this for every
static export). Do not run it while `npm run dev` is running, and run
`npm run build` again before `npm start`.

## 2. Upload

Upload the **contents** of `out/` into `public_html`, including the hidden
`.htaccess`. The simplest route: zip the contents of `out/`, upload the zip in
File Manager, extract it in `public_html`, delete the zip. With FTP, turn on
"show hidden files" so `.htaccess` is sent.

On redeploys, old `_next/static` chunks can be deleted first; leaving them is
harmless.

## 3. Contact form config

`contact.php` reads its settings from `config.php` in your **home directory**,
one level above `public_html`:

```
/home/<cpanel-user>/config.php          <- your copy, real values
/home/<cpanel-user>/public_html/contact.php
```

Copy `deploy/cpanel/config.sample.php` to that location as `config.php`, fill in
`to` and `from`, and set permissions to `600`. Never put it inside
`public_html` and never commit it (it is gitignored).

`from` must be a mailbox on the site's own domain — create it under
cPanel > Email Accounts.

## 4. Mail deliverability

`mail()` sends through the host's sendmail with the envelope sender set to
`from`. To stay out of spam:

- cPanel > **Email Deliverability**: make SPF and DKIM show "Valid"; use
  "Repair" if not. If DNS is hosted elsewhere (e.g. Cloudflare), copy the
  records cPanel shows into that DNS.
- Add a DMARC record, e.g. `_dmarc  TXT  "v=DMARC1; p=none; rua=mailto:<you>"`.
- Send a test message from the live form and check the headers for
  `spf=pass` and `dkim=pass`.

## 5. Ask the host before going live

- **AutoSSL** is active for both `mahsahassani.dev` and `www.mahsahassani.dev`.
  `.htaccess` forces HTTPS and sends HSTS, so a broken certificate locks
  visitors out.
- **.htaccess** overrides are allowed for `mod_rewrite` and `mod_headers`, on
  Apache 2.4. If the server is LiteSpeed rather than Apache, check that the
  `<If>` block and the `expr=` header conditions are honoured (verify
  response headers after upload).
- **mail()** is enabled (not in `disable_functions`), and the hourly outgoing
  mail limit.
- **PHP 7.4 or newer** (8.x preferred) with the `mbstring` extension.

## 6. Check after upload

- `https://<domain>/` redirects to `/fa/` or `/en/` by browser language.
- A post, a project page and an uploaded project image load.
- `https://<domain>/nope/` shows the site's 404 page.
- `/sitemap.xml` and `/robots.txt` use the real domain.
- The contact form sends a message, and a second message within a minute from
  the same visitor still works (limit: 3 per minute).

## Local preview with Apache + PHP

`php -S` ignores `.htaccess`, so preview with the official image instead
(PowerShell; adjust paths). The header skips the HTTPS redirect locally:

```powershell
docker run --rm -p 127.0.0.1:8090:80 `
  -v "${PWD}/out:/var/www/html:ro" `
  -v "${PWD}/deploy/cpanel/config.php:/var/www/config.php:ro" `
  php:8.3-apache bash -c "a2enmod rewrite headers deflate && sed -i 's/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf && apache2-foreground"

curl -H "X-Forwarded-Proto: https" http://127.0.0.1:8090/en/
```

The image has no sendmail, so a valid contact message returns 502 there.

## Returning to the Docker / VPS version

Nothing on this branch changes the server build: `npm run build`, `npm run dev`
and `docker compose up -d --build` work as before. To go back to the exact
pre-static version:

```bash
git switch main            # or: git switch --detach v1-docker-vps
docker compose up -d --build
```
