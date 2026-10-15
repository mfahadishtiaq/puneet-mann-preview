// TOP NAV (Fahad 2026-10-01, Demo 04 picked: a 21st.dev "DropdownNavigation" rebuilt in plain JS).
// ONE FILE for both: it lives in 05 - Site/prototype/js/, and the Astro site reaches it through the public/js symlink.
//   - ONE soft blue pill that slides between links on framer-motion's default spring (stiffness 500, damping 25)
//   - it vanishes when the pointer leaves (REST_ON_CURRENT below would park it on the current page instead)
//   - a link with a menu opens it on hover, on keyboard focus, or on the first tap; Escape / tapping elsewhere closes it
(function(){
  var ul=document.querySelector('.topnav .tn-list');if(!ul)return;
  var pill=ul.querySelector('.tn-pill'),items=[].slice.call(ul.querySelectorAll('.tn-item'));
  // the pill does NOT rest on the current page (tried 2026-10-01, Fahad preferred the demo as approved); flip to bring it back
  var REST_ON_CURRENT=false;
  var cur=REST_ON_CURRENT?items.filter(function(li){return li.querySelector('.tn-link[aria-current]');})[0]||null:null;
  var hoverItem=null,openItem=null;

  var S={x:{v:0,p:0,t:0},w:{v:0,p:0,t:0}},raf=0,last=0;
  function draw(){pill.style.transform='translateX('+S.x.p+'px)';pill.style.width=S.w.p+'px';}
  function step(now){
    var dt=Math.min(.064,(now-(last||now))/1000),busy=false;last=now;
    for(var k in S){var s=S[k];for(var i=0;i<4;i++){var a=-500*(s.p-s.t)-25*s.v;s.v+=a*dt/4;s.p+=s.v*dt/4;}
      if(Math.abs(s.v)>.5||Math.abs(s.p-s.t)>.5)busy=true;else{s.p=s.t;s.v=0;}}
    draw();raf=busy?requestAnimationFrame(step):0;if(!busy)last=0;
  }
  function place(jump){
    var li=openItem||hoverItem||cur;
    if(!li||!ul.offsetWidth){pill.classList.remove('on');return;} // hidden below 1180px: nothing to measure
    var a=li.querySelector('.tn-link'),x=li.offsetLeft,w=a.offsetWidth;
    pill.style.height=a.offsetHeight+'px';pill.style.top=(li.offsetTop+a.offsetTop)+'px';
    if(jump||!pill.classList.contains('on')){ // first appearance: in place, nothing to slide from
      if(raf){cancelAnimationFrame(raf);raf=0;last=0;}
      S.x.p=S.x.t=x;S.w.p=S.w.t=w;S.x.v=S.w.v=0;draw();pill.classList.add('on');return;}
    S.x.t=x;S.w.t=w;if(!raf)raf=requestAnimationFrame(step);
  }
  // leave + enter arrive as two events: settle on the next frame so item to item slides instead of blinking
  var pend=0;function schedule(){if(pend)return;pend=requestAnimationFrame(function(){pend=0;place();});}
  function setOpen(li){
    if(openItem===li)return;
    if(openItem){openItem.classList.remove('open');openItem.querySelector('.tn-link').setAttribute('aria-expanded','false');}
    openItem=li&&li.querySelector('.tn-wrap')?li:null;
    if(openItem){openItem.classList.add('open');openItem.querySelector('.tn-link').setAttribute('aria-expanded','true');}
    schedule();
  }
  items.forEach(function(li){
    var a=li.querySelector('.tn-link'),hasMenu=!!li.querySelector('.tn-wrap');
    li.addEventListener('mouseenter',function(){setOpen(li);});
    li.addEventListener('mouseleave',function(){if(openItem===li)setOpen(null);});
    a.addEventListener('mouseenter',function(){hoverItem=li;schedule();});
    a.addEventListener('mouseleave',function(){if(hoverItem===li)hoverItem=null;schedule();});
    a.addEventListener('focus',function(){hoverItem=li;setOpen(li);schedule();});
    li.addEventListener('focusout',function(e){if(!li.contains(e.relatedTarget)){if(hoverItem===li)hoverItem=null;if(openItem===li)setOpen(null);schedule();}});
    a.addEventListener('click',function(e){if(hasMenu&&openItem!==li){e.preventDefault();setOpen(li);}});
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&openItem){var a=openItem.querySelector('.tn-link');setOpen(null);a.focus();}});
  document.addEventListener('pointerdown',function(e){if(openItem&&!openItem.contains(e.target))setOpen(null);});
  addEventListener('resize',function(){place(true);});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){place(true);}); // widths change when Mona Sans arrives
  place(true);
  window.__tn=function(m){var li=m?ul.querySelector('[data-menu="'+m+'"]'):null;hoverItem=li;setOpen(li);place(true);}; // QA / screenshots
})();
