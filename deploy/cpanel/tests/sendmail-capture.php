<?php
/**
 * Stand-in for sendmail in tests. Point PHP at it with
 *
 *   sendmail_path = "php /path/to/sendmail-capture.php <capture-dir>"
 *
 * and every mail() call leaves one JSON file in <capture-dir> holding the raw
 * message exactly as mail() built it, plus the extra arguments (-f ...).
 */

$dir = $argv[1] ?? sys_get_temp_dir();
$file = rtrim($dir, '/') . '/mail-' . bin2hex(random_bytes(6)) . '.json';

file_put_contents($file, json_encode([
    'argv' => array_slice($argv, 2),
    'raw' => stream_get_contents(STDIN),
]));
