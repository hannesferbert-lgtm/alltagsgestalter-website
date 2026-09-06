# Kontaktformular-Anbindung (Google Apps Script)

Die Website ist statisch (Hostinger). Das Formular auf `/#kontakt` schickt
seine Daten per `fetch`-POST an eine **Google-Apps-Script-Web-App**, die
in die Tabelle schreibt und eine Benachrichtigungs-E-Mail verschickt.

## Einrichtung

1. **script.google.com** öffnen → **Neues Projekt**.
2. Inhalt von [`Code.gs`](./Code.gs) komplett hineinkopieren, speichern.
3. **Bereitstellen → Neue Bereitstellung → Typ: Web-App**
   - *Beschreibung:* z. B. „Kontaktformular v1"
   - *Ausführen als:* **Ich** (die Google-Konto-Adresse, die Zugriff auf
     das Spreadsheet und auf `info@alltagsgestalter.de` / Gmail hat)
   - *Zugriff:* **Jeder**
4. **Bereitstellen** klicken, beim ersten Mal die Berechtigungen
   bestätigen (Tabellen lesen/schreiben + E-Mail senden).
5. Die angezeigte URL endet auf **`/exec`** – diese kopieren.
6. In [`../assets/app.js`](../assets/app.js) die Konstante
   `CONTACT_ENDPOINT` auf diese `/exec`-URL setzen, committen, deployen.

## Test

- `…/exec` im Browser öffnen → JSON `{"ok":true,"service":…}` = läuft.
- Formular auf der Seite abschicken → neue Zeile ab Zeile 10 im Blatt
  **Formular_Anmeldungen**, Mail an `info@alltagsgestalter.de`.

## Spalten (Reihenfolge = Append-Reihenfolge)

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| Lead-ID | Eingangsdatum | Uhrzeit | Anfrage-Typ | Anrede | Vorname | Nachname | Telefonnummer | E-Mail | Alltagsprofil/Nachricht |

`Lead-ID`, `Eingangsdatum` und `Uhrzeit` werden serverseitig erzeugt
(`AG-JJJJMMTT-XXXX`, Zeitzone Europe/Berlin).

## Fallback

- Schreibt das Script die Zeile nicht (Sheet nicht erreichbar/umbenannt),
  geht trotzdem die E-Mail raus und das Frontend zeigt Erfolg.
- Antwortet die Web-App gar nicht (Netz/Deploy), blendet das Frontend
  einen vorbefüllten `mailto:`-Link + die Telefonnummer ein.

## Änderungen an Feldern

Neue Spalte? In `Code.gs` das Array `COLUMNS` **und** das `row`-Array
anpassen und im Formular (`index.html`) das passende `name`-Feld ergänzen,
außerdem in `assets/app.js` bei `data = { … }`.
