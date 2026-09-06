/**
 * Google Apps Script Web-App – Kontaktformular „Die Alltagsgestalter"
 * ------------------------------------------------------------------
 * Nimmt die Formular-Absendungen der statischen Website entgegen,
 * hängt sie ab Zeile 10 an das Tabellenblatt „Formular_Anmeldungen" an
 * und verschickt eine Benachrichtigungs-E-Mail. Schlägt das Schreiben
 * ins Sheet fehl, wird trotzdem die Mail versendet (Fallback), damit
 * keine Anfrage verloren geht.
 *
 * Deploy (CONTAINER-GEBUNDEN – wichtig wegen getActiveSpreadsheet):
 *   1. Ziel-Spreadsheet öffnen → Erweiterungen → Apps Script.
 *   2. Diesen Code einfügen, speichern.
 *   3. Bereitstellen → Neue Bereitstellung → Typ „Web-App"
 *        - Ausführen als:  Ich
 *        - Zugriff:        Jeder
 *   4. Die erzeugte  …/exec-URL  in  assets/app.js  bei
 *      CONTACT_ENDPOINT  eintragen.
 *   5. Beim ersten Aufruf einmal die Berechtigungen bestätigen
 *      (Zugriff auf Tabellen + Gmail-Versand).
 *
 * Live-Stand: container-gebunden am Ziel-Spreadsheet, Benachrichtigung
 * an hannes.ferbert@alltagsgestalter.de.
 */

var SHEET_NAME     = 'Formular_Anmeldungen';   // gid: 1669242116
var FIRST_DATA_ROW = 10;                        // erste Datenzeile
var NOTIFY_EMAIL   = 'hannes.ferbert@alltagsgestalter.de';
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
  var sheetError = '';
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheetError = 'Tabellenblatt "' + SHEET_NAME + '" nicht gefunden. Vorhandene Blätter: ' +
        ss.getSheets().map(function (s) { return s.getName(); }).join(' | ');
    } else {
      var targetRow = Math.max(sheet.getLastRow() + 1, FIRST_DATA_ROW);
      sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
      SpreadsheetApp.flush();
      sheetOk = true;
    }
  } catch (sheetErr) {
    sheetError = String(sheetErr && sheetErr.message ? sheetErr.message : sheetErr);
  }

  var mailOk = false;
  try {
    sendNotification_(row, sheetOk, sheetError);
    mailOk = true;
  } catch (mailErr) {}

  // Bestaetigungs-Mail an den Anmelder - nur bei Event-Anmeldung mit
  // E-Mail-Adresse. Schlaegt sie fehl, bleibt die Anmeldung trotzdem gueltig.
  var confirmOk = false;
  if (str_(payload.anfrageTyp) === 'Event-Anmeldung' && email) {
    try {
      sendEventConfirmation_(payload, vorname, nachname, email);
      confirmOk = true;
    } catch (confErr) {}
  }

  if (sheetOk || mailOk) {
    return jsonOut_({ ok: true, leadId: leadId, sheet: sheetOk, mail: mailOk, confirm: confirmOk, sheetError: sheetError });
  }
  return jsonOut_({ ok: false, error: 'Weder Tabelle noch E-Mail erreichbar.', sheetError: sheetError });
}

function sendEventConfirmation_(payload, vorname, nachname, email) {
  var eventName = str_(payload.eventName) || str_(payload.betreff);
  var personen = str_(payload.personen) || '1';
  MailApp.sendEmail({
    to: email,
    subject: 'Ihre Anmeldung: ' + (str_(payload.betreff) || eventName),
    name: 'Die Alltagsgestalter',
    replyTo: NOTIFY_EMAIL,
    body: [
      'Hallo ' + (vorname ? vorname + ' ' : '') + nachname + ',',
      '',
      'vielen Dank für Ihre Anmeldung! Wir haben Ihre Daten erhalten.',
      '',
      'Ihre Anmeldung im Überblick:',
      '– Veranstaltung: ' + eventName,
      '– Name: ' + (vorname + ' ' + nachname).trim(),
      '– Anzahl Personen: ' + personen,
      '',
      'Wir freuen uns auf Sie!',
      '',
      'Herzliche Grüße',
      'Ihre Alltagsgestalter',
      'Tel. 0151 20147853 · ' + NOTIFY_EMAIL
    ].join('\n')
  });
}

function sendNotification_(row, sheetOk, sheetError) {
  var lines = COLUMNS.map(function (label, i) {
    return label + ': ' + (row[i] || '–');
  });
  if (!sheetOk) {
    lines.unshift(
      '!! Konnte NICHT ins Google Sheet geschrieben werden – bitte manuell nachtragen.',
      'Grund: ' + (sheetError || 'unbekannt'),
      ''
    );
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
