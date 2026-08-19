/* English i18n staged loader — presentation only. Guaranteed entry point because home-final.js is loaded by index.html. */
(function(){
  'use strict';
  if(document.querySelector('script[data-mizan-english-rollout]'))return;
  var s=document.createElement('script');
  s.src='js/i18n/english-rollout.js?v=20260812-en2';
  s.async=false;
  s.dataset.mizanEnglishRollout='1';
  s.onerror=function(){try{console.error('[i18n] English rollout script failed to load; Arabic remains unchanged.');}catch(_){}};
  (document.head||document.documentElement).appendChild(s);
})();

/*
 * QiblaAstro — Reference Home Screen Bindings
 * Static home markup lives in index.html. This file only binds navigation and live data.
 * Falaki bridge rule: home Sun/Moon values are DISPLAY-ONLY mirrors of pages/falaki.html.
 * No astronomical equations, verification logic, or Falaki calculations are changed here.
 * © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
 */
(function () {
  'use strict';
  function byId(id){return document.getElementById(id)}
  function text(id,fallback){var e=byId(id),v=e&&e.textContent?e.textContent.trim():'';return v||fallback}
  function go(page){try{if(typeof window.GT==='function')window.GT(page)}catch(_){}}
  function currentLang(){try{return (window.CFG&&window.CFG.lang)||JSON.parse(localStorage.getItem('qibla-cfg')||'{}').lang||document.documentElement.lang||'ar'}catch(_){return document.documentElement.lang||'ar'}}
  function updateLangButton(){var b=byId('qaLangToggle');if(!b)return;var lang=currentLang()==='en'?'en':'ar';b.setAttribute('aria-label',lang==='ar'?'Switch to English':'التبديل إلى العربية');b.innerHTML='<span class="qa-lang-globe">◎</span><b>'+(lang==='ar'?'EN':'ع')+'</b>'}
  function toggleLanguage(){
    var next=currentLang()==='ar'?'en':'ar';
    try{if(window.CFG){window.CFG.lang=next;if(typeof window.saveCfg==='function')window.saveCfg()}else{var cfg=JSON.parse(localStorage.getItem('qibla-cfg')||'{}');cfg.lang=next;localStorage.setItem('qibla-cfg',JSON.stringify(cfg))}}catch(_){}
    try{if(typeof window.setLanguage==='function')window.setLanguage(next);else if(typeof window.applyLanguage==='function')window.applyLanguage(next)}catch(_){}
    document.documentElement.lang=next;document.documentElement.dir=next==='ar'?'rtl':'ltr';
    try{window.dispatchEvent(new CustomEvent('qiblaastro:language-change',{detail:{lang:next}}))}catch(_){}
    updateLangButton();
  }
  function setCompassMode(mode){
    var next=mode==='astro'?'astro':'digital';
    try{sessionStorage.setItem('qibla-compass-view-mode',next)}catch(_){}
    try{if(window.QiblaCompassViewMode&&typeof window.QiblaCompassViewMode.set==='function')window.QiblaCompassViewMode.set(next)}catch(_){}
    try{window.dispatchEvent(new CustomEvent('qiblaastro:compass-view-mode',{detail:{mode:next}}))}catch(_){}
  }

  function falakiDocument(){
    try{
      var frame=byId('qa-falaki-frame');
      if(!frame||!frame.contentDocument)return null;
      return frame.contentDocument;
    }catch(_){return null}
  }
  function falakiText(doc,id){
    try{var e=doc&&doc.getElementById(id),v=e&&e.textContent?e.textContent.trim():'';return v||''}catch(_){return ''}
  }
  function syncFalakiCards(){
    var doc=falakiDocument();
    if(!doc)return false;

    /* Mirror the already-rendered Falaki values verbatim; do not recalculate them. */
    var moonIll=falakiText(doc,'moonIll');
    var moonAlt=falakiText(doc,'moonAlt');
    var moonAz=falakiText(doc,'moonAz');
    var sunAlt=falakiText(doc,'sunAlt');
    var sunHeadline=falakiText(doc,'sunHeadline');

    if(moonIll&&moonIll!=='—'){var moon=byId('qaMoon');if(moon)moon.textContent=moonIll}
    if(moonAlt&&moonAlt!=='—'&&moonAz&&moonAz!=='—'){
      var phase=byId('qaMoonPhase');
      if(phase){
        phase.textContent='الارتفاع '+moonAlt+' · السمت '+moonAz;
        phase.style.setProperty('font-size','.52rem','important');
        phase.style.setProperty('font-weight','600','important');
        phase.style.setProperty('white-space','nowrap','important');
        phase.style.setProperty('color','#c9d9ef','important');
      }
    }
    if(sunAlt&&sunAlt!=='—'){var sun=byId('qaSun');if(sun)sun.textContent=sunAlt}
    if(sunHeadline&&sunHeadline!=='—'){
      var state=document.querySelector('#qa-home .qa-sun-card > strong');
      if(state)state.textContent=sunHeadline.replace(/^الشمس\s+/,'');
    }
    return !!((moonIll&&moonIll!=='—')||(sunAlt&&sunAlt!=='—'));
  }

  function sync(){
    var map={qaBearing:['hm-qibla-deg','---°'],qaGreg:['hm-date-greg','جاري حساب التاريخ'],qaHijri:['hm-date-hijri','جاري حساب التاريخ الهجري'],qaPrayer:['hm-prayer-name','الصلاة القادمة'],qaPrayerTime:['hm-prayer-time','--:--'],qaPrayerEta:['hm-prayer-eta',''],qaGps:['hm-gps-src','في انتظار GNSS']};
    Object.keys(map).forEach(function(target){var e=byId(target);if(e)e.textContent=text(map[target][0],map[target][1])});

    /* Sun and Moon on Home intentionally come from Falaki only. */
    syncFalakiCards();
  }
  function loadKaaba(){
    var img=byId('qaKaabaImage');if(!img)return;
    fetch('images/home/kaaba-reference.data-uri.txt?v=1',{cache:'no-store'})
      .then(function(r){if(!r.ok)throw new Error('kaaba asset');return r.text()})
      .then(function(src){img.src=src.trim();img.classList.add('ready')})
      .catch(function(){img.classList.add('fallback')});
  }
  function bind(){
    var root=byId('qa-home');if(!root||root.dataset.bound==='1')return !!root;
    root.dataset.bound='1';
    root.addEventListener('click',function(event){
      var lang=event.target.closest('#qaLangToggle');if(lang){toggleLanguage();return}
      var button=event.target.closest('[data-go]');
      if(button){if(button.dataset.compassMode)setCompassMode(button.dataset.compassMode);go(button.dataset.go)}
    });
    updateLangButton();loadKaaba();sync();
    if(typeof MutationObserver!=='undefined') ['hm-qibla-deg','hm-date-greg','hm-date-hijri','hm-prayer-name','hm-prayer-time','hm-prayer-eta','hm-gps-src'].forEach(function(source){var e=byId(source);if(e)new MutationObserver(sync).observe(e,{childList:true,subtree:true,characterData:true})});
    window.addEventListener('qiblaastro:gnss-update',sync);

    /* Falaki renders every 30 s; mirror it more frequently so Home reflects it promptly. */
    setTimeout(sync,250);setTimeout(sync,1200);setInterval(syncFalakiCards,2000);
    return true;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();

/* Android/TWA Back compatibility layer.
   The production index.html still contains a legacy inline GT wrapper and popstate
   listener. home-final.js is a guaranteed deferred entry point, so it runs after
   those inline declarations. This layer becomes the single runtime owner of top-
   level history and the Quran reader sub-level without touching any calculation,
   sensor, astronomical, GNSS, prayer or verification engine. */
(function(){
  'use strict';
  var KEY='qiblaastroNav';
  var VERSION=3;
  var renderPage=(typeof window._origGT==='function')?window._origGT:window.GT;
  var originalQrOpen=(typeof window.qrOpen==='function')?window.qrOpen:null;
  var originalQrBack=(typeof window.qrBack==='function')?window.qrBack:null;
  if(typeof renderPage!=='function')return;

  function valid(id){return !!(id&&document.getElementById('page-'+id));}
  function stateFor(page,sub){
    var s={};
    s[KEY]={version:VERSION,page:page};
    if(sub)s[KEY].sub=sub;
    return s;
  }
  function navState(state){
    var nav=state&&state[KEY];
    return nav&&nav.version===VERSION&&valid(nav.page)?nav:null;
  }
  function statePage(state){var nav=navState(state);return nav?nav.page:null;}
  function isQuranReaderState(state){
    var nav=navState(state);
    return !!(nav&&nav.page==='quran'&&nav.sub&&nav.sub.type==='reader'&&Number.isInteger(nav.sub.surah)&&nav.sub.surah>=1&&nav.sub.surah<=114);
  }
  function quranReaderVisible(){
    try{var reader=document.getElementById('qr-reader');return !!(reader&&reader.style.display!=='none');}catch(_){return false;}
  }
  function domPage(){
    try{
      var active=document.querySelector('.page.active');
      if(active&&active.id&&active.id.indexOf('page-')===0){
        var id=active.id.slice(5);if(valid(id))return id;
      }
    }catch(_){ }
    return 'home';
  }
  function render(id){try{renderPage(id);}catch(err){try{console.error('[nav] render failed',err);}catch(_){}}}
  function closeQuranReader(){
    if(originalQrBack&&quranReaderVisible()){
      try{originalQrBack();}catch(err){try{console.error('[nav] Quran reader close failed',err);}catch(_){}}
    }
  }
  function renderHistoryState(state){
    var nav=navState(state);
    if(!nav)return;
    if(nav.page==='quran'){
      render('quran');
      if(nav.sub&&nav.sub.type==='reader'&&originalQrOpen){
        var surah=Number(nav.sub.surah);
        if(Number.isInteger(surah)&&surah>=1&&surah<=114){
          try{originalQrOpen(surah);}catch(err){try{console.error('[nav] Quran reader restore failed',err);}catch(_){}}
          return;
        }
      }
      closeQuranReader();
      return;
    }
    closeQuranReader();
    render(nav.page);
  }

  // Replace the legacy initial/null state in place. No extra history entry is
  // created on startup, so Back from Home remains Android/browser-owned.
  try{history.replaceState(stateFor('home'),'');}catch(_){ }

  window.GT=function(id){
    if(!id)id='home';
    if(!valid(id)){try{console.error('Missing page:','page-'+id);}catch(_){ }return;}
    var current=statePage(history.state)||'home';
    var visible=domPage();

    if(id==='home'){
      if(visible!=='home'&&current!=='home'){
        // If a Quran reader sub-level is open, consume it first so browser Back
        // remains a true hierarchy: reader -> Quran index -> Home.
        try{history.back();return;}catch(_){ }
      }
      try{history.replaceState(stateFor('home'),'');}catch(_){ }
      closeQuranReader();
      render('home');
      return;
    }

    try{
      if(current==='home')history.pushState(stateFor(id),'');
      else history.replaceState(stateFor(id),'');
    }catch(_){ }
    if(id!=='quran')closeQuranReader();
    render(id);
  };

  // Quran reader is a genuine child navigation level. Opening a Surah pushes one
  // child entry above the Quran index; moving next/previous Surah replaces that
  // child entry instead of growing history. The visible reader implementation is
  // left untouched and is called only after the history contract is established.
  if(originalQrOpen){
    window.qrOpen=function(num){
      var surah=Number(num);
      if(!Number.isInteger(surah)||surah<1||surah>114)return originalQrOpen(num);
      var current=navState(history.state);
      try{
        if(current&&current.page==='quran'&&current.sub&&current.sub.type==='reader'){
          history.replaceState(stateFor('quran',{type:'reader',surah:surah}),'');
        }else if(current&&current.page==='quran'){
          history.pushState(stateFor('quran',{type:'reader',surah:surah}),'');
        }
      }catch(_){ }
      return originalQrOpen(surah);
    };
  }

  if(originalQrBack){
    window.qrBack=function(){
      if(isQuranReaderState(history.state)){
        try{history.back();return;}catch(_){ }
      }
      return originalQrBack();
    };
  }

  // Capture phase is intentional: it runs before the legacy inline bubble-phase
  // popstate listener, then stops that obsolete handler from adding/replaying its
  // private _pageHistory stack. The browser has already moved the history index;
  // we render exactly the state it selected, including Quran reader sub-levels.
  window.addEventListener('popstate',function(event){
    try{event.stopImmediatePropagation();}catch(_){ }
    if(navState(event.state))renderHistoryState(event.state);
    // If the state is outside QiblaAstro, do nothing: Android/Chrome owns it.
  },true);

  window.__qiblaBackNavigation={version:VERSION,owner:'home-final',stateKey:KEY,quranReader:true};
})();

/* Serenity is intentionally isolated from Home/Compass engines. This loader only attaches
   the Quran streaming presentation module after the document is available. */
(function(){
  'use strict';
  function loadSerenity(){
    if(document.querySelector('script[data-serenity-quran-stream]'))return;
    var s=document.createElement('script');
    s.src='js/serenity-quran-stream.js';
    s.defer=true;
    s.dataset.serenityQuranStream='1';
    document.head.appendChild(s);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadSerenity,{once:true});else loadSerenity();
})();

/* PWA registration lives here because home-final.js is a guaranteed deferred script in
   index.html. This keeps Service Worker startup independent from the legacy inline PWA
   block and does not touch calculations, sensors, navigation or screen rendering. */
(function(){
  'use strict';

  function syncNetworkState(){
    try{if(document.body)document.body.setAttribute('data-network',navigator.onLine?'online':'offline');}catch(_){ }
  }
  window.addEventListener('online',syncNetworkState);
  window.addEventListener('offline',syncNetworkState);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncNetworkState,{once:true});else syncNetworkState();

  window.addEventListener('beforeinstallprompt',function(event){
    event.preventDefault();
    window.__qiblaDeferredInstallPrompt=event;
    console.log('[PWA] Install prompt available');
  });
  window.addEventListener('appinstalled',function(){
    window.__qiblaDeferredInstallPrompt=null;
    console.log('[PWA] App installed');
  });

  if(!('serviceWorker' in navigator))return;

  function registerWorker(){
    navigator.serviceWorker.register('./service-worker.js',{scope:'./'})
      .then(function(registration){
        console.log('[SW] Registered:',registration.scope);
        try{registration.update();}catch(_){ }

        navigator.serviceWorker.addEventListener('message',function(event){
          var data=event&&event.data;
          if(!data||data.type!=='SW_UPDATED')return;
          console.log('✅ QiblaAstro Updated:',data.version);
          try{localStorage.setItem('qiblaastro-version',data.version||'unknown');}catch(_){ }
        });
        navigator.serviceWorker.addEventListener('controllerchange',function(){
          console.log('[SW] Controller changed — active worker updated');
        });
      })
      .catch(function(error){console.error('[SW] Registration failed:',error);});
  }

  if(document.readyState==='complete')registerWorker();
  else window.addEventListener('load',registerWorker,{once:true});
})();

/* PWA shortcut routing — presentation only. The manifest exposes ?page= shortcuts;
   validate the requested destination and invoke the existing navigation controller.
   No engine, sensor, astronomical, GNSS or verification logic is changed here. */
(function(){
  'use strict';
  var allowed={compass:1,prayer:1,azkar:1,quran:1};
  var requested='';
  try{requested=(new URLSearchParams(window.location.search)).get('page')||'';}catch(_){return;}
  if(!allowed[requested])return;
  var tries=0;
  function openRequestedPage(){
    if(typeof window.GT==='function'&&document.getElementById('page-'+requested)){
      try{window.GT(requested);}catch(_){ }
      return;
    }
    if(++tries<40)setTimeout(openRequestedPage,100);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',openRequestedPage,{once:true});else openRequestedPage();
})();

/* Google Analytics 4 — privacy-safe web/PWA telemetry only.
   No GNSS coordinates, camera data, celestial measurements, prayer history or personal data are sent. */
(function(){
  'use strict';
  var GA_ID='G-1D1GKVZB74';
  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
  window.gtag('js',new Date());
  window.gtag('config',GA_ID,{send_page_view:true});

  function displayMode(){
    try{
      if(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)return 'standalone';
      if(window.navigator&&window.navigator.standalone)return 'standalone';
    }catch(_){ }
    return 'browser';
  }
  function send(name,params){try{window.gtag('event',name,params||{});}catch(_){ }}

  send('app_open',{app_surface:displayMode(),app_name:'QiblaAstro'});

  document.addEventListener('click',function(event){
    var target=event.target&&event.target.closest?event.target.closest('[data-go]'):null;
    if(!target)return;
    var destination=target.getAttribute('data-go')||'';
    if(!destination)return;
    send('screen_view',{app_name:'QiblaAstro',screen_name:destination,app_surface:displayMode()});
  },true);

  window.addEventListener('appinstalled',function(){send('pwa_install',{app_name:'QiblaAstro'});});
})();
