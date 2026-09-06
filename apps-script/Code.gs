/**
 * Google Apps Script Web-App – Kontaktformular „Die Alltagsgestalter"
 * ------------------------------------------------------------------
 * Nimmt die Formular-Absendungen der statischen Website entgegen,
 * hängt sie ab Zeile 10 an das Tabellenblatt „Formular_Anmeldungen" an
 * und verschickt eine Benachrichtigungs-E-Mail. Schlägt das Schreiben
 * ins Sheet fehl, wird trotzdem die Mail versendet (Fallback), damit
 * keine Anfrage verloren geht.
 *
 * Deploy:
 *   1. script.google.com  →  Neues Projekt  →  diesen Code einfügen.
 *   2. Bereitstellen  →  Neue Bereitstellung  →  Typ „Web-App"
 *        - Ausführen als:  Ich (die Inhaber-Adresse des Sheets)
 *        - Zugriff:        Jeder
 *   3. Die erzeugte  …/exec-URL  in  assets/app.js  bei
 *      CONTACT_ENDPOINT  eintragen.
 *   4. Beim ersten Aufruf einmal die Berechtigungen bestätigen
 *      (Zugriff auf Tabellen + Gmail-Versand).
 */

var SPREADSHEET_ID = '14bEfTyTSJjdSs6TFfYooxiE0Yiz1I5Z-_C2VUqjkDvw';
var SHEET_NAME     = 'Formular_Anmeldungen';   // gid: 1669242116
var FIRST_DATA_ROW = 10;                        // erste Datenzeile
var NOTIFY_EMAIL   = 'info@alltagsgestalter.de';
var TZ             = 'Europe/Berlin';

var COLUMNS = [
  'Lead-ID', 'Eingangsdatum', 'Uhrzeit', 'Anfrage-Typ', 'Anrede',
  'Vorname', 'Nachname', 'Telefonnummer', 'E-Mail', 'Alltagsprofil/Nachricht'
];

function doPost(e) {
  var payload;
  try {
    payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return jsonOut_({ ok: false, error: 'Ungültige Anfrage.' });
  }

  // Honeypot: ausgefülltes Feld -> stillschweigend als Erfolg quittieren.
  if (payload.company) return jsonOut_({ ok: true });

  var vorname  = str_(payload.vorname);
  var nachname = str_(payload.nachname);
  var email    = str_(payload.email);
  var telefon  = str_(payload.telefon);

  if (!nachname || (!email && !telefon)) {
    return jsonOut_({ ok: false, error: 'Bitte Nachname und eine Kontaktmöglichkeit angeben.' });
  }

  var now = new Date();
  var leadId = 'AG-' + Utilities.formatDate(now, TZ, 'yyyyMMdd') + '-' +
    Utilities.getUuid().replace(/-/g, '').slice(0, 4).toUpperCase();

  var row = [
    leadId,
    Utilities.formatDate(now, TZ, 'dd.MM.yyyy'),
    Utilities.formatDate(now, TZ, 'HH:mm'),
    str_(payload.anfrageTyp),
    str_(payload.anrede),
    vorname,
    nachname,
    telefon,
    email,
    str_(payload.nachricht)
  ];

  var sheetOk = false;
  try {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (sheet) {
      var targetRow = Math.max(sheet.getLastRow() + 1, FIRST_DATA_ROW);
      sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
      SpreadsheetApp.flush();
      sheetOk = true;
    }
  } catch (sheetErr) {
    // bewusst schlucken -> Mail-Fallback greift
  }

  var mailOk = false;
  try {
    sendNotification_(row, sheetOk);
    mailOk = true;
  } catch (mailErr) {}

  if (sheetOk || mailOk) {
    return jsonOut_({ ok: true, leadId: leadId, sheet: sheetOk, mail: mailOk });
  }
  return jsonOut_({ ok: false, error: 'Weder Tabelle noch E-Mail erreichbar.' });
}

function sendNotification_(row, sheetOk) {
  var lines = COLUMNS.map(function (label, i) {
    return label + ': ' + (row[i] || '–');
  });
  if (!sheetOk) {
    lines.unshift('!! Konnte NICHT ins Google Sheet geschrieben werden – bitte manuell nachtragen.', '');
  }
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: 'Neue Website-Anfrage – ' + (row[5] ? row[5] + ' ' : '') + row[6] + ' (' + row[0] + ')',
    replyTo: row[8] || NOTIFY_EMAIL,
    name: 'Website-Formular',
    body: lines.join('\n')
  });
}

/** Health-Check im Browser aufrufbar. */
function doGet() {
  return jsonOut_({ ok: true, service: 'Alltagsgestalter Kontaktformular' });
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function str_(v) {
  return (v === null || v === undefined) ? '' : String(v).trim();
}
