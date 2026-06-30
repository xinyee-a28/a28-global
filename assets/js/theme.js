/* ============================================================
   A28 Global — Theme resolver + link rewriter
   Phase 1 (infrastructure). Sets body[data-theme] from URL/session,
   persists choice, and rewrites internal links to carry the route
   so new-tabs / copied URLs preserve the active theme.
   No visual changes — that comes in later phases.
   ============================================================ */

(function () {
  var ALLOWED = { enterprise: 1, government: 1 };

  // The inline <head> snippet should already have set documentElement.dataset.theme
  // before this file runs, but resolve again defensively for safety.
  function resolveRoute() {
    var qp = null;
    try { qp = new URLSearchParams(window.location.search).get('route'); } catch (e) {}
    if (qp && ALLOWED[qp]) return qp;
    var stored = null;
    try { stored = window.sessionStorage.getItem('a28-route'); } catch (e) {}
    if (stored && ALLOWED[stored]) return stored;
    return 'enterprise';
  }

  var theme = document.documentElement.dataset.theme;
  if (!ALLOWED[theme]) {
    theme = resolveRoute();
    document.documentElement.dataset.theme = theme;
  }
  try { window.sessionStorage.setItem('a28-route', theme); } catch (e) {}

  // Mirror to <body> once it's parsed, so selectors can target either node.
  function syncBody() {
    if (document.body && document.body.dataset.theme !== theme) {
      document.body.dataset.theme = theme;
    }
  }
  syncBody();

  // Rewrite internal .html links so the route param rides along.
  // Skips: external, mailto:, tel:, anchors, javascript:, links opting out
  // via data-no-rewrite, and links that already carry ?route=.
  function rewriteLinks() {
    var anchors = document.querySelectorAll('a[href]');
    for (var i = 0; i < anchors.length; i++) {
      var a = anchors[i];
      if (a.hasAttribute('data-no-rewrite')) continue;
      var href = a.getAttribute('href');
      if (!href) continue;
      if (/^(mailto:|tel:|javascript:|https?:|#)/i.test(href)) continue;
      if (!/\.html(\?|#|$)/i.test(href)) continue;
      if (/[?&]route=/.test(href)) continue;

      var fragIdx = href.indexOf('#');
      var base = fragIdx >= 0 ? href.slice(0, fragIdx) : href;
      var frag = fragIdx >= 0 ? href.slice(fragIdx) : '';
      var sep = base.indexOf('?') >= 0 ? '&' : '?';
      a.setAttribute('href', base + sep + 'route=' + theme + frag);
    }
  }

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  // Apply enterprise-only micro-copy swaps:
  // any element with data-copy-enterprise="Some text" gets its
  // textContent swapped on the enterprise route.
  function applyMicroCopy() {
    if (theme !== 'enterprise') return;
    var nodes = document.querySelectorAll('[data-copy-enterprise]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var newText = el.getAttribute('data-copy-enterprise');
      if (newText != null) el.textContent = newText;
    }
  }

  // Soft cross-fade between pages on the enterprise route.
  // Only intercepts plain left-clicks on internal .html links
  // and only if the user hasn't asked for reduced motion.
  function attachPageFade() {
    if (theme !== 'enterprise') return;
    var prefersReduced = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    document.addEventListener('click', function (e) {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      if (a.hasAttribute('data-no-rewrite')) return;
      if (a.target && a.target !== '' && a.target !== '_self') return;
      var href = a.getAttribute('href');
      if (!href) return;
      if (/^(mailto:|tel:|javascript:|https?:|#)/i.test(href)) return;
      if (!/\.html(\?|#|$)/i.test(href)) return;

      e.preventDefault();
      document.body.classList.add('is-leaving');
      setTimeout(function () { window.location.href = a.href; }, 220);
    });

    // When user navigates back/forward, ensure the leaving class is cleared
    // so the page is visible again.
    window.addEventListener('pageshow', function () {
      document.body.classList.remove('is-leaving');
    });
  }

  // Route-switch buttons (TOP SECRET / RELAX). Any element with
  // data-route-switch="<route>" navigates to the same page on that route.
  function attachRouteSwitch() {
    var nodes = document.querySelectorAll('[data-route-switch]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].addEventListener('click', function (e) {
        e.preventDefault();
        var target = this.getAttribute('data-route-switch');
        if (!ALLOWED[target]) return;
        try { window.sessionStorage.setItem('a28-route', target); } catch (err) {}
        var dest = window.location.pathname + '?route=' + target + window.location.hash;
        var prefersReduced = window.matchMedia &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) { window.location.href = dest; return; }
        document.body.classList.add('is-leaving');
        setTimeout(function () { window.location.href = dest; }, 180);
      });
    }
  }

  onReady(function () {
    syncBody();
    applyMicroCopy();
    rewriteLinks();
    attachPageFade();
    attachRouteSwitch();
    // Re-run rewriteLinks after a tick in case other scripts (e.g. mobile
    // menu) inject additional links dynamically. Cheap and idempotent.
    setTimeout(rewriteLinks, 250);
  });

  // Expose a tiny helper for future phases / debugging.
  window.A28Theme = {
    current: function () { return theme; },
    rewriteLinks: rewriteLinks,
    applyMicroCopy: applyMicroCopy
  };
})();
