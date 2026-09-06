# Kontaktformular-Anbindung (Google Apps Script)

Die Website ist statisch (Hostinger). Das Formular auf `/#kontakt` schickt
seine Daten per `fetch`-POST an eine **Google-Apps-Script-Web-App**, die
in die Tabelle schreibt und eine Benachrichtigungs-E-Mail verschickt.

## Einrichtung (container-gebunden)

Das Script läuft **direkt am Ziel-Spreadsheet** (nicht als eigenständiges
Projekt) – so ist der Zugriff über `getActiveSpreadsheet()` ohne ID/Freigabe
garantiert. Der frühere Versuch mit `openById('14bEf…')` scheiterte an
„Illegal spreadsheet id or key".

1. Ziel-Spreadsheet öffnen → **Erweiterungen → Apps Script**.
2. Inhalt von [`Code.gs`](./Code.gs) komplett hineinkopieren, speichern.
3. **Bereitstellen → Neue Bereitstellung → Typ: Web-App**
   - *Ausführen als:* **Ich**
   - *Zugriff:* **Jeder**
4. **Bereitstellen** klicken, beim ersten Mal die Berechtigungen
   bestätigen (Tabellen lesen/schreiben + E-Mail senden).
5. Die angezeigte URL endet auf **`/exec`** – diese kopieren.
6. In [`../assets/app.js`](../assets/app.js) die Konstante
   `CONTACT_ENDPOINT` auf diese `/exec`-URL setzen, committen, deployen.

> Code ändern → wirkt erst nach **neuer Version**:
> *Bereitstellen → Bereitstellungen verwalten → Stift → Version: „Neue Version" → Bereitstellen*.
> Die `/exec`-URL bleibt dabei gleich.

## Test

- `…/exec` im Browser öffnen → JSON `{"ok":true,"service":…}` = läuft.
- Formular auf der Seite abschicken → neue Zeile ab Zeile 10 im Blatt
  **Formular_Anmeldungen**, Mail an `hannes.ferbert@alltagsgestalter.de`.

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
