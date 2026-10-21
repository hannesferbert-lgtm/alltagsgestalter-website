/* Cookie-Einwilligung: Google Analytics wird erst nach Zustimmung geladen. */
(function () {
  'use strict';

  var GA_ID = 'G-EPWJ24610Z';
  var KEY = 'ag-consent-analytics';

  function read() {
    try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function write(value) {
    try { window.localStorage.setItem(KEY, value); } catch (e) { /* Auswahl gilt dann nur für diesen Besuch */ }
  }

  var loaded = false;
  function loadAnalytics() {
    if (loaded) { return; }
    loaded = true;
    window['ga-disable-' + GA_ID] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
  }

  function removeAnalytics() {
    window['ga-disable-' + GA_ID] = true;
    var names = ['_ga', '_ga_' + GA_ID.replace('G-', ''), '_gid'];
    var host = window.location.hostname.split('.');
    var domains = [window.location.hostname];
    if (host.length > 2) { domains.push(host.slice(-2).join('.')); }
    domains.push('.' + host.slice(-2).join('.'));
    names.forEach(function (n) {
      domains.forEach(function (d) {
        document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=' + d;
      });
      document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    });
  }

  var banner = null;
  var statusLive = null;
  var statusLine = null;
  var returnFocusTo = null;
  var root = document.documentElement;

  function statusText() {
    var v = read();
    if (v === 'granted') { return 'Aktuelle Einstellung: Statistik ist erlaubt.'; }
    if (v === 'denied') { return 'Aktuelle Einstellung: Statistik ist abgelehnt.'; }
    return 'Aktuelle Einstellung: Sie haben noch nichts ausgewählt. Ohne Auswahl wird keine Statistik erfasst.';
  }

  /* Hält das Banner aus dem Weg, wenn per Tastatur durch die Seite navigiert wird (WCAG 2.4.11). */
  function reserveSpace() {
    if (banner && !banner.hidden) {
      root.style.scrollPaddingBottom = (banner.offsetHeight + 24) + 'px';
      root.style.setProperty('--consent-h', banner.offsetHeight + 'px');
      root.classList.add('consent-open-bar');
    } else {
      root.style.scrollPaddingBottom = '';
      root.style.removeProperty('--consent-h');
      root.classList.remove('consent-open-bar');
    }
  }

  function announce(text) {
    if (!statusLive) { return; }
    statusLive.textContent = '';
    window.setTimeout(function () { statusLive.textContent = text; }, 50);
  }

  function closeBanner(restoreFocus) {
    if (!banner || banner.hidden) { return; }
    banner.hidden = true;
    reserveSpace();
    if (restoreFocus && returnFocusTo && document.contains(returnFocusTo)) {
      returnFocusTo.focus();
    }
    returnFocusTo = null;
  }

  function decide(value) {
    var before = read();
    write(value);
    if (value === 'granted') {
      loadAnalytics();
    } else if (before === 'granted' || loaded) {
      removeAnalytics();
    }
    closeBanner(true);
    announce(value === 'granted'
      ? 'Einstellung gespeichert: Statistik ist erlaubt.'
      : 'Einstellung gespeichert: Statistik ist abgelehnt.');
  }

  function buildBanner() {
    statusLive = document.createElement('div');
    statusLive.className = 'visually-hidden';
    statusLive.setAttribute('role', 'status');
    statusLive.setAttribute('aria-live', 'polite');

    banner = document.createElement('div');
    banner.className = 'consent';
    banner.id = 'consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'false');
    banner.setAttribute('aria-labelledby', 'consent-title');
    banner.setAttribute('aria-describedby', 'consent-desc');
    banner.tabIndex = -1;
    banner.hidden = true;
    banner.innerHTML =
      '<div class="consent-inner">' +
      '<p id="consent-text" class="consent-text"><strong id="consent-title">Cookies &amp; Statistik.</strong> ' +
      '<span id="consent-desc">Wir nutzen Google Analytics, um unsere Website zu verbessern. ' +
      'Dabei werden Cookies gesetzt und Daten an Google übertragen. ' +
      'Mit „Zustimmen“ willigen Sie ein, mit „Alle ablehnen“ wird nichts erfasst.</span> ' +
      '<a href="/datenschutz">Datenschutzerklärung</a></p>' +
      '<p class="consent-status visually-hidden"></p>' +
      '<div class="consent-actions">' +
      '<button type="button" class="btn consent-btn" data-consent="denied">Alle ablehnen</button>' +
      '<button type="button" class="btn consent-btn" data-consent="granted">Zustimmen</button>' +
      '<button type="button" class="consent-close" data-consent-close aria-label="Hinweis schließen, ohne eine Auswahl zu speichern">' +
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M5 5l14 14M19 5L5 19"/></svg>' +
      '</button>' +
      '</div>' +
      '</div>';
    statusLine = banner.querySelector('.consent-status');

    banner.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target : null;
      var btn = t ? t.closest('[data-consent]') : null;
      if (btn) { decide(btn.getAttribute('data-consent')); return; }
      if (t && t.closest('[data-consent-close]')) { closeBanner(true); }
    });
    /* Escape schließt das Banner, ohne eine Auswahl zu speichern (es wird dann nichts erfasst). */
    banner.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        closeBanner(true);
      }
    });

    /* Direkt nach dem Skip-Link einsetzen: früh in der Tab-Reihenfolge und beim Vorlesen. */
    var skip = document.querySelector('.skip-link');
    if (skip && skip.parentNode === document.body) {
      document.body.insertBefore(banner, skip.nextSibling);
    } else {
      document.body.insertBefore(banner, document.body.firstChild);
    }
    document.body.appendChild(statusLive);
    window.addEventListener('resize', reserveSpace);
  }

  function openBanner() {
    if (!banner) { buildBanner(); }
    var active = document.activeElement;
    returnFocusTo = (active && active !== document.body) ? active : null;
    statusLine.textContent = statusText();
    banner.hidden = false;
    reserveSpace();
    banner.focus({ preventScroll: true });
  }

  function addFooterLink() {
    var list = document.querySelector('.footer-bottom ul');
    if (!list) { return; }
    var li = document.createElement('li');
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'consent-open';
    b.setAttribute('aria-haspopup', 'dialog');
    b.setAttribute('aria-controls', 'consent-banner');
    b.textContent = 'Cookie-Einstellungen';
    b.addEventListener('click', openBanner);
    li.appendChild(b);
    list.appendChild(li);
  }

  function init() {
    addFooterLink();
    var saved = read();
    if (saved === 'granted') {
      loadAnalytics();
    } else if (saved !== 'denied') {
      openBanner();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
