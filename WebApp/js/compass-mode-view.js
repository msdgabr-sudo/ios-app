/*
 * QiblaAstro — Compass view mode controller
 * Visibility/layout only: does not modify Qibla calculations, compass heading or engine behavior.
 * © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
 */
(function (root) {
  'use strict';

  var STORAGE_KEY = 'qibla-compass-view-mode';
  var currentMode = 'digital';
  var headingSamples = [];
  var MAX_STABILITY_SAMPLES = 12;

  function byId(id){ return root.document ? root.document.getElementById(id) : null; }

  function loadVisualSkin(){
    if(!root.document) return;
    if(!root.document.querySelector('link[data-qibla-digital-visual-match]')){
      var link = root.document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'css/compass-digital-visual-match.css?v=20260808-061';
      link.setAttribute('data-qibla-digital-visual-match','true');
      (root.document.head || root.document.documentElement).appendChild(link);
    }
    if(!root.document.querySelector('link[data-qibla-digital-final-fixes]')){
      var finalLink = root.document.createElement('link');
      finalLink.rel = 'stylesheet';
      finalLink.href = 'css/compass-digital-final-fixes.css?v=20260808-061';
      finalLink.setAttribute('data-qibla-digital-final-fixes','true');
      (root.document.head || root.document.documentElement).appendChild(finalLink);
    }
    if(!root.document.querySelector('link[data-qibla-astro-gold-borders]')){
      var astroGoldLink = root.document.createElement('link');
      astroGoldLink.rel = 'stylesheet';
      astroGoldLink.href = 'css/compass-astro-gold-borders.css?v=20260808-062';
      astroGoldLink.setAttribute('data-qibla-astro-gold-borders','true');
      (root.document.head || root.document.documentElement).appendChild(astroGoldLink);
    }
  }

  function cardFromValue(id){
    var value = byId(id);
    if(!value) return null;
    return value.parentElement && value.parentElement.parentElement ? value.parentElement.parentElement : null;
  }

  function actionWrapper(actionName){
    if(!root.document) return null;
    var button = root.document.querySelector('button[onclick*="' + actionName + '"]');
    return button ? button.parentElement : null;
  }

  function ensureCompassHomeButton(){
    if(!root.document) return null;
    var button = byId('qa-compass-home-button');
    if(button) return button;

    button = root.document.createElement('button');
    button.id = 'qa-compass-home-button';
    button.type = 'button';
    button.hidden = true;
    button.setAttribute('aria-label','العودة إلى الشاشة الرئيسية');
    button.setAttribute('title','الرئيسية');
    button.innerHTML = '<svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true"><path d="M3.5 10.5 12 3l8.5 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-4.5v-6h-5v6H5a1.5 1.5 0 0 1-1.5-1.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>';

    button.style.position = 'fixed';
    button.style.right = '12px';
    button.style.left = 'auto';
    button.style.top = 'calc(env(safe-area-inset-top,0px) + 68px)';
    button.style.zIndex = '321';
    button.style.width = '40px';
    button.style.height = '40px';
    button.style.padding = '0';
    button.style.borderRadius = '12px';
    button.style.border = '1px solid rgba(216,174,76,.78)';
    button.style.background = 'linear-gradient(145deg,rgba(31,25,13,.96),rgba(8,14,23,.98))';
    button.style.color = '#D8AE4C';
    button.style.boxShadow = '0 7px 18px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,226,150,.14)';
    button.style.display = 'grid';
    button.style.placeItems = 'center';
    button.style.cursor = 'pointer';

    button.addEventListener('click',function(event){
      event.preventDefault();
      event.stopPropagation();
      button.hidden = true;
      var menu = root.document.querySelector('.qa-compass-menu-button');
      if(menu) menu.style.display = '';
      try{
        if(typeof root.GT === 'function') root.GT('home');
        else if(typeof GT === 'function') GT('home');
      }catch(_){}
    });

    (root.document.body || root.document.documentElement).appendChild(button);
    return button;
  }

  function syncCompassHomeButton(){
    if(!root.document) return;
    var page = byId('page-compass');
    var button = ensureCompassHomeButton();
    if(!button) return;
    var active = !!(page && page.classList.contains('active') &&
      (page.classList.contains('qa-digital-dashboard-active') || page.classList.contains('qa-astro-dashboard-active')));
    button.hidden = !active;
    button.style.display = active ? 'grid' : 'none';
    var menu = root.document.querySelector('.qa-compass-menu-button');
    if(menu) menu.style.display = active ? 'none' : '';
  }

  function watchCompassPage(){
    if(!root.document || typeof root.MutationObserver !== 'function') return;
    var page = byId('page-compass');
    if(!page || page.__qaHomeButtonObserver) return;
    var observer = new root.MutationObserver(syncCompassHomeButton);
    observer.observe(page,{attributes:true,attributeFilter:['class']});
    page.__qaHomeButtonObserver = observer;
  }

  function ensureDigitalActionRow(){
    if(!root.document) return null;
    var row = byId('qa-digital-action-row');
    if(row) return row;

    var gnss = actionWrapper('tryBrowserGPS');
    var cal = actionWrapper('showManualCal');
    var accuracy = byId('compass-accuracy');
    if(!gnss || !cal || !accuracy || !gnss.parentElement) return null;

    row = root.document.createElement('div');
    row.id = 'qa-digital-action-row';
    row.className = 'qa-digital-action-row';
    row.setAttribute('aria-label','أدوات البوصلة الرقمية');

    var confidence = root.document.createElement('div');
    confidence.id = 'qa-digital-confidence-card';
    confidence.className = 'qa-digital-confidence-card';
    confidence.setAttribute('aria-label','درجة الثقة');
    confidence.innerHTML = '<span class="qa-digital-confidence-icon">◎</span><div class="qa-digital-confidence-body"><b>درجة الثقة</b><div class="qa-digital-confidence-live"></div><span class="qa-digital-confidence-track"><i></i></span></div>';

    var live = confidence.querySelector('.qa-digital-confidence-live');
    live.appendChild(accuracy);

    var anchor = gnss;
    anchor.parentElement.insertBefore(row, anchor);
    row.appendChild(gnss);
    row.appendChild(confidence);
    row.appendChild(cal);
    return row;
  }

  function circularDiff(a,b){
    var d = Math.abs(Number(a)-Number(b)) % 360;
    return d > 180 ? 360-d : d;
  }

  function headingStability(){
    var heading = null;
    var available = false;
    try{
      available = (typeof compassAvailable !== 'undefined') ? !!compassAvailable : false;
      heading = (typeof deviceHeading !== 'undefined') ? Number(deviceHeading) : null;
    }catch(_){}

    if(!available || heading === null || !isFinite(heading)){
      headingSamples.length = 0;
      return null;
    }

    headingSamples.push(((heading % 360) + 360) % 360);
    if(headingSamples.length > MAX_STABILITY_SAMPLES) headingSamples.shift();
    if(headingSamples.length < 5) return {warming:true};

    var sx=0, sy=0;
    headingSamples.forEach(function(v){
      var r=v*Math.PI/180;
      sx += Math.cos(r); sy += Math.sin(r);
    });
    var mean=((Math.atan2(sy,sx)*180/Math.PI)+360)%360;
    var sum=0;
    headingSamples.forEach(function(v){ sum += circularDiff(v,mean); });
    return {warming:false,deviation:sum/headingSamples.length};
  }

  function setConfidence(card, accuracy, state, width, text, color){
    var bar = card ? card.querySelector('.qa-digital-confidence-track i') : null;
    if(card) card.setAttribute('data-state',state);
    if(bar) bar.style.width = width + '%';
    if(accuracy){
      accuracy.textContent = text;
      accuracy.style.color = color || '#91A8BA';
    }
  }

  function syncConfidenceVisual(){
    var accuracy = byId('compass-accuracy');
    var card = byId('qa-digital-confidence-card');
    if(!accuracy || !card) return;

    var available=false, accuracyValue=null;
    try{
      available = (typeof compassAvailable !== 'undefined') ? !!compassAvailable : false;
      accuracyValue = (typeof compassAccuracy !== 'undefined') ? compassAccuracy : null;
    }catch(_){}

    if(!available){
      headingSamples.length=0;
      setConfidence(card,accuracy,'empty',0,'بانتظار تشغيل البوصلة','#91A8BA');
      return;
    }

    if(accuracyValue !== null && accuracyValue !== undefined && isFinite(Number(accuracyValue)) && Number(accuracyValue) > 0){
      var a=Number(accuracyValue);
      if(a<=1) setConfidence(card,accuracy,'excellent',100,'ممتازة · دقة ±'+a.toFixed(1)+'°','#63C779');
      else if(a<=5) setConfidence(card,accuracy,'good',75,'جيدة · دقة ±'+a.toFixed(1)+'°','#7DB9D8');
      else if(a<=15) setConfidence(card,accuracy,'fair',50,'مقبولة · دقة ±'+a.toFixed(1)+'°','#C9A85D');
      else setConfidence(card,accuracy,'weak',25,'ضعيفة · دقة ±'+a.toFixed(1)+'°','#C76868');
      return;
    }

    var stable=headingStability();
    if(!stable){
      setConfidence(card,accuracy,'empty',0,'بانتظار قراءة مستقرة','#91A8BA');
      return;
    }
    if(stable.warming){
      setConfidence(card,accuracy,'empty',15,'جاري قياس ثبات القراءة…','#91A8BA');
      return;
    }

    var d=stable.deviation;
    if(d<=1) setConfidence(card,accuracy,'excellent',100,'ممتازة · ثبات ±'+d.toFixed(1)+'°','#63C779');
    else if(d<=3) setConfidence(card,accuracy,'good',75,'جيدة · ثبات ±'+d.toFixed(1)+'°','#7DB9D8');
    else if(d<=7) setConfidence(card,accuracy,'fair',50,'مقبولة · ثبات ±'+d.toFixed(1)+'°','#C9A85D');
    else setConfidence(card,accuracy,'weak',25,'ضعيفة · ثبات ±'+d.toFixed(1)+'°','#C76868');
  }

  function groups(){
    return {
      digital: [
        byId('live-compass-card'),
        cardFromValue('box-qibla'),
        cardFromValue('box-diff')
      ],
      astro: [
        byId('astro-body-card'),
        cardFromValue('astro-qibla-value'),
        cardFromValue('astro-deviation-value')
      ],
      digitalActions: [
        actionWrapper('showManualCal'),
        actionWrapper('tryBrowserGPS')
      ]
    };
  }

  function show(card, visible){
    if(!card) return;
    card.style.display = visible ? '' : 'none';
    card.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

  function apply(mode){
    currentMode = mode === 'astro' ? 'astro' : 'digital';
    var row = ensureDigitalActionRow();
    var set = groups();
    set.digital.forEach(function(card){ show(card, currentMode === 'digital'); });
    set.astro.forEach(function(card){ show(card, currentMode === 'astro'); });
    set.digitalActions.forEach(function(card){ show(card, currentMode === 'digital'); });
    show(row, currentMode === 'digital');
    if(currentMode !== 'digital') headingSamples.length=0;
    syncConfidenceVisual();
    syncCompassHomeButton();
    try{ root.sessionStorage.setItem(STORAGE_KEY,currentMode); }catch(_){}
    return currentMode;
  }

  function setMode(mode){ return apply(mode); }

  function restore(){
    var saved = 'digital';
    try{ saved = root.sessionStorage.getItem(STORAGE_KEY) || 'digital'; }catch(_){}
    return apply(saved);
  }

  root.QiblaCompassViewMode = Object.freeze({set:setMode,apply:apply,restore:restore,get:function(){return currentMode;}});
  root.addEventListener('qiblaastro:compass-view-mode',function(event){
    apply(event && event.detail ? event.detail.mode : 'digital');
  });

  if(root.document){
    loadVisualSkin();
    if(root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded',function(){ restore(); ensureCompassHomeButton(); watchCompassPage(); syncCompassHomeButton(); root.setInterval(syncConfidenceVisual,500); },{once:true});
    else { restore(); ensureCompassHomeButton(); watchCompassPage(); syncCompassHomeButton(); root.setInterval(syncConfidenceVisual,500); }
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
