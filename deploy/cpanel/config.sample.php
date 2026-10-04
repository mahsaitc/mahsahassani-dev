<?php
/**
 * Contact form settings for contact.php.
 *
 * Copy to config.php in your cPanel HOME directory — the folder that CONTAINS
 * public_html, never inside it — and fill in real values:
 *
 *   /home/<cpanel-user>/config.php
 *   /home/<cpanel-user>/public_html/contact.php
 *
 * config.php is gitignored. Do not commit it.
 */
return [
    // Where messages are delivered.
    'to' => 'you@example.com',

    // Envelope and From address. Must be a mailbox on the site's own domain
    // (created in cPanel > Email Accounts) or SPF/DKIM will fail.
    'from' => 'contact@example.com',
    'from_name' => 'Portfolio',

    // Per-IP limit: at most rate_limit_max messages per rate_limit_window seconds.
    'rate_limit_window' => 60,
    'rate_limit_max' => 3,

    // Writable directory for the rate-limit file. /tmp is shared between
    // accounts on some hosts; a private folder such as
    // '/home/<cpanel-user>/tmp' is safer.
    // 'rate_limit_dir' => '/home/<cpanel-user>/tmp',
];
