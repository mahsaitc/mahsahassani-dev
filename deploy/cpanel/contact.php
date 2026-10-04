<?php
/**
 * Contact form endpoint for the static cPanel build.
 *
 * PHP port of src/app/api/contact/route.dyn.ts: same limits as
 * src/lib/validation.ts, same honeypot rule, same JSON responses, so the
 * React form behaves identically on both builds. Mail goes out through PHP
 * mail(), i.e. the host's sendmail.
 *
 * Recipient and sender live in config.php OUTSIDE public_html (see
 * config.sample.php and DEPLOY-CPANEL.md). Nothing secret is in this file.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, ['error' => 'Method not allowed.']);
}

// ── Config ──────────────────────────────────────────────────────────────────

$configPath = getenv('CONTACT_CONFIG') ?: dirname(__DIR__) . '/config.php';
$config = is_readable($configPath) ? require $configPath : null;

$to = is_array($config) ? (string) ($config['to'] ?? '') : '';
$from = is_array($config) ? (string) ($config['from'] ?? '') : '';

if (!filter_var($to, FILTER_VALIDATE_EMAIL) || !filter_var($from, FILTER_VALIDATE_EMAIL)) {
    error_log('[contact] config.php missing or invalid — message dropped.');
    respond(503, ['error' => 'Mail transport is not configured on this deployment.']);
}

$fromName = preg_replace('/[\r\n"]+/', ' ', (string) ($config['from_name'] ?? 'Portfolio'));
$windowSeconds = (int) ($config['rate_limit_window'] ?? 60);
$maxPerWindow = (int) ($config['rate_limit_max'] ?? 3);
$rateDir = (string) ($config['rate_limit_dir'] ?? sys_get_temp_dir());

// ── Rate limit ──────────────────────────────────────────────────────────────

/**
 * Per-IP sliding window kept in one JSON file under an exclusive lock.
 * REMOTE_ADDR only: X-Forwarded-For is client-controlled on a direct Apache
 * host. IPs are hashed so the file holds no addresses.
 */
function rateLimited(string $dir, int $window, int $max): bool
{
    $file = rtrim($dir, '/\\') . DIRECTORY_SEPARATOR . 'mahsa-contact-ratelimit.json';
    $handle = @fopen($file, 'c+');
    if ($handle === false) {
        // An unwritable temp dir must not take the form down with it.
        error_log('[contact] rate-limit file unavailable: ' . $file);
        return false;
    }

    flock($handle, LOCK_EX);
    $raw = stream_get_contents($handle);
    $hits = json_decode($raw ?: '{}', true);
    if (!is_array($hits)) $hits = [];

    $now = time();
    $key = hash('sha256', $_SERVER['REMOTE_ADDR'] ?? 'unknown');

    // Drop expired entries so the file cannot grow without bound.
    foreach ($hits as $k => $times) {
        $hits[$k] = array_values(array_filter((array) $times, fn ($t) => $now - (int) $t < $window));
        if (!$hits[$k]) unset($hits[$k]);
    }

    $hits[$key][] = $now;
    $limited = count($hits[$key]) > $max;

    ftruncate($handle, 0);
    rewind($handle);
    fwrite($handle, json_encode($hits));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);

    return $limited;
}

if (rateLimited($rateDir, $windowSeconds, $maxPerWindow)) {
    respond(429, ['error' => 'Too many messages in a short window. Try again in a minute.']);
}

// ── Payload ─────────────────────────────────────────────────────────────────

// The longest valid payload is well under 32 KB; refuse anything larger unread.
$raw = file_get_contents('php://input', false, null, 0, 32768);
$payload = json_decode($raw === false ? '' : $raw, true);
if (!is_array($payload)) {
    respond(400, ['error' => 'Malformed request body.']);
}

// Control characters other than tab/CR/LF have no business in a form field,
// and mail() throws a ValueError on NUL, which would fatal after a 200.
$field = function (string $name) use ($payload): string {
    $value = $payload[$name] ?? '';
    return is_string($value)
        ? trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $value))
        : '';
};

$name = $field('name');
$email = $field('email');
$subject = $field('subject');
$message = $field('message');
// Honeypot. Deliberately not trimmed-and-validated: see validation.ts.
$company = is_string($payload['company'] ?? null) ? $payload['company'] : '';

// ── Validation (mirrors src/lib/validation.ts) ─────────────────────────────

$issues = [];
$len = fn (string $s) => mb_strlen($s, 'UTF-8');

if ($len($name) < 2) $issues['name'][] = 'Please enter your name.';
elseif ($len($name) > 80) $issues['name'][] = 'String must contain at most 80 character(s)';

// zod's .email() pattern on top of filter_var: filter_var also accepts quoted
// local parts ("a>,b@c"@d.com), which the Node route rejects.
$zodEmail = "/^(?!\\.)(?!.*\\.\\.)([A-Z0-9_'+\\-\\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\\-]*\\.)+[A-Z]{2,}$/i";
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !preg_match($zodEmail, $email)) $issues['email'][] = 'That does not look like an email address.';
elseif ($len($email) > 160) $issues['email'][] = 'String must contain at most 160 character(s)';

if ($len($subject) < 3) $issues['subject'][] = 'A short subject helps.';
elseif ($len($subject) > 120) $issues['subject'][] = 'String must contain at most 120 character(s)';

if ($len($message) < 20) $issues['message'][] = 'Twenty characters minimum — give me something to work with.';
elseif ($len($message) > 4000) $issues['message'][] = 'String must contain at most 4000 character(s)';

if ($issues) {
    respond(422, ['error' => 'Validation failed.', 'issues' => $issues]);
}

// Honeypot filled means a bot. Return 200 so it never learns it was caught.
if ($company !== '') {
    respond(200, ['ok' => true]);
}

// ── Send ────────────────────────────────────────────────────────────────────

/** Header values must never carry CR/LF — that is how header injection works. */
$oneLine = fn (string $s) => trim(preg_replace('/[\r\n]+/', ' ', $s));

$safeName = str_replace(['"', '\\'], ["'", ''], $oneLine($name));
$safeEmail = $oneLine($email);
$safeSubject = $oneLine($subject);

/**
 * Display name for an address header. Non-ASCII becomes an RFC 2047 encoded
 * word; ASCII is quoted so characters like ':' and '@' in a visitor's name
 * cannot be read as address syntax.
 */
$displayName = fn (string $s) => preg_match('/[^\x20-\x7E]/', $s)
    ? mb_encode_mimeheader($s, 'UTF-8', 'B')
    : '"' . $s . '"';

$headers = implode("\r\n", [
    'From: ' . $displayName($fromName) . " <{$from}>",
    'Reply-To: ' . $displayName($safeName) . " <{$safeEmail}>",
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: mahsahassani.dev contact form',
]);

$body = "From: {$safeName} <{$safeEmail}>\n\n{$message}\n";

// -f sets the envelope sender so SPF is checked against the site's own domain.
// $from passed FILTER_VALIDATE_EMAIL above, so it cannot smuggle extra flags.
try {
    $sent = @mail(
        $to,
        mb_encode_mimeheader('[Portfolio] ' . $safeSubject, 'UTF-8'),
        $body,
        $headers,
        '-f' . $from
    );
} catch (ValueError $e) {
    error_log('[contact] mail() refused its arguments: ' . $e->getMessage());
    $sent = false;
}

if (!$sent) {
    error_log('[contact] mail() returned false');
    respond(502, ['error' => 'The mail transport rejected the message.']);
}

respond(200, ['ok' => true]);
