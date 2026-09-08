<?php
/**
 * BEISPIEL-Konfiguration für api/send-to-apps-script.php
 * =====================================================
 *
 * Diese Datei enthält NUR Platzhalter und darf im Repo bleiben.
 *
 * Die ECHTE Konfiguration mit der echten Apps-Script-URL gehört NICHT
 * ins Repo und NICHT in den Webroot (public_html), damit sie nie über
 * den Browser abrufbar ist.
 *
 * So richtest du sie ein:
 *
 *   1. Diese Datei kopieren und in  ag-form-config.php  umbenennen.
 *
 *   2. Die Kopie auf dem Server EINE EBENE ÜBER public_html ablegen.
 *      Auf Hostinger sieht die Struktur typischerweise so aus:
 *
 *         /home/<user>/domains/die-alltagsgestalter.de/
 *         ├── public_html/            <-- Webroot (= Inhalt dieses Repos)
 *         │   └── api/send-to-apps-script.php
 *         └── ag-form-config.php      <-- HIER ablegen (Browser kommt nicht ran)
 *
 *      Der Proxy sucht die Datei automatisch an diesen Stellen (erste
 *      gefundene gewinnt):
 *         a) Pfad aus der Umgebungsvariable  AG_FORM_CONFIG
 *         b) <eine Ebene über public_html>/ag-form-config.php
 *         c) <zwei Ebenen über public_html>/private/ag-form-config.php
 *
 *   3. In der Kopie die Werte unten eintragen (v. a. 'apps_script_url').
 *
 *   4. Dateirechte prüfen:  chmod 640 ag-form-config.php  (oder 600).
 *      Der Ordner darüber sollte kein Directory-Listing erlauben.
 */

return [

    // Deploy-URL der Google-Apps-Script-Web-App. Endet auf /exec.
    // (Apps Script → Bereitstellen → Web-App → URL kopieren.)
    'apps_script_url' => 'https://script.google.com/macros/s/PASTE_DEPLOYMENT_ID_HIER/exec',

    // Nur POST-Requests von diesen Origins werden angenommen.
    // Format: scheme://host  (KEIN Slash am Ende, KEIN Pfad).
    'allowed_origins' => [
        'https://die-alltagsgestalter.de',
        'https://www.die-alltagsgestalter.de',
        // Zum lokalen Testen ggf. voruebergehend ergaenzen:
        // 'http://localhost:4599',
    ],

    // Rate-Limit pro IP-Adresse: höchstens 'max' Anfragen pro 'window' Sekunden.
    'rate_limit' => [
        'max'    => 8,
        'window' => 600, // 10 Minuten
    ],

    // Verzeichnis für die dateibasierten Rate-Limit-Zähler.
    // null  => System-Temp-Verzeichnis (sys_get_temp_dir()).
    // Besser: ein eigener, beschreibbarer Ordner AUSSERHALB von public_html,
    // z. B. dirname(__DIR__) . '/ag-form-ratelimit'
    'rate_dir' => null,
];
