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
      // Telefonnummer als Text speichern, sonst geht eine führende 0 verloren.
      sheet.getRange(targetRow, 8).setNumberFormat('@');
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
  var anrede = (vorname || nachname)
    ? 'Guten Tag ' + (vorname ? vorname + ' ' : '') + nachname + ','
    : 'Guten Tag,';
  MailApp.sendEmail({
    to: email,
    subject: 'Ihre Anmeldung: ' + (str_(payload.betreff) || eventName),
    name: 'die ALLTAGSGESTALTER',
    replyTo: NOTIFY_EMAIL,
    body: [
      anrede,
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
      'Ihre Alltagsgestalter'
    ].join('\n')
  });
}

function sendNotification_(row, sheetOk, sheetError) {
  var lines = COLUMNS.map(function (label, i) {
    var val = (i === 9) ? stripHealth_(row[i]) : row[i];
    return label + ': ' + (val || '–');
  });
  if (stripHealth_(row[9]) !== row[9]) {
    lines.push('', 'Hinweis: Gesundheitsangaben stehen aus Datenschutzgründen nur im Sheet, nicht in dieser Mail.');
  }
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


// ---------------------------------------------------------------
// Datenschutz: Gesundheitsangaben
// ---------------------------------------------------------------
var HEALTH_PREFIXES = ['Pflegegrad:', 'Einschränkungen:', 'Unverträglichkeiten:'];
var RETENTION_DAYS  = 28;   // Gesundheitsangaben: 4 Wochen nach der Fahrt
var FALLBACK_DAYS   = 60;   // wenn kein Veranstaltungsdatum erkennbar: ab Eingang

/** Entfernt Zeilen mit Gesundheitsangaben aus einem Nachrichtentext. */
function stripHealth_(text) {
  return String(text || '').split('\n').filter(function (l) {
    return !HEALTH_PREFIXES.some(function (p) { return l.indexOf(p) === 0; });
  }).join('\n');
}

/** Liest das Veranstaltungsdatum (TT.MM.JJJJ) aus der Zeile „Veranstaltung: …". */
function eventDate_(text) {
  var m = String(text || '').match(/Veranstaltung:[^\n]*?(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null;
}

/**
 * Löscht Gesundheitsangaben aus dem Sheet, sobald RETENTION_DAYS nach der
 * Fahrt vergangen sind (ohne erkennbares Datum: FALLBACK_DAYS nach Eingang).
 * Läuft täglich per Trigger (einmalig installTrigger() ausführen).
 */
function purgeHealthData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return;
  var last = sheet.getLastRow();
  if (last < FIRST_DATA_ROW) return;
  var n = last - FIRST_DATA_ROW + 1;
  var range = sheet.getRange(FIRST_DATA_ROW, 10, n, 1);   // nur Spalte J
  var vals = range.getValues();
  var dates = sheet.getRange(FIRST_DATA_ROW, 2, n, 1).getValues();
  var now = new Date(), changed = 0;
  for (var i = 0; i < vals.length; i++) {
    var msg = String(vals[i][0] || '');
    if (!HEALTH_PREFIXES.some(function (p) { return msg.indexOf('\n' + p) >= 0 || msg.indexOf(p) === 0; })) continue;
    var base = eventDate_(msg), days = RETENTION_DAYS;
    if (!base) {
      var d = dates[i][0], m = String(d).match(/(\d{2})\.(\d{2})\.(\d{4})/);
      if (d instanceof Date) base = d;
      else if (m) base = new Date(+m[3], +m[2] - 1, +m[1]);
      else continue;
      days = FALLBACK_DAYS;
    }
    if ((now - base) / 86400000 >= days) {
      vals[i][0] = stripHealth_(msg) + '\nGesundheitsangaben gelöscht am ' + Utilities.formatDate(now, TZ, 'dd.MM.yyyy');
      changed++;
    }
  }
  if (changed) range.setValues(vals);
}

/** Einmalig ausführen: richtet die tägliche Löschung ein. */
function installTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'purgeHealthData') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('purgeHealthData').timeBased().everyDays(1).atHour(3).inTimezone(TZ).create();
}

/**
 * Optional, einmalig: verschiebt ältere Benachrichtigungsmails ("Neue Website-Anfrage")
 * mit Gesundheitsangaben in den Papierkorb. Braucht zusätzliche Gmail-Berechtigung.
 */
function trashOldNotificationMails() {
  var threads = GmailApp.search('subject:"Neue Website-Anfrage" "Pflegegrad:"', 0, 100);
  threads.forEach(function (t) { t.moveToTrash(); });
}
