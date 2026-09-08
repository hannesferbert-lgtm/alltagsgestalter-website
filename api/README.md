# PHP-Spam-Proxy vor der Apps-Script-Formularanbindung

Das Frontend sendet die Kontakt-/Event-Anmeldedaten an
`api/send-to-apps-script.php` (Konstante `CONTACT_ENDPOINT` in
`assets/app.js`). Der Proxy prüft die Anfrage und leitet sie erst dann
serverseitig an die Google-Apps-Script-Web-App weiter. Google bleibt das
Zielsystem – es wird nur ein Filter davor geschaltet.

## Ablauf im Proxy

1. **Methode** – nur `POST` (OPTIONS wird für den Preflight-Fall beantwortet).
2. **Herkunft** – `Origin` bzw. ersatzweise `Referer` muss in
   `allowed_origins` stehen, sonst `403`.
3. **Rate-Limit** – max. 8 Anfragen pro IP in 10 Minuten (dateibasiert),
   sonst `429`. Werte in der Config änderbar.
4. **Body** – JSON, max. 20 KB.
5. **Honeypot** – ist das unsichtbare Feld `company` gefüllt, wird `200
   {ok:true}` zurückgegeben, aber **nichts** weitergeleitet.
6. **Validierung** – `nachname` Pflicht, `email` **oder** `telefon` Pflicht,
   `email` (falls gesetzt) muss ein gültiges Format haben, sonst `422`.
7. **Formel-Injection** – Freitextwerte, die mit `= + - @` (oder Tab/CR)
   beginnen, bekommen ein führendes Leerzeichen, damit Tabellen sie als
   Text behandeln.
8. **Weiterleitung** – geprüfte Daten per cURL (Fallback:
   `file_get_contents`) an `apps_script_url`. Die Antwort wird auf
   `{ok: true|false, ...}` normalisiert und ans Frontend zurückgegeben.

## Konfiguration (NICHT im Repo, NICHT im Webroot)

Siehe [`config.example.php`](./config.example.php). Kurzfassung:

1. `config.example.php` → als **`ag-form-config.php`** kopieren.
2. Kopie **eine Ebene über `public_html`** ablegen, z. B. auf Hostinger:
   `/home/<user>/domains/die-alltagsgestalter.de/ag-form-config.php`.
3. `apps_script_url` (endet auf `/exec`) eintragen.
4. Rechte setzen: `chmod 640 ag-form-config.php`.

Der Proxy sucht die Datei in dieser Reihenfolge:

| Priorität | Ort |
|---|---|
| 1 | Pfad aus Umgebungsvariable `AG_FORM_CONFIG` |
| 2 | `<eine Ebene über public_html>/ag-form-config.php` |
| 3 | `<zwei Ebenen über public_html>/private/ag-form-config.php` |

Fehlt die Datei oder die URL, antwortet der Proxy mit `500` und das
Frontend zeigt seinen `mailto:`-Fallback.

## Manuelle Schritte nach dem Deploy

- [ ] `ag-form-config.php` mit echter `/exec`-URL über `public_html` ablegen
- [ ] Prüfen, dass `https://die-alltagsgestalter.de/ag-form-config.php` **404**
      liefert (Datei liegt außerhalb des Webroots)
- [ ] `https://die-alltagsgestalter.de/api/config.example.php` sollte durch
      `api/.htaccess` **403** liefern
- [ ] Schreibrechte fürs Rate-Limit-Verzeichnis prüfen (Standard:
      System-Temp; alternativ eigener Ordner via `rate_dir`)
- [ ] Testabsendung über das Formular → Zeile im Google Sheet + Mail
