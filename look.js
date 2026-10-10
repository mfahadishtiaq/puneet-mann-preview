/* =====================================================================
   THE LOOK PANEL — PREVIEW ONLY (2026-10-05).
   Fahad: "The link should have an option to switch between blue nav bar and white ·
   in terms of colour palette, we need current, FFF8E7, FFFFF0 · He should be able to
   switch around with them".

   One switch in a small panel, bottom-left (the Review tab owns the right edge):
     Background: Current (#f1f1ef) / FFF8E7
   2026-10-10, Fahad: "Lets leave the nav bar blue and also remove this colour [FFFFF0] for background."
   The nav bar row is gone (blue is now the site's own default, set in Base.astro) and
   FFFFF0 is no longer offered. A choice saved on a device from before is reset.
   The choice is remembered on this device (localStorage) so it follows Puneet from page
   to page, and the panel can be folded away.

   Blue uses the site's own `html.nav-blue` rules (site.css + the homepage prototype).
   The background is the site's --wall token, forced with !important so it also beats
   the homepage's own inline --wall (its test bar sets it inline on load). The homepage's
   own BACKGROUND test bar is hidden here: this panel replaces it on the preview.

   Attached ONLY by preview/deploy-preview.sh to the staged copy. No site page names this
   file, so it can never reach the real domain.
   ===================================================================== */
(function () {
  'use strict';
  var KEY = 'puneet-preview-look';
  var BG = [['Current', '#f1f1ef'], ['FFF8E7', '#FFF8E7']];
  var root = document.documentElement;
  var state = { bg: 0, open: true };
  try { var saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved) state = Object.assign(state, saved); } catch (e) {}
  delete state.nav; if (!(state.bg >= 0 && state.bg < BG.length)) state.bg = 0;   // old saved picks (white nav, FFFFF0) no longer exist

  var force = document.createElement('style');
  document.head.appendChild(force);
  function apply() {
    root.classList.add('nav-blue');   // the site sets this itself; kept so an older cached page still shows blue
    force.textContent = ':root,html{--wall:' + BG[state.bg][1] + ' !important}.bg-switch{display:none !important}';
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    panel.querySelectorAll('[data-bg]').forEach(function (b) { b.setAttribute('aria-pressed', +b.dataset.bg === state.bg); });
    panel.classList.toggle('lk-closed', !state.open);
    toggle.setAttribute('aria-expanded', state.open);
  }

  var panel = document.createElement('div');
  panel.className = 'lkroot';
  panel.setAttribute('role', 'group');
  panel.setAttribute('aria-label', 'Preview look');
  panel.innerHTML =
    '<button class="lktoggle" type="button" aria-expanded="true">Look</button>' +
    '<div class="lkbody">' +
      '<div class="lkrow"><span class="lklabel">Background</span>' +
        BG.map(function (o, i) { return '<button type="button" data-bg="' + i + '"><i style="background:' + o[1] + '"></i>' + o[0] + '</button>'; }).join('') +
      '</div>' +
    '</div>';
  var toggle = panel.querySelector('.lktoggle');
  toggle.addEventListener('click', function () { state.open = !state.open; apply(); });
  panel.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || b === toggle) return;
    if (b.dataset.bg) state.bg = +b.dataset.bg;
    apply();
  });
  function mount() { document.body.appendChild(panel); apply(); }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
