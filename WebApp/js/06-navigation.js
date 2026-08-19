// ══════════════════════════════════════════════════════════════════════════════
// [JS-6] NAVIGATION SYSTEM
// ══════════════════════════════════════════════════════════════════════════════

const TABS=['home','compass','prayer','azkar','night','quran','settings','serenity'];

function _qaEnsureInternalHome(page,id){
  if(!page || id==='home') return;
  // Reuse a screen-owned Home control when one already exists; never duplicate it.
  var owned=page.querySelector('[data-go="home"],.qa-internal-home');
  if(owned){
    owned.classList.add('qa-internal-home');
    owned.setAttribute('aria-label','العودة إلى الرئيسية');
    return;
  }
  var b=document.createElement('button');
  b.type='button';
  b.className='qa-internal-home';
  b.setAttribute('aria-label','العودة إلى الرئيسية');
  b.setAttribute('title','الرئيسية');
  b.innerHTML='<span aria-hidden="true">⌂</span>';
  b.addEventListener('click',function(){GT('home');});
  page.appendChild(b);
}

function _qaResetPageScroll(page){
  try{ if(page) page.scrollTop=0; }catch(e){}
  try{ document.documentElement.scrollTop=0; }catch(e){}
  try{ document.body.scrollTop=0; }catch(e){}
  try{ window.scrollTo(0,0); }catch(e){}
}

function _qaFinalizeNavigation(id,page){
  // Dynamic screen mounts, translations and image decoding can shift layout one
  // frame after activation. Reset again after paint so every screen opens from
  // its own top, especially Home after returning from a long internal screen.
  _qaResetPageScroll(page);
  if(typeof requestAnimationFrame==='function'){
    requestAnimationFrame(function(){
      _qaResetPageScroll(page);
      requestAnimationFrame(function(){_qaResetPageScroll(page);});
    });
  } else {
    setTimeout(function(){_qaResetPageScroll(page);},0);
  }
  try{window.dispatchEvent(new CustomEvent('qiblaastro:navigation-change',{detail:{page:id}}));}catch(e){}
}

function GT(id){
  if(!id)id='home';
  document.body.classList.toggle('qa-internal-screen',id!=='home');
  document.body.classList.toggle('tab-home',id==='home');
  document.body.classList.toggle('hide-topbar',true);
  document.body.setAttribute('data-qa-active-page',id);

  // Compass-only fullscreen presentation state must never leak into Home or any
  // other screen while its own observer is settling.
  if(id!=='compass') document.body.classList.remove('qa-astro-fullscreen-mode');

  document.querySelectorAll('.nav-item').forEach(function(el,i){
    el.classList.toggle('active',TABS[i]===id);
  });
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');});
  var page=document.getElementById('page-'+id);
  if(!page){console.error('Missing page:','page-'+id);return;}
  page.classList.add('active');
  _qaEnsureInternalHome(page,id);
  _qaResetPageScroll(page);

  if(id!=='compass'&&window._gnssWatchId!=null){
    try{navigator.geolocation.clearWatch(window._gnssWatchId);window._gnssWatchId=null;}catch(e){}
  }
  // `default` was a retired pre-trusted-GNSS source name. Navigation now follows
  // the single authoritative state used by the production inline GNSS engine.
  if(id==='compass'&&!gnssHasTrustedFix){setTimeout(function(){tryBrowserGPS();},400);}
  if(id==='compass'){setTimeout(function(){var ds=gel('dev-slider');if(ds)ds.dispatchEvent(new Event('input'));},500);}
  if(id==='gnss'){setTimeout(function(){if(!gnssHasTrustedFix)tryBrowserGPS();},300);}
  if((id==='compass'||id==='gnss')&&gnssHasTrustedFix){updateQiblaFromPosition();}
  if(id==='quran'){_qrActive=true;try{qrInit();}catch(e){}}
  else{try{qrDeactivate();}catch(e){}}
  if(id==='serenity'){
    _skActive=true;
    setTimeout(function(){try{skInit();}catch(e){console.error('skInit error:',e);}},50);
  } else {
    _skActive=false;
    try{skDeactivate();}catch(e){}
  }

  // Home is the navigation hub. Internal screens never retain the legacy tab/ad chrome.
  var nav=document.querySelector('nav.nav,div.nav,.nav');
  if(nav)nav.style.display='none';
  var ad=document.querySelector('.ad-slot');
  if(ad)ad.style.display='none';

  _qaFinalizeNavigation(id,page);
}

/* Analytics is intentionally isolated from navigation logic. This loader only attaches
   the privacy-safe screen/view timer; it does not change GT(), sensors or page state. */
(function(){
  'use strict';
  if(document.querySelector('script[data-qibla-analytics-screen-tracker]'))return;
  var s=document.createElement('script');
  s.src='js/analytics/privacy-safe-screen-tracker.js?v=20260814-release1';
  s.defer=true;
  s.dataset.qiblaAnalyticsScreenTracker='1';
  s.onerror=function(){try{console.warn('[analytics] screen tracker unavailable');}catch(_){ }};
  (document.head||document.documentElement).appendChild(s);
})();
