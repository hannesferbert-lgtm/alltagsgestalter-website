<?php
/**
 * Spam-Proxy vor der Google-Apps-Script-Formularanbindung
 * =======================================================
 *
 * Das Frontend (assets/app.js, Konstante CONTACT_ENDPOINT) sendet die
 * Formulardaten NICHT mehr direkt an Google, sondern an diese Datei.
 * Sie
 *   - akzeptiert nur POST-Requests von der eigenen Domain
 *   - validiert die Pflichtfelder serverseitig
 *   - prueft das Honeypot-Feld "company"
 *   - begrenzt die Anfragen pro IP (dateibasiertes Rate-Limit)
 *   - entschaerft fuehrende Formel-Zeichen in Freitextfeldern
 *   - leitet gueltige Anfragen per HTTPS an die Apps-Script-Web-App weiter
 *   - gibt deren Antwort im Format {ok: true/false, ...} ans Frontend zurueck
 *
 * Ziel-URL & Einstellungen kommen aus einer Konfigurationsdatei AUSSERHALB
 * des Webroots (siehe api/config.example.php). Diese Datei enthaelt selbst
 * keine Geheimnisse.
 *
 * Live-Pfad (Repo-Root wird zu public_html): public_html/api/send-to-apps-script.php
 */

declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', '0');

// Alles abfangen, was eine include-Datei o. Ae. versehentlich ausgibt,
// damit die JSON-Antwort/Header sauber bleiben.
ob_start();

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------

/** JSON-Antwort senden und beenden. */
function respond(int $status, array $data): void
{
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    if (!empty($GLOBALS['__ag_allow_origin'])) {
        header('Access-Control-Allow-Origin: ' . $GLOBALS['__ag_allow_origin']);
        header('Vary: Origin');
    }
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** Konfigurationsdatei ausserhalb des Webroots suchen und laden. */
function load_config(): array
{
    // __DIR__ = <webroot>/api  ->  dirname(__DIR__, 2) = eine Ebene UEBER dem Webroot
    $candidates = array_filter([
        getenv('AG_FORM_CONFIG') ?: null,
        isset($_SERVER['DOCUMENT_ROOT']) ? dirname((string) $_SERVER['DOCUMENT_ROOT']) . '/ag-form-config.php' : null,
        dirname(__DIR__, 2) . '/ag-form-config.php',
        dirname(__DIR__, 3) . '/private/ag-form-config.php',
    ]);

    foreach ($candidates as $path) {
        if (is_string($path) && $path !== '' && is_file($path) && is_readable($path)) {
            /** @noinspection PhpIncludeInspection */
            $loaded = require $path;
            if (is_array($loaded)) {
                return $loaded;
            }
        }
    }
    return [];
}

/** Origin/Referer gegen die Allowlist pruefen. Gibt den erlaubten Origin zurueck oder null. */
function check_origin(array $allowed): ?string
{
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? trim((string) $_SERVER['HTTP_ORIGIN']) : '';
    if ($origin !== '') {
        return in_array($origin, $allowed, true) ? $origin : null;
    }
    // Kein Origin-Header (bei manchen same-origin-POSTs) -> Referer-Host pruefen
    $referer = isset($_SERVER['HTTP_REFERER']) ? (string) $_SERVER['HTTP_REFERER'] : '';
    if ($referer !== '') {
        $p = parse_url($referer);
        if (!empty($p['scheme']) && !empty($p['host'])) {
            $refOrigin = strtolower($p['scheme'] . '://' . $p['host']);
            return in_array($refOrigin, $allowed, true) ? $refOrigin : null;
        }
    }
    return null;
}

/** Einfaches dateibasiertes Rate-Limit pro IP. */
function rate_limit_ok(string $dir, int $max, int $window): bool
{
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    if (!is_dir($dir) || !is_writable($dir)) {
        // Kein Speicher -> lieber durchlassen als das Formular ganz blockieren.
        return true;
    }
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
    $file = $dir . '/' . hash('sha256', $ip) . '.json';
    $now = time();

    $hits = [];
    if (is_file($file)) {
        $raw = @file_get_contents($file);
        $decoded = $raw ? json_decode($raw, true) : null;
        if (is_array($decoded)) {
            $hits = $decoded;
        }
    }
    $hits = array_values(array_filter($hits, static function ($t) use ($now, $window) {
        return is_int($t) && $t > $now - $window;
    }));

    if (count($hits) >= $max) {
        return false;
    }
    $hits[] = $now;
    @file_put_contents($file, json_encode($hits), LOCK_EX);

    // Gelegentlich alte Zaehler-Dateien aufraeumen (1 von ~20 Requests).
    if (mt_rand(1, 20) === 1) {
        foreach (glob($dir . '/*.json') ?: [] as $old) {
            if (@filemtime($old) < $now - max($window * 4, 3600)) {
                @unlink($old);
            }
        }
    }
    return true;
}

/**
 * Fuehrende Formel-Zeichen in Freitext entschaerfen (CSV-/Formula-Injection).
 * Ein vorangestelltes Leerzeichen sorgt dafuer, dass Tabellen den Wert als
 * Text und nicht als Formel interpretieren.
 */
function defang_formula(string $value): string
{
    $head = ltrim($value);
    if ($head !== '' && strpbrk($head[0], "=+-@\t\r") !== false) {
        return ' ' . $value;
    }
    return $value;
}

/** POST-Request mit JSON-Body an die Apps-Script-URL. cURL mit file_get_contents-Fallback. */
function forward_json(string $url, string $payload): array
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Accept: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true, // Apps Script antwortet mit 302 auf googleusercontent.com
            CURLOPT_MAXREDIRS      => 5,
            CURLOPT_CONNECTTIMEOUT => 8,
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_USERAGENT      => 'AG-Form-Proxy/1.0',
        ]);
        $body   = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $err    = curl_error($ch);
        curl_close($ch);
        return [is_string($body) ? $body : null, $status, $err !== '' ? $err : null];
    }

    // Fallback ohne cURL-Erweiterung
    $ctx = stream_context_create(['http' => [
        'method'        => 'POST',
        'header'        => "Content-Type: application/json\r\nAccept: application/json\r\n",
        'content'       => $payload,
        'timeout'       => 15,
        'ignore_errors' => true,
        'follow_location' => 1,
    ]]);
    $body = @file_get_contents($url, false, $ctx);
    $status = 0;
    if (isset($http_response_header) && is_array($http_response_header)) {
        foreach ($http_response_header as $line) {
            if (preg_match('#^HTTP/\S+\s+(\d{3})#', $line, $m)) {
                $status = (int) $m[1];
            }
        }
    }
    return [is_string($body) ? $body : null, $status, $body === false ? 'request failed' : null];
}

