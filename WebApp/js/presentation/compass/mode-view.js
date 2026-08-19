/*
 * QiblaAstro — Compass view mode controller
 * Visibility/layout only. Canonical values/actions are consumed through QiblaDigitalCompassAdapter.
 * © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
 */
(function(root){'use strict';
  var STORAGE_KEY='qibla-compass-view-mode';
  var currentMode='digital';
  function byId(id){return root.document?root.document.getElementById(id):null;}
  function adapter(){return root.QiblaDigitalCompassAdapter||null;}

  function loadVisualSkin(){
    if(!root.document)return;
    if(!root.document.querySelector('link[data-qibla-digital-visual-match]')){
      var link=root.document.createElement('link');link.rel='stylesheet';link.href='css/presentation/compass/digital-visual-match.css?v=20260809-stage-b2';link.setAttribute('data-qibla-digital-visual-match','true');(root.document.head||root.document.documentElement).appendChild(link);
    }
    if(!root.document.querySelector('link[data-qibla-digital-final-fixes]')){
      var finalLink=root.document.createElement('link');finalLink.rel='stylesheet';finalLink.href='css/presentation/compass/digital-final-fixes.css?v=20260809-stage-b2';finalLink.setAttribute('data-qibla-digital-final-fixes','true');(root.document.head||root.document.documentElement).appendChild(finalLink);
    }
  }
  function cardFromValue(id){var value=byId(id);return value&&value.parentElement&&value.parentElement.parentElement?value.parentElement.parentElement:null;}
  function actionWrapper(actionName){if(!root.document)return null;var button=root.document.querySelector('button[onclick*="'+actionName+'"]');return button?button.parentElement:null;}

  function ensureCompassHomeButton(){
    if(!root.document)return null;
    var button=byId('qa-compass-home-button');if(button)return button;
    button=root.document.createElement('button');button.id='qa-compass-home-button';button.type='button';button.hidden=true;button.setAttribute('aria-label','العودة إلى الشاشة الرئيسية');button.setAttribute('title','الرئيسية');button.innerHTML='<svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true"><path d="M3.5 10.5 12 3l8.5 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-4.5v-6h-5v6H5a1.5 1.5 0 0 1-1.5-1.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>';
    button.style.position='fixed';button.style.right='12px';button.style.top='calc(env(safe-area-inset-top,0px) + 68px)';button.style.zIndex='321';button.style.width='40px';button.style.height='40px';button.style.padding='0';button.style.borderRadius='12px';button.style.border='1px solid rgba(216,174,76,.78)';button.style.background='linear-gradient(145deg,rgba(31,25,13,.96),rgba(8,14,23,.98))';button.style.color='#D8AE4C';button.style.boxShadow='0 7px 18px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,226,150,.14)';button.style.display='grid';button.style.placeItems='center';button.style.cursor='pointer';
    button.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();var a=adapter();if(a&&a.goHome)a.goHome();});
    (root.document.body||root.document.documentElement).appendChild(button);return button;
  }
  function syncCompassHomeButton(){var page=byId('page-compass'),button=ensureCompassHomeButton();if(!button)return;var active=!!(page&&page.classList.contains('active')&&(page.classList.contains('qa-digital-dashboard-active')||page.classList.contains('qa-astro-dashboard-active')));button.hidden=!active;button.style.display=active?'grid':'none';}
  function watchCompassPage(){if(!root.document||typeof root.MutationObserver!=='function')return;var page=byId('page-compass');if(!page||page.__qaDigitalHomeObserver)return;var observer=new root.MutationObserver(syncCompassHomeButton);observer.observe(page,{attributes:true,attributeFilter:['class']});page.__qaDigitalHomeObserver=observer;}

  function ensureDigitalActionRow(){
    if(!root.document)return null;var row=byId('qa-digital-action-row');if(row)return row;
    var gnss=actionWrapper('tryBrowserGPS'),cal=actionWrapper('showManualCal'),accuracy=byId('compass-accuracy');if(!gnss||!cal||!accuracy||!gnss.parentElement)return null;
    row=root.document.createElement('div');row.id='qa-digital-action-row';row.className='qa-digital-action-row';row.setAttribute('aria-label','أدوات البوصلة الرقمية');
    var confidence=root.document.createElement('div');confidence.id='qa-digital-confidence-card';confidence.className='qa-digital-confidence-card';confidence.setAttribute('aria-label','حالة دقة البوصلة');confidence.innerHTML='<span class="qa-digital-confidence-icon">◎</span><div class="qa-digital-confidence-body"><b>درجة الثقة</b><div class="qa-digital-confidence-live"></div><span class="qa-digital-confidence-track"><i></i></span></div>';
    confidence.querySelector('.qa-digital-confidence-live').appendChild(accuracy);
    gnss.parentElement.insertBefore(row,gnss);row.appendChild(gnss);row.appendChild(confidence);row.appendChild(cal);return row;
  }
  function setConfidence(card,accuracy,state,width,text,color){var bar=card?card.querySelector('.qa-digital-confidence-track i'):null;if(card)card.setAttribute('data-state',state);if(bar)bar.style.width=width+'%';if(accuracy){accuracy.textContent=text;accuracy.style.color=color||'#91A8BA';}}
  function syncConfidenceVisual(){
    var accuracy=byId('compass-accuracy'),card=byId('qa-digital-confidence-card'),a=adapter();if(!accuracy||!card||!a||!a.snapshot)return;
    var s=a.snapshot(),n=s.accuracyDeg;
    if(n!==null&&Number.isFinite(n)&&n>0){if(n<=1)setConfidence(card,accuracy,'excellent',100,'ممتازة · دقة ±'+n.toFixed(1)+'°','#63C779');else if(n<=5)setConfidence(card,accuracy,'good',75,'جيدة · دقة ±'+n.toFixed(1)+'°','#7DB9D8');else if(n<=15)setConfidence(card,accuracy,'fair',50,'مقبولة · دقة ±'+n.toFixed(1)+'°','#C9A85D');else setConfidence(card,accuracy,'weak',25,'ضعيفة · دقة ±'+n.toFixed(1)+'°','#C76868');return;}
    if(s.headingDeg!==null)setConfidence(card,accuracy,'active',55,s.accuracyText||'البوصلة تعمل · الدقة غير متاحة','#7DB9D8');else setConfidence(card,accuracy,'empty',0,s.accuracyText||'بانتظار تشغيل البوصلة','#91A8BA');
  }
  function groups(){return{digital:[byId('live-compass-card'),cardFromValue('box-qibla'),cardFromValue('box-diff')],astro:[byId('astro-body-card'),cardFromValue('astro-qibla-value'),cardFromValue('astro-deviation-value')],digitalActions:[actionWrapper('showManualCal'),actionWrapper('tryBrowserGPS')]};}
  function show(card,visible){if(!card)return;card.style.display=visible?'':'none';card.setAttribute('aria-hidden',visible?'false':'true');}
  function syncModeClasses(){var page=byId('page-compass');if(!page)return;page.classList.toggle('qa-digital-dashboard-active',currentMode==='digital');page.classList.toggle('qa-astro-dashboard-active',currentMode==='astro');}
  function apply(mode){currentMode=mode==='astro'?'astro':'digital';var layout=root.QiblaDigitalCompassLayout;if(layout&&typeof layout.mount==='function')layout.mount();syncModeClasses();var row=ensureDigitalActionRow(),set=groups();set.digital.forEach(function(card){show(card,currentMode==='digital');});set.astro.forEach(function(card){show(card,currentMode==='astro');});set.digitalActions.forEach(function(card){show(card,currentMode==='digital');});show(row,currentMode==='digital');syncConfidenceVisual();syncCompassHomeButton();try{root.sessionStorage.setItem(STORAGE_KEY,currentMode);}catch(_){}return currentMode;}
  function restore(){var saved='digital';try{saved=root.sessionStorage.getItem(STORAGE_KEY)||'digital';}catch(_){}return apply(saved);}
  root.QiblaCompassViewMode=Object.freeze({set:apply,apply:apply,restore:restore,get:function(){return currentMode;}});
  root.addEventListener('qiblaastro:compass-view-mode',function(event){apply(event&&event.detail?event.detail.mode:'digital');});
  if(root.document){loadVisualSkin();var boot=function(){restore();ensureCompassHomeButton();watchCompassPage();syncCompassHomeButton();root.setInterval(syncConfidenceVisual,500);};if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();}
})(typeof globalThis!=='undefined'?globalThis:window);
