// ============================================================
// VERANSTALTUNGEN — hier Termine eintragen, ändern oder entfernen.
// Jeder Eintrag ist ein Objekt mit denselben Feldern wie unten:
//   id           eindeutiger Kurzname, nur intern (erscheint nirgends im Text)
//   categories   ein oder mehrere Filter: 'geselligkeit', 'vortraege', 'aktivitaet'
//   dateISO      Datum als 'JJJJ-MM-TT' (wird zum zeitlichen Sortieren benutzt)
//   day / month  wie das Datum im runden Lila-Badge angezeigt wird, z. B. '28' / 'Okt'
//   title        Titel der Veranstaltung
//   highlight    kurzer Zusatz-Satz, kann leer bleiben: ''
//   time         Zeile mit Datum/Uhrzeit als Text
//   location     Zeile mit dem Veranstaltungsort
//   cost         Zeile mit Kosten/Hinweis zur Teilnahme
//   summary      kurzer 2-Zeiler für die Terminliste im Panel
//   description  ausführlicher Einladungstext als Liste von Absätzen
//
// Die zwei mit "[Beispiel]" markierten Einträge sind nur Platzhalter zum
// Testen der Filter-Kategorien "Vorträge & Beratung" und "Aktivität" - bitte
// vor dem Livegang durch echte Termine ersetzen oder entfernen.
// ============================================================
var ALLTAGSGESTALTER_EVENTS = [
  {
    id: 'kaffee-2026-10-28',
    categories: ['geselligkeit', 'vortraege'],
    dateISO: '2026-10-28',
    day: '28',
    month: 'Okt',
    title: 'Auf einen gemütlichen Kaffee mit den Alltagsgestaltern',
    highlight: 'Inklusive Impulsvortrag: Gesunde Ernährung im Alter',
    time: 'Mittwoch, 28.10.2026 | 13:30 – 16:00 Uhr',
    location: 'Gemeindehaus Alte Post, Gertrud-Caspari-Str. 10, 01109 Dresden',
    cost: 'Kostenfrei · Inklusive Kaffee, kleinen Snacks & Getränken',
    summary: 'Kaffee, gute Gespräche und ein Impulsvortrag zur gesunden Ernährung im Alter – lernen Sie Hannes Ferbert & Fynn Silbermann unverbindlich kennen.',
    description: [
      'Wünschen Sie sich manchmal etwas mehr Schwung im Alltag, Hilfe im Haushalt oder einfach ein gutes Gespräch bei einem Kaffee? Wir von den Alltagsgestaltern helfen älteren Menschen in Dresden, gut begleitet Zuhause zu leben.',
      'Freuen Sie sich an diesem Nachmittag auf einen spannenden Gastbeitrag einer zertifizierten Ernährungsfachkraft zum Thema „Gesunde & genussvolle Ernährung im Alter“. Als Heilerziehungspfleger und gelernter Koch verknüpfen wir professionelle Alltagsbegleitung mit der Freude am gemeinsamen Kochen und Genuss.',
      'Lernen Sie Hannes Ferbert & Fynn Silbermann unverbindlich kennen! Wir beantworten Ihre Fragen zur Alltagsunterstützung sowie dazu, wie die Pflegekasse diese Unterstützung finanziert (§ 45b SGB XI).'
    ]
  },
  {
    id: 'beispiel-vortrag',
    categories: ['vortraege'],
    dateISO: '2026-11-12',
    day: '12',
    month: 'Nov',
    title: '[Beispiel] Vortrag: Sicher zuhause wohnen im Alter',
    highlight: '',
    time: 'Donnerstag, 12.11.2026 | 15:00 – 16:30 Uhr',
    location: 'Beispielsaal, Musterstraße 1, 01067 Dresden',
    cost: 'Kostenfrei',
    summary: 'Platzhalter-Termin zum Testen der Kategorie „Vorträge & Beratung“ – bitte vor Veröffentlichung ersetzen oder entfernen.',
    description: ['Dies ist ein Platzhalter-Eintrag, damit die Kategorie „Vorträge & Beratung“ beim Testen sichtbar ist. Bitte vor Veröffentlichung durch einen echten Termin ersetzen oder löschen.']
  },
  {
    id: 'beispiel-aktivitaet',
    categories: ['aktivitaet'],
    dateISO: '2026-11-20',
    day: '20',
    month: 'Nov',
    title: '[Beispiel] Gemeinsamer Spaziergang & Gedächtnistraining',
    highlight: '',
    time: 'Freitag, 20.11.2026 | 10:00 – 11:30 Uhr',
    location: 'Treffpunkt Beispielpark, Dresden',
    cost: 'Kostenfrei',
    summary: 'Platzhalter-Termin zum Testen der Kategorie „Aktivität“ – bitte vor Veröffentlichung ersetzen oder entfernen.',
    description: ['Dies ist ein Platzhalter-Eintrag, damit die Kategorie „Aktivität“ beim Testen sichtbar ist. Bitte vor Veröffentlichung durch einen echten Termin ersetzen oder löschen.']
  }
];