// ---------------------------------------------------------------------------
// Ablauf
// ---------------------------------------------------------------------------

try {
    $config = load_config();

    $appsScriptUrl = (string) ($config['apps_script_url'] ?? '');
    $allowedOrigins = array_values(array_filter((array) ($config['allowed_origins'] ?? []), 'is_string'));
    $rlMax    = (int) ($config['rate_limit']['max'] ?? 8);
    $rlWindow = (int) ($config['rate_limit']['window'] ?? 600);
    $rlDir    = (string) ($config['rate_dir'] ?? '') ?: (sys_get_temp_dir() . '/ag-form-ratelimit');

    // Ohne Konfigurationsdatei (Ziel-URL + Allowlist) kann der Proxy nichts tun.
    if ($appsScriptUrl === '' || $allowedOrigins === []) {
        respond(500, ['ok' => false, 'error' => 'Der Server ist noch nicht vollständig konfiguriert.']);
    }

    // --- 1. Methode -------------------------------------------------------
    $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
    if ($method === 'OPTIONS') {
        // Preflight (nur relevant, falls das Formular je cross-origin liegt)
        $allow = check_origin($allowedOrigins);
        if ($allow) {
            $GLOBALS['__ag_allow_origin'] = $allow;
            header('Access-Control-Allow-Methods: POST, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type');
            header('Access-Control-Max-Age: 600');
        }
        http_response_code(204);
        exit;
    }
    if ($method !== 'POST') {
        respond(405, ['ok' => false, 'error' => 'Nur POST-Anfragen werden angenommen.']);
    }

    // --- 2. Herkunft ----------------------------------------------------
    $allow = check_origin($allowedOrigins);
    if ($allow === null) {
        respond(403, ['ok' => false, 'error' => 'Anfrage von einer nicht zugelassenen Herkunft.']);
    }
    $GLOBALS['__ag_allow_origin'] = $allow;

    // --- 3. Rate-Limit -------------------------------------------------
    if (!rate_limit_ok($rlDir, $rlMax, $rlWindow)) {
        respond(429, ['ok' => false, 'error' => 'Zu viele Anfragen. Bitte versuchen Sie es in einigen Minuten erneut.']);
    }

    // --- 4. Body lesen ------------------------------------------------
    $raw = file_get_contents('php://input');
    if (!is_string($raw) || $raw === '' || strlen($raw) > 20000) {
        respond(400, ['ok' => false, 'error' => 'Ungültige oder zu große Anfrage.']);
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        respond(400, ['ok' => false, 'error' => 'Die Daten konnten nicht gelesen werden.']);
    }

    // --- 5. Honeypot -------------------------------------------------
    // "company" ist im Formular unsichtbar. Ausgefuellt = Bot -> Erfolg
    // vortaeuschen, aber nichts weiterleiten.
    if (isset($data['company']) && trim((string) $data['company']) !== '') {
        respond(200, ['ok' => true]);
    }

    // --- 6. Serverseitige Validierung -------------------------------
    $nachname = trim((string) ($data['nachname'] ?? ''));
    $email    = trim((string) ($data['email'] ?? ''));
    $telefon  = trim((string) ($data['telefon'] ?? ''));

    $errors = [];
    if ($nachname === '') {
        $errors[] = 'Bitte geben Sie Ihren Nachnamen an.';
    }
    if ($email === '' && $telefon === '') {
        $errors[] = 'Bitte hinterlassen Sie eine E-Mail-Adresse oder Telefonnummer.';
    }
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Die E-Mail-Adresse ist ungültig.';
    }
    if ($errors) {
        respond(422, ['ok' => false, 'error' => implode(' ', $errors)]);
    }

    // --- 7. Weiterzuleitende Daten aufbereiten ---------------------
    $cut = static function (string $s): string {
        return function_exists('mb_substr') ? mb_substr($s, 0, 5000) : substr($s, 0, 5000);
    };
    $forward = [];
    foreach ($data as $key => $value) {
        if (is_string($value)) {
            $forward[$key] = defang_formula($cut($value));
        } elseif (is_int($value) || is_float($value) || is_bool($value) || $value === null) {
            $forward[$key] = $value;
        }
        // Arrays/verschachtelte Objekte werden verworfen
    }
    unset($forward['company']); // Honeypot nicht weiterreichen

    // --- 8. Ziel-URL plausibel? -----------------------------------
    if (strpos($appsScriptUrl, 'https://script.google.com/') !== 0) {
        respond(500, ['ok' => false, 'error' => 'Die Ziel-URL in der Konfiguration ist ungültig.']);
    }

    // --- 9. Weiterleiten ----------------------------------------
    $payload = json_encode($forward, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($payload === false) {
        respond(400, ['ok' => false, 'error' => 'Die Daten konnten nicht verarbeitet werden.']);
    }

    [$body, $status, $curlErr] = forward_json($appsScriptUrl, $payload);

    $upstream = is_string($body) ? json_decode($body, true) : null;
    if ($status >= 200 && $status < 400 && is_array($upstream)) {
        $s = strtolower((string) ($upstream['status'] ?? $upstream['result'] ?? ''));
        $isOk = (($upstream['ok'] ?? null) === true) || $s === 'success' || $s === 'ok';
        $upstream['ok'] = $isOk;
        respond($isOk ? 200 : 502, $upstream);
    }

    respond(502, [
        'ok'    => false,
        'error' => 'Die Anfrage konnte gerade nicht zugestellt werden. Bitte später erneut versuchen.',
    ]);

} catch (\Throwable $e) {
    respond(500, ['ok' => false, 'error' => 'Interner Fehler bei der Verarbeitung.']);
}
