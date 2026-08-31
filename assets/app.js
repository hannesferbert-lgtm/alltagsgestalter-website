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
      
          var form = document.getElementById('newsletterForm');
          var note = document.getElementById('newsletterNote');
          if (form && note) {
            form.addEventListener('submit', function (e) {
              e.preventDefault();
              note.textContent = 'Danke! Bitte Anmeldung in Kürze per E-Mail bestätigen.';
              form.reset();
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
      
          // Beim Klick auf einen internen Link (Navigation, Footer, Buttons) den
          // Zielbereich sanft ansteuern. Ein geklicktes Ziel wird "angepinnt", damit
          // genau dieser Bereich hervorgehoben bleibt, solange er im Blick ist.
          document.querySelectorAll('a[href^="#"]').forEach(function (link) {
            link.addEventListener('click', function (e) {
              var id = link.getAttribute('href').slice(1);
              if (!id) return;
              var target = document.getElementById(id);
              if (!target) return;
      
              e.preventDefault();
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
      
              try {
                history.pushState(null, '', '#' + id);
              } catch (err) {  }
            });
          });
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
      
    } catch (e) { console.error('Seiten-Skript:', e); }
});
