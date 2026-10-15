/* Puneet's video tiles (2026-10-06). ONE file for the homepage and the Astro pages (served at /js/reels.js via the
   public/js symlink), so the player is never written twice.
   Markup: any element with [data-reel] holding <video muted playsinline loop preload="none" poster><source src></video>.
     - hover (mouse only): plays the tile WITH SOUND (Fahad 2026-10-06: "when you move your mouse over the video tile, the video
       should start playing with the audio"); leaving pauses it and shows the poster again. Browsers refuse sound until the
       visitor has clicked/tapped/pressed a key on the page, so before that first interaction the hover falls back to muted.
       Nothing plays without a hover or a click: no autoplay on the site.
     - click / Enter: opens the player with sound and controls, plus a link to the reel on Instagram (data-ig).
   Videos are self-hosted on purpose: no Instagram script on the site (Fahad 2026-10-06, same reasoning as the reviews).
   The deploy script rewrites src= and poster= for the preview path, so the URL is always read from the <source>.
   Frame 0 of each reel is his designed Instagram cover (Fahad does not want it shown), so playback starts at START seconds. */
(function(){
  var tiles=[].slice.call(document.querySelectorAll('[data-reel]'));
  if(!tiles.length)return;
  var START=0.05;
  var hover=matchMedia('(hover:hover) and (pointer:fine)').matches&&!matchMedia('(prefers-reduced-motion: reduce)').matches;

  var css='.reelbox{border:0;padding:0;background:transparent;max-width:none;max-height:none;width:100%;height:100%;color:#fff;overflow:hidden}'+
    '.reelbox::backdrop{background:rgba(10,22,44,.86);backdrop-filter:blur(6px)}'+
    '.reelbox .rb-in{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px}'+
    '.reelbox video{height:min(80svh,calc((100vw - 48px) * 16 / 9));aspect-ratio:9/16;max-width:100%;border-radius:12px;background:#000;display:block}'+
    '.reelbox .rb-cap{display:flex;gap:18px;align-items:baseline;justify-content:center;flex-wrap:wrap;text-align:center;font:600 17px/1.3 var(--sans,system-ui,sans-serif)}'+
    '.reelbox .rb-cap a{color:#d3b65a;font-weight:700;font-size:15px;text-decoration:none}'+
    '.reelbox .rb-cap a:hover,.reelbox .rb-cap a:focus-visible{text-decoration:underline}'+
    '.reelbox .rb-x{position:fixed;top:18px;right:18px;width:46px;height:46px;border-radius:50%;border:0;background:#fff;color:#16171b;display:grid;place-items:center;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.3)}'+
    '.reelbox .rb-x svg{width:18px;height:18px}'+
    '.reelbox :focus-visible{outline:2px solid #d3b65a;outline-offset:3px}';
  var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

  var box=document.createElement('dialog');box.className='reelbox';box.setAttribute('aria-label','Video');
  box.innerHTML='<div class="rb-in"><video controls playsinline preload="auto"></video>'+
    '<p class="rb-cap"><span class="rb-t"></span><a target="_blank" rel="noopener">Watch on Instagram ↗</a></p></div>'+
    '<button class="rb-x" type="button" aria-label="Close video" autofocus><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>';
  document.body.appendChild(box);
  var bv=box.querySelector('video'), bt=box.querySelector('.rb-t'), bl=box.querySelector('a'), opener=null;

  function close(){ if(box.open)box.close(); }
  box.querySelector('.rb-x').addEventListener('click',close);
  box.addEventListener('click',function(e){ if(e.target===box||e.target.classList.contains('rb-in'))close(); });
  box.addEventListener('close',function(){
    bv.pause();bv.removeAttribute('src');bv.load();
    if(window.__lenis)window.__lenis.start();
    if(opener)opener.focus();
  });

  tiles.forEach(function(t){
    var v=t.querySelector('video'), s=v&&v.querySelector('source');
    if(!v||!s)return;
    if(hover){
      t.addEventListener('mouseenter',function(){
        t.classList.add('previewing'); v.muted=false; if(v.currentTime<START)v.currentTime=START;
        var p=v.play();
        if(p&&p.catch)p.catch(function(){ if(!t.classList.contains('previewing'))return; v.muted=true; var q=v.play(); if(q&&q.catch)q.catch(function(){}); });
      });
      t.addEventListener('mouseleave',function(){ t.classList.remove('previewing'); v.pause(); v.muted=true; v.currentTime=0; v.load(); });
    }
    t.addEventListener('click',function(e){
      e.preventDefault();
      opener=t; v.pause();
      bv.src=s.src.split('#')[0]+'#t='+START; bt.textContent=t.getAttribute('data-title')||'';
      var ig=t.getAttribute('data-ig'); if(ig){bl.href=ig;bl.hidden=false;}else bl.hidden=true;
      if(window.__lenis)window.__lenis.stop();
      box.showModal();
      var p=bv.play(); if(p&&p.catch)p.catch(function(){});
    });
  });
})();
