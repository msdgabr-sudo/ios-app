/* QiblaAstro — Presentation bootstrap only.
 * Loads external presentation screens without scientific calculations.
 * © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved. */
(function(root){
'use strict';
var compassRequested=false,prayerRequested=false,falakiRequested=false,azkarRequested=false,quranRequested=false,serenityRequested=false;
var prayerCoreState='idle',prayerCoreWaiters=[];
var NATIVE_TOKEN_KEY='qiblaastro:native-token';

function captureNativeTokenEarly(){
  try{
    var raw=String(root.location&&root.location.hash||'').replace(/^#/,'');
    if(!raw)return '';
    var params=new URLSearchParams(raw),token=params.get('nativeToken');
    if(!token||token.length<32)return '';
    root.sessionStorage.setItem(NATIVE_TOKEN_KEY,token);
    params.delete('nativeToken');
    var clean=params.toString();
    root.history.replaceState(root.history.state||null,'',root.location.pathname+root.location.search+(clean?'#'+clean:''));
    return token;
  }catch(_){return '';}
}

function loadScript(src,marker,onload){if(!root.document)return;if(root.document.querySelector('script['+marker+']')){if(onload)onload();return;}var s=root.document.createElement('script');s.src=src;s.async=false;s.setAttribute(marker,'true');if(onload)s.onload=onload;(root.document.head||root.document.documentElement).appendChild(s);}
function loadStyle(href,marker){if(!root.document||root.document.querySelector('link['+marker+']'))return;var l=root.document.createElement('link');l.rel='stylesheet';l.href=href;l.setAttribute(marker,'true');(root.document.head||root.document.documentElement).appendChild(l);}
function loadLocationServiceControl(){loadScript('js/presentation/location-service-control.js?v=20260818-native-location1','data-qibla-location-service-control');}
function flushPrayerCore(){var q=prayerCoreWaiters.splice(0);q.forEach(function(fn){try{fn();}catch(_){}});}
function loadPrayerCore(onready){
  if(typeof onready==='function')prayerCoreWaiters.push(onready);
  if(prayerCoreState==='ready'){flushPrayerCore();return;}
  if(prayerCoreState==='loading')return;
  prayerCoreState='loading';
  loadScript('js/presentation/prayer/native-plan.js?v=20260818-adhan-core2','data-qibla-prayer-native-plan',function(){
    loadScript('js/presentation/prayer/adhan-ui.js?v=20260818-adhan-core2','data-qibla-prayer-adhan-ui',function(){
      loadScript('js/presentation/prayer/schedule-sync.js?v=20260818-adhan-core2','data-qibla-prayer-sync',function(){
        prayerCoreState='ready';flushPrayerCore();
      });
    });
  });
}
function loadPermissions(){loadScript('js/presentation/permissions-onboarding.js?v=20260818-location-adhan4','data-qibla-permissions-onboarding');}
function loadInternalChrome(){loadStyle('css/internal-screen-chrome.css?v=20260814-surface-contract1','data-qibla-internal-chrome-style');loadStyle('css/phone-acceptance-fixes.css?v=20260814-acceptance2','data-qibla-phone-acceptance-style');loadScript('js/presentation/internal-screen-chrome.js?v=20260810-azkar-subviews-nohome2','data-qibla-internal-chrome');}
function loadInternalLanguageBridge(){loadScript('js/i18n/internal-screen-language-bridge.js?v=20260814-prayer-complete2','data-qibla-internal-language-bridge');}
function loadSafeI18n(){loadScript('js/i18n/english-rollout.js?v=20260812-safe-i18n-home-picker1','data-qibla-safe-i18n',function(){loadScript('js/i18n/home-language-picker.js?v=20260814-switch-stability2','data-qibla-home-language-picker');});}
function loadCompass(){if(compassRequested)return;compassRequested=true;loadScript('js/presentation/compass/host.js?v=20260814-deviation-action1','data-qibla-compass-host',function(){var host=root.QiblaCompassHost;if(!host||typeof host.mount!=='function'){compassRequested=false;return;}host.mount().then(function(){loadScript('js/compass-mode-view.js?v=20260809-reference-ui1','data-qibla-compass-mode',function(){loadScript('js/compass-premium-render.js?v=20260809-reference-ui1','data-qibla-compass-premium',function(){loadScript('js/presentation/compass/trusted-qibla-refresh.js?v=20260814-trusted-qibla1','data-qibla-trusted-qibla-refresh');loadStyle('css/compass-astro-dashboard.css?v=20260809-reference-ui1','data-qibla-astro-dashboard-style');loadStyle('css/compass-confidence-final.css?v=20260809-reference-ui1','data-qibla-confidence-final-style');loadScript('js/compass-astro-dashboard.js?v=20260809-reference-ui1','data-qibla-astro-dashboard',function(){loadStyle('css/astro-verification-controls.css?v=20260809-verified-controls1','data-qibla-astro-controls-style');loadScript('js/presentation/astro-verification-controls.js?v=20260809-verified-controls1','data-qibla-astro-controls',function(){loadScript('js/presentation/compass/astro-live-heading-mirror.js?v=20260810-live-heading1','data-qibla-astro-live-heading',function(){loadStyle('css/live-deviation-confidence.css?v=20260809-live-deviation1','data-qibla-live-deviation-confidence-style');loadScript('js/presentation/compass/live-deviation-confidence.js?v=20260809-live-deviation1','data-qibla-live-deviation-confidence');});});});});});}).catch(function(){compassRequested=false;});});}
function loadPrayerSettingsUis(){loadScript('js/presentation/prayer/location-settings-ui.js?v=20260814-phone-acceptance1','data-qibla-prayer-location-settings',function(){if(root.QiblaPrayerLocationSettingsUI&&typeof root.QiblaPrayerLocationSettingsUI.bind==='function')root.QiblaPrayerLocationSettingsUI.bind();});loadScript('js/presentation/prayer/calculation-settings-ui.js?v=20260814-phone-acceptance1','data-qibla-prayer-calculation-settings',function(){if(root.QiblaPrayerCalculationSettingsUI&&typeof root.QiblaPrayerCalculationSettingsUI.bind==='function')root.QiblaPrayerCalculationSettingsUI.bind();});}
function mountPrayerPresentation(){
  loadScript('js/presentation/prayer/audio-readiness.js?v=20260814-local-adhan2','data-qibla-prayer-audio-readiness',function(){
    loadScript('js/presentation/prayer/screen.js?v=20260814-phone-acceptance1','data-qibla-prayer-screen',function(){
      if(root.QiblaPrayerScreen&&typeof root.QiblaPrayerScreen.mount==='function')root.QiblaPrayerScreen.mount();
      if(root.QiblaPrayerAudioReadiness&&typeof root.QiblaPrayerAudioReadiness.bind==='function')root.QiblaPrayerAudioReadiness.bind();
      loadPrayerSettingsUis();
      loadScript('js/presentation/prayer/audio-finalizer.js?v=20260814-local-adhan2','data-qibla-prayer-audio-finalizer',function(){if(root.QiblaPrayerAudioFinalizer&&typeof root.QiblaPrayerAudioFinalizer.bind==='function')root.QiblaPrayerAudioFinalizer.bind();});
    });
  });
}
function loadPrayer(){if(prayerRequested)return;prayerRequested=true;loadStyle('css/presentation/prayer/screen.css?v=20260808-prayer-final1','data-qibla-prayer-style');loadScript('js/presentation/page-registry.js?v=20260814-prayer-overrides1','data-qibla-page-registry',function(){loadScript('js/presentation/page-loader.js?v=20260810-klir-prayer2','data-qibla-page-loader',function(){var loader=root.QiblaPresentationPageLoader;if(!loader||typeof loader.mount!=='function'){prayerRequested=false;return;}loader.mount('prayer').then(function(){loadPrayerCore(mountPrayerPresentation);}).catch(function(){prayerRequested=false;});});});}
function loadFalaki(){if(falakiRequested)return;falakiRequested=true;loadScript('js/presentation/falaki/host.js?v=20260810-klir-falaki3','data-qibla-falaki-host',function(){if(root.QiblaFalakiHost&&typeof root.QiblaFalakiHost.mount==='function')root.QiblaFalakiHost.mount();loadScript('js/presentation/falaki/event-times-sync.js?v=20260814-event-times1','data-qibla-falaki-event-times');});}
function loadAzkar(){if(azkarRequested)return;azkarRequested=true;loadScript('js/presentation/azkar/host.js?v=20260810-klir-azkar3','data-qibla-azkar-host',function(){if(root.QiblaAzkarHost&&typeof root.QiblaAzkarHost.mount==='function')root.QiblaAzkarHost.mount();});}
function loadQuran(){if(quranRequested)return;quranRequested=true;loadScript('js/presentation/quran/host.js?v=20260814-app-home1','data-qibla-quran-host',function(){if(root.QiblaQuranHost&&typeof root.QiblaQuranHost.mount==='function')root.QiblaQuranHost.mount();});}
function loadSerenity(){if(serenityRequested)return;serenityRequested=true;var attempts=0;function mountWhenReady(){var loader=root.QiblaPresentationPageLoader;if(loader&&typeof loader.mount==='function'){loader.mount('serenity').then(function(){loadScript('js/presentation/serenity/screen.js?v=20260810-serenity-editions2','data-qibla-serenity-screen',function(){if(root.QiblaSerenityScreen&&typeof root.QiblaSerenityScreen.mount==='function')root.QiblaSerenityScreen.mount();});}).catch(function(){serenityRequested=false;});return;}attempts++;if(attempts<80)root.setTimeout(mountWhenReady,50);else serenityRequested=false;}mountWhenReady();}
function start(){
  captureNativeTokenEarly();
  loadLocationServiceControl();
  loadPrayerCore(loadPermissions);
  loadInternalChrome();loadInternalLanguageBridge();loadSafeI18n();loadCompass();loadPrayer();loadFalaki();loadAzkar();loadQuran();loadSerenity();
}
root.QiblaPresentationBootstrap=Object.freeze({start:start,captureNativeTokenEarly:captureNativeTokenEarly,loadPrayerCore:loadPrayerCore});
captureNativeTokenEarly();
if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',start,{once:true});else start();}
})(typeof globalThis!=='undefined'?globalThis:window);