// Verhindert, dass der Browser bei einem Seitenaufruf mit Hash in der URL
// (z. B. Sprung von "ueber-uns" zu "/#zuhause") sofort hart zum Anker
// springt; stattdessen bleibt die Seite oben, bis der eigene, sanfte
// Scroll weiter unten (siehe scrollToId) uebernimmt.
if (location.hash) {
  if ('scrollRestoration' in history) { history.scrollRestoration = 'manual'; }
  window.scrollTo(0, 0);
}

document.addEventListener("DOMContentLoaded", function () {
try {
      document.documentElement.lang = 'de';

      (function () {
        var links = [].slice.call(document.querySelectorAll('nav.main-nav a[href^="#"]'));
        var targets = links.map(function (a) {
          var el = document.querySelector(a.getAttribute('href'));
          return el ? { link: a, el: el } : null;
        }).filter(Boolean);
        if (!targets.length) return;
        var ticking = false;
        function update() {
          ticking = false;
          var line = (window.innerHeight || 0) * 0.3;
          var current = null;
          targets.forEach(function (t) {
            var r = t.el.getBoundingClientRect();
            if (r.top <= line && r.bottom > line) current = t;
          });
          targets.forEach(function (t) {
            if (t === current) t.link.setAttribute('aria-current', 'true');
            else t.link.removeAttribute('aria-current');
          });
        }
        function onScroll() {
          if (ticking) return;
          ticking = true;
          window.requestAnimationFrame(update);
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        update();
      })();

      (function () {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        var items = [].slice.call(document.querySelectorAll('.wm'));
        if (!items.length) return;
        var ticking = false;
        function update() {
          ticking = false;
          var vh = window.innerHeight || 1;
          items.forEach(function (el) {
            var section = el.closest('section');
            if (!section) return;
            var r = section.getBoundingClientRect();
            var progress = (vh - r.top) / (vh + r.height);
            progress = Math.max(0, Math.min(1, progress));
            var speed = parseFloat(el.getAttribute('data-wm-speed')) || 0.12;
            el.style.transform = 'translate3d(0,' + (progress * speed * vh).toFixed(1) + 'px,0)';
          });
        }
        function onScroll() {
          if (ticking) return;
          ticking = true;
          window.requestAnimationFrame(update);
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        update();
      })();
      
        (function () {
          var toggle = document.getElementById('navToggle');
          var nav = document.getElementById('mainNav');
          if (toggle && nav) {
            toggle.addEventListener('click', function () {
              var open = nav.classList.toggle('open');
              toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            });
            nav.querySelectorAll('a').forEach(function (link) {
              link.addEventListener('click', function () {
                nav.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
              });
            });
          }
          var HEADER_OFFSET = 96;
          var pinnedCardId = null;
      
          // Von den vier Leistungskarten ist immer höchstens eine hervorgehoben:
          // die zuletzt angeklickte, solange sie im Blick bleibt – oder sonst die,
          // die der Bildschirmmitte am nächsten ist. Läuft über echte Pixelwerte
          // (nicht über prozentuale Ränder), damit es unabhängig von der
          // tatsächlichen Fensterhöhe zuverlässig genau eine Karte trifft.
          var watchedCards = Array.prototype.slice.call(document.querySelectorAll('.service-card'));
          var requestCardUpdate = function () {};
      
          if (watchedCards.length) {
            var CENTER_BAND = 170;
            var ticking = false;
      
            // Eine per Klick angepinnte Karte bleibt verlässlich die einzige
            // Hervorhebung, während die Seite dorthin scrollt – unabhängig davon,
            // ob sie in diesem Moment schon im Bild ist. Der Pin wird erst gelöst,
            // sobald der Mensch selbst weiterscrollt (Maus, Touch oder Tastatur);
            // danach übernimmt wieder die automatische Erkennung der Karte, die
            // der Bildschirmmitte am nächsten ist.
            var releasePin = function () { pinnedCardId = null; };
            window.addEventListener('wheel', releasePin, { passive: true });
            window.addEventListener('touchmove', releasePin, { passive: true });
            window.addEventListener('keydown', function (e) {
              var scrollKeys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '];
              if (scrollKeys.indexOf(e.key) !== -1) { releasePin(); }
            });
      
            var updateCardHighlight = function () {
              var winner = pinnedCardId ? document.getElementById(pinnedCardId) : null;
      
              if (!winner) {
                var viewportCenter = window.innerHeight / 2;
                var winnerDistance = Infinity;
                watchedCards.forEach(function (card) {
                  var rect = card.getBoundingClientRect();
                  if (rect.bottom <= 0 || rect.top >= window.innerHeight) { return; }
                  var distance = Math.abs((rect.top + rect.height / 2) - viewportCenter);
                  if (distance >= CENTER_BAND) { return; }
                  if (distance < winnerDistance) {
                    winner = card;
                    winnerDistance = distance;
                  }
                });
              }
      
              watchedCards.forEach(function (card) {
                card.classList.toggle('is-highlighted', card === winner);
              });
              ticking = false;
            };
      
            requestCardUpdate = function () {
              if (!ticking) {
                ticking = true;
                window.requestAnimationFrame(updateCardHighlight);
              }
            };
      
            window.addEventListener('scroll', requestCardUpdate, { passive: true });
            window.addEventListener('resize', requestCardUpdate);
            updateCardHighlight();
          }
      
          // Steuert einen Zielbereich sanft an und "pinnt" ihn, damit er als
          // hervorgehoben gilt, solange er im Blick bleibt. Wird sowohl beim
          // Klick auf einen internen Link (Navigation, Footer, Buttons) als
          // auch beim Laden der Seite mit einem Hash in der URL genutzt
          // (z. B. Sprung von "ueber-uns" zu "/#zuhause").
          var scrollToId = function (id) {
            var target = document.getElementById(id);
            if (!target) return false;

            pinnedCardId = id;
            requestCardUpdate(); // sofort neu bewerten, auch wenn sich die Scroll-Position nicht ändert

            // Kurze Ziele (z. B. eine Leistungskarte) werden in der Bildschirmmitte
            // platziert – das deckt sich mit der Logik, die oben erkennt, welche
            // Karte gerade "im Blick" ist. Lange Ziele (z. B. ein ganzer Artikel)
            // werden stattdessen nur knapp unter den Header gesetzt, damit ihr
            // Anfang nicht hinter der Navigation verschwindet.
            var rect = target.getBoundingClientRect();
            var absoluteTop = rect.top + window.pageYOffset;
            var centeredTop = absoluteTop + rect.height / 2 - window.innerHeight / 2;
            var underHeaderTop = absoluteTop - HEADER_OFFSET;
            var top = Math.max(Math.min(centeredTop, underHeaderTop), 0);
            window.scrollTo({ top: top, behavior: 'smooth' });
            return true;
          };

          document.querySelectorAll('a[href^="#"]').forEach(function (link) {
            link.addEventListener('click', function (e) {
              var id = link.getAttribute('href').slice(1);
              if (!id || !scrollToId(id)) return;
              e.preventDefault();
              try {
                history.pushState(null, '', '#' + id);
              } catch (err) {  }
            });
          });

          // Seite wurde mit einem Hash aufgerufen (z. B. von einer anderen
          // Unterseite verlinkt) – statt des harten Browser-Sprungs sanft
          // hinscrollen, sobald das Layout steht.
          if (location.hash) {
            var initialId = location.hash.slice(1);
            window.setTimeout(function () { scrollToId(initialId); }, 60);
          }
        })();
      
        // ---------- Hero-Cursor: einmalige Begrüßungs-Geste beim ersten Laden ----------
        // Rein dekorativ (pointer-events: none), läuft genau einmal, respektiert
        // reduzierte Bewegung, indem die Elemente dann gar nicht erst erzeugt/
        // sondern sofort wieder entfernt werden, statt sie nur unsichtbar zu machen.
        (function heroCursorIntro() {
          var icon = document.getElementById('heroCursorIcon');
          var glow = document.getElementById('heroCursorGlow');
          var h1 = document.querySelector('.hero-copy h1');
          var accent = h1 ? h1.querySelector('.accent') : null;
      
          var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          var supported = icon && typeof icon.animate === 'function';
      
          if (reduceMotion || !supported || !glow || !h1 || !accent) {
            if (icon) icon.remove();
            if (glow) glow.remove();
            return;
          }
      
          var run = function () {
            var h1Rect = h1.getBoundingClientRect();
            var accentRects = accent.getClientRects();
            // Erste Zeilenfragment der Hervorhebung – die Geste bezieht sich genau
            // auf diesen blauen Block, unabhängig davon, wie oft die restliche
            // Überschrift bei der jeweiligen Fensterbreite umbricht.
            var accentRect = accentRects.length ? accentRects[0] : accent.getBoundingClientRect();
            if (!h1Rect.width || !accentRect.width) { icon.remove(); glow.remove(); return; }
      
            var ICON_SIZE = 30;
            var LEAD_IN = 34;  // der Cursor startet etwas links vom Block und gleitet auf ihn zu
            var TRAIL = 14;    // ...und etwas darüber hinaus, bevor er verweilt
      
            var accentLeft = accentRect.left - h1Rect.left;
            var accentTop = accentRect.top - h1Rect.top;
            var startX = Math.max(accentLeft - LEAD_IN, -ICON_SIZE * 0.5);
            var endX = accentLeft + accentRect.width - ICON_SIZE + TRAIL;
            var travel = Math.max(endX - startX, 60);
      
            icon.style.left = startX + 'px';
            icon.style.top = (accentTop + accentRect.height - ICON_SIZE * 0.72) + 'px';
      
            glow.style.left = accentLeft + 'px';
            glow.style.top = accentTop + 'px';
            glow.style.width = accentRect.width + 'px';
            glow.style.height = accentRect.height + 'px';
      
            var startFrac = Math.min(Math.max((accentLeft - startX) / travel, 0), 1);
            var endFrac = Math.min(Math.max((accentLeft + accentRect.width - startX) / travel, startFrac + 0.05), 1);
      
            var DURATION = 2500; // sanfte, ruhige Gleitbewegung – kein Ruckeln
            var HOLD = 500;      // kurzes Verweilen am Ende der Zeile
            var FADE = 400;
      
            icon.animate(
              [
                { transform: 'translateX(0)', opacity: 0, offset: 0 },
                { transform: 'translateX(0)', opacity: 1, offset: 0.06 },
                { transform: 'translateX(' + travel + 'px)', opacity: 1, offset: 1 }
              ],
              { duration: DURATION, easing: 'cubic-bezier(0.45, 0, 0.2, 1)', fill: 'forwards' }
            );
      
            glow.animate(
              [
                { opacity: 0, offset: 0 },
                { opacity: 0, offset: Math.max(startFrac - 0.03, 0) },
                { opacity: 1, offset: startFrac },
                { opacity: 1, offset: endFrac },
                { opacity: 0, offset: Math.min(endFrac + 0.05, 1) },
                { opacity: 0, offset: 1 }
              ],
              { duration: DURATION, easing: 'linear', fill: 'forwards' }
            );
      
            setTimeout(function () {
              icon.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE, easing: 'ease-in', fill: 'forwards' });
            }, DURATION + HOLD);
      
            setTimeout(function () {
              icon.remove();
              glow.remove();
            }, DURATION + HOLD + FADE + 150);
          };
      
          // Erst starten, wenn die Webfonts geladen sind – sonst würde die Messung
          // der Textbreite auf der Fallback-Schrift beruhen und beim Font-Swap
          // nicht mehr zur tatsächlichen Textposition passen.
          if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () {
              requestAnimationFrame(function () { requestAnimationFrame(run); });
            }).catch(run);
          } else {
            setTimeout(run, 300);
          }
        })();
      
        // ---------- Leistungskacheln: sanftes Auf-/Zuklappen ----------
        // Klick auf die ganze Kachel ODER auf den "Im Detail enthalten"-Button
        // öffnet/schließt die Liste. Die native <details>-Semantik bleibt erhalten
        // (wichtig für Screenreader), aber statt des abrupten Standard-Verhaltens
        // wird die Höhe/Opazität der Liste weich animiert (Fade-in + Slide-down).
        // Tastaturbedienung läuft weiterhin nativ über den fokussierbaren
        // <summary>-Button; bei reduzierter Bewegung wird sofort umgeschaltet,
        // ganz ohne Animation.
        (function serviceCardExpand() {
          var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
          document.querySelectorAll('.service-card details.service-more').forEach(function (details) {
            var summary = details.querySelector('summary');
            var body = details.querySelector('.service-more-body');
            var card = details.closest('.service-card');
            if (!summary || !body || !card) return;
      
            var animating = false;
      
            var open = function () {
              if (animating || details.open) return;
              animating = true;
              details.open = true;
              var target = body.scrollHeight;
              if (reduceMotion) {
                body.style.height = '';
                body.style.opacity = '';
                animating = false;
                return;
              }
              body.style.overflow = 'hidden';
              body.style.height = '0px';
              body.style.opacity = '0';
              body.style.transform = 'translateY(-6px)';
              // Reflow erzwingen, damit der Browser den Startwert wirklich rendert,
              // bevor der Übergang zum Zielwert beginnt.
              body.offsetHeight;
              body.style.transition = 'height 0.4s ease-out, opacity 0.35s ease-out, transform 0.35s ease-out';
              body.style.height = target + 'px';
              body.style.opacity = '1';
              body.style.transform = 'translateY(0)';
              var onEnd = function (e) {
                if (e && e.target !== body) return;
                body.style.height = '';
                body.style.overflow = '';
                body.style.transition = '';
                body.style.transform = '';
                body.removeEventListener('transitionend', onEnd);
                animating = false;
              };
              body.addEventListener('transitionend', onEnd);
            };
      
            var close = function () {
              if (animating || !details.open) return;
              animating = true;
              if (reduceMotion) {
                details.open = false;
                animating = false;
                return;
              }
              var current = body.scrollHeight;
              body.style.overflow = 'hidden';
              body.style.height = current + 'px';
              body.style.opacity = '1';
              body.style.transform = 'translateY(0)';
              body.offsetHeight;
              body.style.transition = 'height 0.35s ease-out, opacity 0.3s ease-out, transform 0.3s ease-out';
              body.style.height = '0px';
              body.style.opacity = '0';
              body.style.transform = 'translateY(-6px)';
              var onEnd = function (e) {
                if (e && e.target !== body) return;
                details.open = false;
                body.style.height = '';
                body.style.overflow = '';
                body.style.transition = '';
                body.style.transform = '';
                body.removeEventListener('transitionend', onEnd);
                animating = false;
              };
              body.addEventListener('transitionend', onEnd);
            };
      
            var toggle = function () {
              if (details.open) { close(); } else { open(); }
            };
      
            // Klick auf den Button selbst: natives Toggle-Verhalten abfangen und
            // stattdessen animiert umschalten.
            summary.addEventListener('click', function (e) {
              e.preventDefault();
              toggle();
            });
      
            // Klick irgendwo sonst auf die Kachel: ebenfalls umschalten – außer der
            // Mensch markiert gerade Text (dann soll die Kachel nicht zuklappen).
            card.addEventListener('click', function (e) {
              if (e.target.closest('summary')) return; // schon oben behandelt
              if (window.getSelection && String(window.getSelection()).length > 0) return;
              toggle();
            });
          });
        })();

        // ---------- Modal / Pop-up-Overlay ----------
        // Generische, barrierefreie Dialog-Logik:
        //  * Öffnen  über jedes Element mit [data-modal-open="<id>"]
        //  * Schließen über [data-modal-close] (X-Button + Backdrop), Escape
        //    und Klick auf den abgedunkelten Hintergrund.
        //  * Fokus wandert beim Öffnen in den Dialog, wird beim Schließen an das
        //    auslösende Element zurückgegeben, und bleibt dazwischen im Dialog
        //    gefangen (Tab / Shift+Tab). Der Rest der Seite wird für Screenreader
        //    per aria-hidden ausgeblendet.
        (function modalDialogs() {
          // Ausloeser sind die "Im Detail enthalten +"-Buttons der Leistungskacheln
          // (Klasse .service-more-trigger) sowie jedes weitere Element mit
          // [data-modal-open="<modal-id>"]. Doppelte werden entfernt.
          var openers = Array.prototype.slice.call(
            document.querySelectorAll('.service-more-trigger[data-modal-open], [data-modal-open]')
          ).filter(function (el, i, arr) { return arr.indexOf(el) === i; });
          if (!openers.length) return;

          var FOCUSABLE = 'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
          var activeModal = null;
          var activeTrigger = null;
          var inertKids = [];

          function focusableIn(root) {
            return Array.prototype.slice.call(root.querySelectorAll(FOCUSABLE)).filter(function (el) {
              return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement;
            });
          }

          function setBackgroundInert(on) {
            if (on) {
              inertKids = [];
              Array.prototype.slice.call(document.body.children).forEach(function (el) {
                if (el === activeModal || el.tagName === 'SCRIPT') return;
                inertKids.push({ el: el, prev: el.getAttribute('aria-hidden') });
                el.setAttribute('aria-hidden', 'true');
              });
            } else {
              inertKids.forEach(function (rec) {
                if (rec.prev === null) rec.el.removeAttribute('aria-hidden');
                else rec.el.setAttribute('aria-hidden', rec.prev);
              });
              inertKids = [];
            }
          }

          function onKeydown(e) {
            if (!activeModal) return;
            if (e.key === 'Escape' || e.key === 'Esc') {
              e.preventDefault();
              closeModal();
              return;
            }
            if (e.key === 'Tab') {
              var f = focusableIn(activeModal);
              if (!f.length) { e.preventDefault(); return; }
              var first = f[0];
              var last = f[f.length - 1];
              if (e.shiftKey && (document.activeElement === first || !activeModal.contains(document.activeElement))) {
                e.preventDefault();
                last.focus();
              } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
              }
            }
          }

          function openModal(id, trigger) {
            var modal = document.getElementById(id);
            if (!modal || activeModal) return;
            activeModal = modal;
            // Der ausloesende "Im Detail enthalten +"-Button wird gemerkt, damit der
            // Fokus beim Schliessen exakt dorthin zurueckkehrt. Fallback: der Button,
            // dessen data-modal-open auf dieses Modal zeigt.
            activeTrigger = trigger
              || document.querySelector('.service-more-trigger[data-modal-open="' + id + '"]')
              || document.querySelector('[data-modal-open="' + id + '"]')
              || null;
            modal.hidden = false;
            modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('modal-open');
            setBackgroundInert(true);
            if (activeTrigger) activeTrigger.setAttribute('aria-expanded', 'true');
            var f = focusableIn(modal);
            var dialog = modal.querySelector('[role="dialog"]') || modal;
            (f.length ? f[0] : dialog).focus();
            document.addEventListener('keydown', onKeydown, true);
          }

          function closeModal() {
            if (!activeModal) return;
            var modal = activeModal;
            var trigger = activeTrigger;
            document.removeEventListener('keydown', onKeydown, true);
            setBackgroundInert(false);
            modal.hidden = true;
            modal.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('modal-open');
            activeModal = null;
            activeTrigger = null;
            // Fokus zurueck auf den ausloesenden Button (X, Backdrop, Escape und
            // "Zurueck zur Uebersicht" landen alle hier).
            if (trigger && typeof trigger.focus === 'function') {
              trigger.setAttribute('aria-expanded', 'false');
              trigger.focus();
            }
          }

          openers.forEach(function (btn) {
            btn.addEventListener('click', function (e) {
              e.preventDefault();
              openModal(btn.getAttribute('data-modal-open'), btn);
            });
          });

          Array.prototype.slice.call(document.querySelectorAll('.modal')).forEach(function (modal) {
            modal.setAttribute('aria-hidden', 'true');
            modal.addEventListener('click', function (e) {
              var closer = e.target.closest('[data-modal-close]');
              if (!closer) return;
              // Ein echter Link (z. B. der CTA-Button) darf nach dem Schließen
              // noch zu seinem Ziel navigieren – deshalb hier kein preventDefault.
              if (!(closer.tagName === 'A' && closer.getAttribute('href'))) e.preventDefault();
              closeModal();
            });
          });

          // Klick irgendwo auf die Genuss-Kachel (außer auf Text-Markierung) öffnet
          // das Pop-up ebenfalls – wie bei den anderen Kacheln der Klick aufs Auf-/
          // Zuklappen wirkt.
          openers.forEach(function (btn) {
            var card = btn.closest('.service-card');
            if (!card) return;
            card.addEventListener('click', function (e) {
              if (e.target.closest('[data-modal-open]')) return;
              if (window.getSelection && String(window.getSelection()).length > 0) return;
              openModal(btn.getAttribute('data-modal-open'), btn);
            });
          });
        })();

        // ---------- "Ihr Alltagsprofil"-Widget: 4-Schritte-Mini-Quiz ----------
        // Rein clientseitig, ohne Speicherung: Für wen -> Bedürfnis -> Charakter ->
        // Multi-Match-Ergebnis (Haupttyp + 2 ergänzende Facetten aus anderen
        // Kategorien). Icons nutzen dieselben Form-Gesicht-SVGs wie die Matching-
        // Hinweise auf den Leistungskacheln, damit die Bildsprache konsistent bleibt.
        (function alltagsprofilWidget() {
          var widget = document.getElementById('profileWidget');
          if (!widget) return;

          var panels = {
            1: widget.querySelector('[data-panel="1"]'),
            2: widget.querySelector('[data-panel="2"]'),
            3: widget.querySelector('[data-panel="3"]'),
            4: widget.querySelector('[data-panel="4"]')
          };
          var dots = Array.prototype.slice.call(widget.querySelectorAll('[data-step-dot]'));
          var resultAvatar = widget.querySelector('[data-result-avatar]');
          var resultMain = widget.querySelector('[data-result-main]');
          var resultFacets = widget.querySelector('[data-result-facets]');
          var resultText = widget.querySelector('[data-result-text]');
          var restartBtn = widget.querySelector('[data-profile-restart]');
          if (!panels[1] || !panels[2] || !panels[3] || !panels[4] || !resultAvatar || !resultMain || !resultFacets || !resultText) return;

          function shapeIcon(shape, color, outline) {
            var strokeAttr = outline ? ' stroke="var(--color-text)" stroke-width="1.5"' : '';
            if (shape === 'circle') {
              return '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="' + (outline ? 15 : 16) + '" fill="' + color + '"' + strokeAttr + '/><circle cx="11" cy="13" r="1.6" fill="var(--color-kohle)"/><circle cx="21" cy="13" r="1.6" fill="var(--color-kohle)"/><path d="M11 19q5 4.5 10 0" stroke="var(--color-kohle)" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
            }
            if (shape === 'rect') {
              return '<svg viewBox="0 0 32 32"><rect width="32" height="32" rx="12" fill="' + color + '"' + strokeAttr + '/><circle cx="11" cy="13" r="1.6" fill="var(--color-kohle)"/><circle cx="21" cy="13" r="1.6" fill="var(--color-kohle)"/><path d="M11 19q5 4.5 10 0" stroke="var(--color-kohle)" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
            }
            return '<svg viewBox="0 0 32 32"><polygon points="16,4 28,29 4,29" fill="' + color + '"' + strokeAttr + '/><circle cx="12.5" cy="20" r="1.4" fill="var(--color-kohle)"/><circle cx="19.5" cy="20" r="1.4" fill="var(--color-kohle)"/><path d="M12.5 24.5q3.5 3 7 0" stroke="var(--color-kohle)" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>';
          }

          // Nur die tatsaechlich im Widget verwendeten Typen aus den elf
          // Alltagsgestalter-Persönlichkeiten (siehe ueber-uns.html): vier als
          // direkt waehlbarer Haupt-Charakter (Schritt 3), vier weitere als
          // Vertreter ihrer Kategorie fuer die ergaenzenden Facetten im Ergebnis.
          var PERSONAS = {
            ruhepol: { label: 'Der Ruhepol', shape: 'circle', category: 'ruhe' },
            organisierte: { label: 'Die Organisierte', shape: 'rect', category: 'ruhe' },
            tueftler: { label: 'Der Tüftler', shape: 'triangle', category: 'ruhe' },
            plauderin: { label: 'Die Plauderin', shape: 'circle', category: 'gesellschaft' },
            entdecker: { label: 'Der Entdecker', shape: 'triangle', category: 'gesellschaft' },
            geniesserin: { label: 'Die Genießerin', shape: 'triangle', category: 'genuss' },
            gartenfreund: { label: 'Der Gartenfreund', shape: 'circle', category: 'genuss' },
            buecherwurm: { label: 'Der Bücherwurm', shape: 'rect', category: 'aktivitaet' }
          };
          var CATEGORY_COLOR = {
            ruhe: 'var(--color-violett-card)',
            gesellschaft: 'var(--color-orange-card)',
            genuss: 'var(--color-sand)',
            aktivitaet: 'var(--color-gruen)'
          };
          var CATEGORY_OUTLINE = { genuss: true };
          var CATEGORY_ORDER = ['ruhe', 'gesellschaft', 'genuss', 'aktivitaet'];
          // Je Kategorie der Alltagstyp, der als ergaenzende Facette auftaucht,
          // wenn diese Kategorie NICHT der gewaehlte Haupt-Charakter ist - bewusst
          // andere Typen als die vier direkt waehlbaren, damit das Ergebnis wie
          // eine echte Erweiterung wirkt statt die eigene Auswahl zu wiederholen.
          var FACET_REP = { ruhe: 'tueftler', gesellschaft: 'entdecker', genuss: 'gartenfreund', aktivitaet: 'buecherwurm' };
          var MOOD_LABEL = {
            genuss: 'Entspannung & Genuss',
            ruhe: 'Ruhe & Begleitung',
            gesellschaft: 'Gute Gespräche',
            aktivitaet: 'Aktivität & Kreativität'
          };
          var WHO_LABEL = { self: 'für sich selbst', angehoerige: 'für ihre Eltern / Angehörige' };

          var state = { who: null, mood: null, mainId: null };

          function iconFor(persona) {
            return shapeIcon(persona.shape, CATEGORY_COLOR[persona.category], CATEGORY_OUTLINE[persona.category]);
          }

          function showPanel(step) {
            Object.keys(panels).forEach(function (key) {
              var isActive = Number(key) === step;
              panels[key].classList.toggle('is-active', isActive);
              panels[key].hidden = !isActive;
            });
            dots.forEach(function (dot) {
              var dotStep = Number(dot.getAttribute('data-step-dot'));
              dot.classList.toggle('is-active', dotStep === step);
              dot.classList.toggle('is-done', dotStep < step);
            });
          }

          // Es gibt (noch) kein eigenes Kontaktformular auf der Seite - "#kontakt"
          // fuehrt zum Footer mit einem mailto-Link. Als bestmoegliche Uebergabe
          // wird dieser Link um Betreff/Text mit dem Ergebnis ergaenzt, damit die
          // Anfrage im E-Mail-Programm bereits vorausgefuellt ankommt.
          function primeContactHandoff(main, facet1, facet2) {
            var mailLink = document.querySelector('a[href^="mailto:info@alltagsgestalter.de"]');
            if (!mailLink) return;
            var subject = 'Erstgespräch – Alltagsprofil: ' + main.label;
            var body = [
              'Hallo Alltagsgestalter-Team,',
              '',
              'ich interessiere mich für ein Erstgespräch. Mein Alltagsprofil:',
              '– Unterstützung gesucht: ' + (WHO_LABEL[state.who] || '-'),
              '– Aktuell am wichtigsten: ' + (MOOD_LABEL[state.mood] || '-'),
              '– Passender Begleiter-Mix: ' + main.label + ', ' + facet1.label + ' & ' + facet2.label,
              '',
              'Bitte melden Sie sich bei mir für ein unverbindliches Erstgespräch.'
            ].join('\n');
            mailLink.href = 'mailto:info@alltagsgestalter.de?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
          }

          function showResult() {
            var main = PERSONAS[state.mainId];
            if (!main) return;
            var candidates = CATEGORY_ORDER.filter(function (c) { return c !== main.category; });
            candidates.sort(function (a, b) {
              if (a === state.mood) return -1;
              if (b === state.mood) return 1;
              return 0;
            });
            var facet1 = PERSONAS[FACET_REP[candidates[0]]];
            var facet2 = PERSONAS[FACET_REP[candidates[1]]];

            resultAvatar.innerHTML = iconFor(main);
            resultMain.textContent = main.label;
            resultFacets.innerHTML = '';
            [facet1, facet2].forEach(function (facet) {
              var chip = document.createElement('span');
              chip.className = 'profile-facet-chip';
              chip.innerHTML = iconFor(facet) + '<span>' + facet.label + '</span>';
              resultFacets.appendChild(chip);
            });
            resultText.textContent = 'Zu Ihnen passt unser Haupt-Typ ' + main.label + ' ideal kombiniert mit ' + facet1.label + ' & ' + facet2.label + '.';

            primeContactHandoff(main, facet1, facet2);
            showPanel(4);
          }

          function reset() {
            state = { who: null, mood: null, mainId: null };
            showPanel(1);
          }

          widget.querySelectorAll('[data-who]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              state.who = btn.getAttribute('data-who');
              showPanel(2);
            });
          });
          widget.querySelectorAll('[data-mood]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              state.mood = btn.getAttribute('data-mood');
              showPanel(3);
            });
          });
          widget.querySelectorAll('[data-persona]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              state.mainId = btn.getAttribute('data-persona');
              showResult();
            });
          });
          widget.querySelectorAll('[data-profile-back]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              showPanel(Number(btn.getAttribute('data-profile-back')));
            });
          });
          if (restartBtn) restartBtn.addEventListener('click', reset);
        })();

        // ---------- Veranstaltungen: Panel, Filter & Anmeldung ----------
        // Nutzt die vorhandene, generische Modal-Logik (siehe modalDialogs
        // oben) fuer Oeffnen/Schliessen/Fokus-Falle/ESC/Backdrop-Klick - der
        // Trigger-Button braucht dafuer nur [data-modal-open="eventsPanel"].
        (function eventsFeature() {
          var panel = document.getElementById('eventsPanel');
          var list = panel ? panel.querySelector('[data-events-list]') : null;
          var tabs = panel ? Array.prototype.slice.call(panel.querySelectorAll('[data-event-filter]')) : [];
          if (!panel || !list) return;

          function findEvent(id) {
            for (var i = 0; i < ALLTAGSGESTALTER_EVENTS.length; i++) {
              if (ALLTAGSGESTALTER_EVENTS[i].id === id) return ALLTAGSGESTALTER_EVENTS[i];
            }
            return null;
          }

          // Es gibt (noch) kein eigenes Kontaktformular - "#kontakt" fuehrt
          // zum Footer mit einem mailto-Link. Betreff/Text werden vor dem
          // Hinscrollen mit den Termin-Angaben vorausgefuellt.
          function primeSignupMail(evt) {
            var mailLink = document.querySelector('a[href^="mailto:info@alltagsgestalter.de"]');
            if (!mailLink || !evt) return;
            var subject = 'Anmeldung: ' + evt.title;
            var bodyLines = [
              'Hallo Alltagsgestalter-Team,',
              '',
              'ich möchte mich gern für folgende Veranstaltung anmelden:',
              '„' + evt.title + '“',
              evt.time ? ('Termin: ' + evt.time) : null,
              evt.location ? ('Ort: ' + evt.location) : null,
              '',
              'Bitte bestätigen Sie mir die Teilnahme.'
            ].filter(function (line) { return line !== null; });
            mailLink.href = 'mailto:info@alltagsgestalter.de?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(bodyLines.join('\n'));
          }

          function goToContact() {
            var target = document.getElementById('kontakt');
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }

          function renderList(filter) {
            var items = ALLTAGSGESTALTER_EVENTS
              .filter(function (evt) { return filter === 'all' || evt.categories.indexOf(filter) !== -1; })
              .slice()
              .sort(function (a, b) { return a.dateISO < b.dateISO ? -1 : a.dateISO > b.dateISO ? 1 : 0; });

            list.innerHTML = '';

            if (!items.length) {
              var empty = document.createElement('p');
              empty.className = 'events-empty';
              empty.textContent = 'Aktuell keine Termine in dieser Kategorie.';
              list.appendChild(empty);
              return;
            }

            items.forEach(function (evt) {
              var card = document.createElement('article');
              card.className = 'event-card';

              var meta = ['<li><span aria-hidden="true">🕒</span> ' + evt.time + '</li>'];
              if (evt.location) meta.push('<li><span aria-hidden="true">📍</span> ' + evt.location + '</li>');
              if (evt.cost) meta.push('<li><span aria-hidden="true">💶</span> ' + evt.cost + '</li>');

              var descriptionHtml = evt.description.map(function (p) { return '<p>' + p + '</p>'; }).join('');

              card.innerHTML =
                '<div class="event-card-date" aria-hidden="true"><span class="event-card-day">' + evt.day + '</span><span class="event-card-month">' + evt.month + '</span></div>' +
                '<div class="event-card-body">' +
                  '<h3 class="event-card-title">' + evt.title + '</h3>' +
                  (evt.highlight ? '<p class="event-card-highlight">' + evt.highlight + '</p>' : '') +
                  '<p class="event-card-summary">' + evt.summary + '</p>' +
                  '<ul class="event-card-meta">' + meta.join('') + '</ul>' +
                  '<details class="event-card-more"><summary>Mehr erfahren</summary><div class="event-card-description">' + descriptionHtml + '</div></details>' +
                  '<button type="button" class="btn btn-primary event-card-signup">Anmelden</button>' +
                '</div>';

              var signupBtn = card.querySelector('.event-card-signup');
              signupBtn.addEventListener('click', function () {
                primeSignupMail(evt);
                var closeBtn = panel.querySelector('.modal__close');
                if (closeBtn) closeBtn.click();
                window.setTimeout(goToContact, 150);
              });

              list.appendChild(card);
            });
          }

          tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
              tabs.forEach(function (t) {
                var active = t === tab;
                t.classList.toggle('is-active', active);
                t.setAttribute('aria-pressed', active ? 'true' : 'false');
              });
              renderList(tab.getAttribute('data-event-filter'));
            });
          });

          renderList('all');

          // Direkter Anmelde-Button auf der Startseite (ausserhalb des
          // Panels): der Sanft-Scroll zu "#kontakt" laeuft bereits ueber den
          // allgemeinen a[href^="#"]-Handler weiter oben - hier wird nur die
          // Mail vorbereitet.
          document.querySelectorAll('[data-event-signup]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              primeSignupMail(findEvent(btn.getAttribute('data-event-signup')));
            });
          });
        })();

    } catch (e) { console.error('Seiten-Skript:', e); }
});
