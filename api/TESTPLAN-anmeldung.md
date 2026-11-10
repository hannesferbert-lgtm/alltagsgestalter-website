# Testplan: Anmeldeformular Weihnachtsliedersingen

Vor dem Livegang (Merge von PR #3) einmal komplett durchgehen. Hostinger liefert nur `main` aus, einen separaten Test-Server gibt es nicht. Getestet wird deshalb direkt nach dem Merge mit einer klar markierten Testanmeldung, die danach gelöscht wird.

## 1. Konfiguration (einmalig)
- [ ] `api/config.example.php` kopieren, als `ag-form-config.php` eine Ebene ÜBER `public_html` ablegen (nicht ins Repo, nicht in den Webroot).
- [ ] `apps_script_url` mit der echten `/exec`-URL eintragen (Apps Script → Bereitstellen → Web-App).
- [ ] `allowed_origins` enthält `https://die-alltagsgestalter.de` und `https://www.die-alltagsgestalter.de`.
- [ ] Dateirechte `chmod 640 ag-form-config.php`.
- [ ] Aufräumen: `.mcptest.txt` im Webroot löschen.

## 2. Testanmeldung per Browser
- [ ] `https://die-alltagsgestalter.de/anmeldung-weihnachtsliedersingen` öffnen (Schloss-Symbol sichtbar).
- [ ] Ohne Einwilligung absenden: Meldung erscheint, nichts wird gesendet.
- [ ] Mit Nachname `TESTEINTRAG-BITTE-LOESCHEN`, eigener Telefonnummer, Pflegegrad, Zahlungsart und Einwilligung absenden.
- [ ] Erfolgsmeldung „Vielen Dank!“ erscheint.

## 3. Testanmeldung per Kommandozeile (optional)
```
curl -sS -X POST https://die-alltagsgestalter.de/api/send-to-apps-script.php \
  -H 'Origin: https://die-alltagsgestalter.de' \
  -d '{"anfrageTyp":"Event-Anmeldung","betreff":"TEST","vorname":"Test","nachname":"TESTEINTRAG-BITTE-LOESCHEN","telefon":"0000","email":"","eventName":"TEST","personen":"1","nachricht":"TEST","company":""}'
```
Erwartet: `{"ok":true}`. Mit gefülltem Feld `company` muss die Anfrage abgewiesen bzw. still verworfen werden (Honeypot).

## 4. Prüfen
- [ ] Neue Zeile im Sheet `Formular_Anmeldungen`, Typ `Event-Anmeldung`.
- [ ] Spalte „Nachricht“ enthält Pflegegrad, Zahlung, Einschränkungen und die Einwilligungszeile `2026-11-v1`.
- [ ] Benachrichtigungsmail an Hannes ist angekommen.
- [ ] Bei angegebener E-Mail: Bestätigungsmail enthält nur Veranstaltung, Name und Personenzahl, keine Gesundheitsangaben.
- [ ] Seite `/datenschutz` zeigt die neuen Abschnitte; Link aus dem Formular funktioniert.

## 5. Danach
- [ ] Testzeile im Sheet löschen.
- [ ] Link auf der Veranstaltungsseite freischalten (separater Patch).

## Datenschutz-Nachtrag (Version 2026-11-v2)

1. Apps-Script neu einfügen (apps-script/Code.gs), speichern, **Bereitstellen → Bereitstellungen verwalten → Bearbeiten → Neue Version**.
2. Einmalig `installTrigger` ausführen (täglich 03:00 Löschung der Gesundheitsangaben, 4 Wochen nach der Fahrt).
3. Optional einmalig `trashOldNotificationMails` ausführen (alte Mails mit „Pflegegrad:" in den Papierkorb; braucht Gmail-Berechtigung).
4. Test ohne Haken „Gesundheitsangaben": Zeile im Sheet enthält keine Zeilen Pflegegrad/Einschränkungen; Mail ebenfalls nicht.
5. Test mit Gesundheitsangaben + Haken: Angaben stehen im Sheet, **nicht** in der Mail.
6. Test mit Gesundheitsangaben ohne Haken: Formular verweigert das Absenden.
7. Testzeile danach im Sheet löschen.
