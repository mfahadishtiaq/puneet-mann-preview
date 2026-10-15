/* js/ring.js: NDA's showcase ring, phones only (2026-10-15). ONE file for the homepage (Mortgage services, Latest videos) and the
   six services pages (Other situations); served at /js/ring.js on the Astro pages through the public/js symlink, like reels.js.
   Styles: the ring rules in the prototype CSS and in site.css (search "--rh"). */
/* SHOWCASE RING, phones only (Fahad 2026-10-15: "use the showcase from nda for mortgage services", then "add the same carousel ...
   to videos"). Port of NDA's showcase.js (02-Completed/03 - NDA Detailing/05 - Site/showcase.js): ONE number (the centre item);
   every item's look is a data-pos (0, +-1, +-2, far) by its ring distance, folded the short way round so it loops without cloning.
   Arrows, dots, a 45px horizontal swipe (both axes checked, so a vertical scroll that drifts sideways does not turn it). NDA's
   autoplay is left out on purpose. Off phones the box loses .ring and `off` (if given) restores that section's own layout. */
window.makeRing=function(box,items,off){
  if(!box||!items.length)return;
  var dots=[].slice.call(box.querySelectorAll('.sc-dot')),idx=0,phone=matchMedia('(max-width: 760px)'),n=items.length;
  var delta=function(i){var d=(i-idx+n)%n;return d>n/2?d-n:d;};
  var paint=function(){items.forEach(function(c,i){var d=delta(i);c.dataset.pos=Math.abs(d)>2?'far':String(d);c.setAttribute('aria-hidden',d===0?'false':'true');c.tabIndex=d===0?0:-1;});
    dots.forEach(function(b,i){b.classList.toggle('on',i===idx);b.setAttribute('aria-current',i===idx?'true':'false');});};
  var go=function(i){idx=((i%n)+n)%n;paint();};
  var ring=function(){if(phone.matches){box.classList.add('ring');items.forEach(function(c){c.hidden=false;});paint();}
    else{box.classList.remove('ring');items.forEach(function(c){delete c.dataset.pos;c.removeAttribute('aria-hidden');c.removeAttribute('tabindex');});if(off)off();}};
  box.querySelector('.sc-prev').addEventListener('click',function(){go(idx-1);});
  box.querySelector('.sc-next').addEventListener('click',function(){go(idx+1);});
  dots.forEach(function(b){b.addEventListener('click',function(){go(+b.dataset.go);});});
  var sx=0,sy=0;
  box.addEventListener('touchstart',function(e){sx=e.touches[0].clientX;sy=e.touches[0].clientY;},{passive:true});
  box.addEventListener('touchend',function(e){if(!box.classList.contains('ring'))return;var dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;
    if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)){dx<0?go(idx+1):go(idx-1);}},{passive:true});
  phone.addEventListener('change',ring);ring();
};
