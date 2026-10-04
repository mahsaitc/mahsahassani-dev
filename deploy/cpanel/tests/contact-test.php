<?php
/**
 * Header-injection and validation tests for contact.php.
 *
 * Self-contained (starts php -S with sendmail-capture.php as sendmail):
 *
 *   docker run --rm -v "${PWD}/deploy/cpanel:/app:ro" php:8.3-cli php /app/tests/contact-test.php
 *
 * Against a running Apache whose php.ini routes mail() to sendmail-capture.php
 * (see "Contact form tests" in DEPLOY-CPANEL.md):
 *
 *   php contact-test.php --url=http://127.0.0.1/contact.php --capture=/tmp/mail
 *
 * --verbose prints the header block of every captured message.
 * Exit code 0 means every case passed.
 */

declare(strict_types=1);

$opts = getopt('', ['url:', 'capture:', 'verbose']);
$verbose = isset($opts['verbose']);
$server = null;

if (isset($opts['url'])) {
    $url = $opts['url'];
    $capture = $opts['capture'] ?? null;
    if ($capture === null) {
        fwrite(STDERR, "--url needs --capture=<dir that sendmail-capture.php writes to>\n");
        exit(2);
    }
} else {
    $tmp = sys_get_temp_dir() . '/contact-test-' . getmypid();
    $capture = "$tmp/mail";
    mkdir($capture, 0777, true);
    // High rate limit: these cases are about content, not throttling.
    file_put_contents("$tmp/config.php", '<?php return ' . var_export([
        'to' => 'inbox@example.com',
        'from' => 'contact@example.com',
        'from_name' => 'Portfolio',
        'rate_limit_max' => 1000,
        'rate_limit_dir' => $tmp,
    ], true) . ';');

    $port = 8099;
    $server = proc_open(
        [PHP_BINARY, '-d', 'sendmail_path=' . PHP_BINARY . ' ' . __DIR__ . "/sendmail-capture.php $capture",
            '-S', "127.0.0.1:$port", '-t', dirname(__DIR__)],
        [1 => ['file', '/dev/null', 'w'], 2 => ['file', '/dev/null', 'w']],
        $pipes,
        null,
        ['CONTACT_CONFIG' => "$tmp/config.php"] + getenv(),
    );
    for ($i = 0; $i < 50 && !@fsockopen('127.0.0.1', $port); $i++) usleep(100_000);
    $url = "http://127.0.0.1:$port/contact.php";
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** @return array{int, string} status and body */
function request(string $url, string $body, string $method = 'POST'): array
{
    $ctx = stream_context_create(['http' => [
        'method' => $method,
        // X-Forwarded-Proto skips the .htaccess HTTPS redirect on local Apache.
        'header' => "Content-Type: application/json\r\nX-Forwarded-Proto: https",
        'content' => $body,
        'ignore_errors' => true,
        'follow_location' => 0,
    ]]);
    $res = @file_get_contents($url, false, $ctx);
    preg_match('#^HTTP/\S+ (\d{3})#', $http_response_header[0] ?? '', $m);
    return [(int) ($m[1] ?? 0), (string) $res];
}

/** Captured messages since the last call, removed as they are read. */
function takeMail(string $dir): array
{
    $out = [];
    foreach (glob("$dir/mail-*.json") ?: [] as $file) {
        $out[] = json_decode((string) file_get_contents($file), true);
        unlink($file);
    }
    return $out;
}

/**
 * Everything wrong with a captured message's header block. Splits on ANY line
 * break (CRLF, bare LF, bare CR), since some MTAs honour all three.
 */
function headerProblems(array $mail): array
{
    $head = preg_split('/\r?\n\r?\n/', $mail['raw'], 2)[0];
    $allowed = ['to', 'subject', 'from', 'reply-to', 'mime-version',
        'content-type', 'content-transfer-encoding', 'x-mailer'];
    $values = [];
    $problems = [];
    $current = null;

    foreach (preg_split('/\r\n|\r|\n/', $head) as $line) {
        if ($line === '') {
            $problems[] = 'blank line inside header block';
        } elseif (preg_match('/^[ \t]/', $line) && $current !== null) {
            $values[$current] .= ' ' . trim($line); // folded continuation
        } elseif (preg_match('/^([!-9;-~]+):\s*(.*)$/', $line, $m)) {
            $current = strtolower($m[1]);
            if (!in_array($current, $allowed, true)) $problems[] = "unexpected header {$m[1]}";
            if (isset($values[$current])) $problems[] = "duplicate header {$m[1]}";
            $values[$current] = $m[2];
        } else {
            $problems[] = 'not a header line: ' . json_encode($line);
        }
    }
    foreach ($allowed as $name) {
        if (!isset($values[$name])) $problems[] = "missing header $name";
    }

    // Exactly one address in To and Reply-To, display name quoted or encoded.
    $addr = '<[^<>"\s,;]+@[^<>"\s,;]+>';
    $displayName = '("[^"\\\\]*"|=\?UTF-8\?B\?[A-Za-z0-9+\/=]+\?=( =\?UTF-8\?B\?[A-Za-z0-9+\/=]+\?=)*)';
    if (isset($values['reply-to']) && !preg_match("/^$displayName $addr$/", $values['reply-to'])) {
        $problems[] = 'Reply-To is not a single address: ' . json_encode($values['reply-to']);
    }
    if (isset($values['to']) && !preg_match('/^[^<>"\s,;]+@[^<>"\s,;]+$/', $values['to'])) {
        $problems[] = 'To is not a single address: ' . json_encode($values['to']);
    }
    if (count($mail['argv']) !== 1 || !preg_match('/^-f[^\s]+@[^\s]+$/', $mail['argv'][0] ?? '')) {
        $problems[] = 'unexpected sendmail arguments: ' . json_encode($mail['argv']);
    }
    return $problems;
}

// ── Cases ───────────────────────────────────────────────────────────────────

$valid = [
    'name' => 'Test Visitor',
    'email' => 'visitor@example.org',
    'subject' => 'Hello there',
    'message' => 'This message is long enough to pass validation.',
];
$with = fn (array $over) => json_encode($over + $valid);

// expect: 'sent' = 200 + one clean mail; 'rejected:NNN' = that status, no mail;
// 'safe' = injection attempt: either 422 with no mail, or 200 with one clean mail;
// 'dropped' = 200 but no mail (honeypot).
$cases = [
    ['baseline valid message', $with([]), 'sent'],

    ['name: CRLF + Bcc', $with(['name' => "x\r\nBcc: a@b.c"]), 'safe'],
    ['name: LF + Bcc', $with(['name' => "x\nBcc: a@b.c"]), 'safe'],
    ['name: bare CR + Bcc', $with(['name' => "x\rBcc: a@b.c"]), 'safe'],
    ['name: CRLFCRLF + body', $with(['name' => "x\r\n\r\nInjected body"]), 'safe'],
    ['name: U+2028 + Bcc', $with(['name' => "x\u{2028}Bcc: a@b.c"]), 'safe'],
    ['name: U+0085 (NEL) + Bcc', $with(['name' => "x\u{0085}Bcc: a@b.c"]), 'safe'],
    ['name: NUL + tab', $with(['name' => "x\0y\tz"]), 'safe'],
    ['name: quote breakout', $with(['name' => 'x" <evil@x.com>, "y']), 'safe'],
    ['name: non-ASCII + CRLF + Bcc', $with(['name' => "مهسا\r\nBcc: a@b.c"]), 'safe'],

    ['subject: CRLF + Bcc', $with(['subject' => "Hi\r\nBcc: a@b.c"]), 'safe'],
    ['subject: LF + Cc', $with(['subject' => "Hi\nCc: a@b.c"]), 'safe'],
    ['subject: CRLFCRLF + body', $with(['subject' => "Hi\r\n\r\nInjected body"]), 'safe'],
    ['subject: non-ASCII + CRLF + Bcc', $with(['subject' => "سلام\r\nBcc: a@b.c"]), 'safe'],
    ['subject: 120 chars + CRLF', $with(['subject' => str_repeat('a', 60) . "\r\nBcc: a@b.c" . str_repeat('b', 47)]), 'safe'],

    ['email: CRLF + Bcc', $with(['email' => "a@b.co\r\nBcc: x@y.z"]), 'rejected:422'],
    ['email: LF + Bcc', $with(['email' => "a@b.co\nBcc: x@y.z"]), 'rejected:422'],
    ['email: trailing CRLF', $with(['email' => "visitor@example.org\r\n"]), 'safe'],
    ['email: quoted local, escaped CRLF', $with(['email' => "\"x\\\r\\\nBcc:\\ a@b.c\"@example.com"]), 'safe'],
    ['email: quoted local with >,', $with(['email' => '"a>,evil@x.com"@example.com']), 'safe'],
    ['email: two addresses', $with(['email' => 'a@b.co,evil@x.com']), 'rejected:422'],
    ['email: encoded %0A', $with(['email' => 'a@b.co%0ABcc:x@y.z']), 'rejected:422'],

    ['email: apostrophe (valid)', $with(['email' => "o'brien@example.org"]), 'sent'],

    ['message: Bcc line and lone dot', $with(['message' => "Hello there, long text\r\nBcc: a@b.c\r\n.\r\nmore"]), 'sent'],
    ['message: NUL byte', $with(['message' => "Hello there, long text\0 with a NUL"]), 'sent'],

    ['invalid email', $with(['email' => 'not-an-email']), 'rejected:422'],
    ['name 81 chars', $with(['name' => str_repeat('a', 81)]), 'rejected:422'],
    ['name 81 multibyte chars', $with(['name' => str_repeat('م', 81)]), 'rejected:422'],
    ['email over 160 chars', $with(['email' => str_repeat('a', 60) . '@' . str_repeat('b', 50) . '.' . str_repeat('c', 50) . '.com']), 'rejected:422'],
    ['subject 121 chars', $with(['subject' => str_repeat('s', 121)]), 'rejected:422'],
    ['message 4001 chars', $with(['message' => str_repeat('m', 4001)]), 'rejected:422'],
    ['body over 32 KB', $with(['message' => str_repeat('m', 40000)]), 'rejected:400'],
    ['malformed JSON', '{"name":', 'rejected:400'],
    ['name sent as array', $with(['name' => ['x', "\r\nBcc: a@b.c"]]), 'rejected:422'],

    ['honeypot filled', $with(['company' => 'Acme']), 'dropped'],
    ['honeypot filled + injected name', $with(['company' => 'Acme', 'name' => "x\r\nBcc: a@b.c"]), 'dropped'],
];

// ── Run ─────────────────────────────────────────────────────────────────────

$failed = 0;
takeMail($capture);

[$status] = request($url, '', 'GET');
$ok = $status === 405;
$failed += $ok ? 0 : 1;
printf("%s  %-36s %d\n", $ok ? 'PASS' : 'FAIL', 'GET is refused', $status);

foreach ($cases as [$label, $body, $expect]) {
    [$status, $response] = request($url, $body);
    $mails = takeMail($capture);
    $problems = [];

    foreach ($mails as $mail) $problems = [...$problems, ...headerProblems($mail)];

    if ($expect === 'sent' || ($expect === 'safe' && $status === 200)) {
        if ($status !== 200) $problems[] = "status $status";
        if (count($mails) !== 1) $problems[] = count($mails) . ' mails sent, expected 1';
    } elseif ($expect === 'safe') {
        if ($status !== 422) $problems[] = "status $status, expected 200 or 422";
        if ($mails) $problems[] = 'mail sent on rejection';
    } elseif ($expect === 'dropped') {
        if ($status !== 200) $problems[] = "status $status";
        if ($mails) $problems[] = 'honeypot message was mailed';
    } else {
        $want = (int) substr($expect, strlen('rejected:'));
        if ($status !== $want) $problems[] = "status $status, expected $want";
        if ($mails) $problems[] = 'mail sent on rejection';
    }

    $failed += $problems ? 1 : 0;
    printf("%s  %-36s %d, %d mail%s\n", $problems ? 'FAIL' : 'PASS', $label, $status, count($mails), $problems ? '  -> ' . implode('; ', $problems) : '');
    if ($verbose) {
        foreach ($mails as $mail) {
            // Line breaks shown as \r / \n so a smuggled one is visible.
            $head = preg_split('/\r?\n\r?\n/', $mail['raw'], 2)[0];
            echo '      ' . str_replace("\\n", "\\n\n      ", addcslashes($head, "\r\n\0")) . "\n";
        }
        if ($status !== 200) echo "      response: $response\n";
    }
}

if ($server) {
    proc_terminate($server);
    array_map('unlink', array_filter(glob("$tmp/{,mail/}*", GLOB_BRACE) ?: [], 'is_file'));
    @rmdir($capture);
    @rmdir($tmp);
}

printf("\n%d/%d passed\n", count($cases) + 1 - $failed, count($cases) + 1);
exit($failed ? 1 : 0);
