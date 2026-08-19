// ══════════════════════════════════════════════════════════════════════════════
// [JS-7] SETTINGS PERSISTENCE
// ══════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════
//  SETTINGS PERSISTENCE (localStorage)
// ════════════════════════════════════════════════
const CFG={asr:'shafi',lang:'ar'};
function loadCfg(){
  try{const s=localStorage.getItem('qibla-cfg');if(s)Object.assign(CFG,JSON.parse(s));}catch(e){}
}
function saveCfg(){
  try{localStorage.setItem('qibla-cfg',JSON.stringify(CFG));}catch(e){}
}
loadCfg();

// ════════════════════════════════════════════════
//  STAGED ENGLISH I18N LOADER — presentation only
//  This deliberately loads after the existing settings state and does not
//  change calculations, sensors, compass geometry or verification engines.
// ════════════════════════════════════════════════
(function(){
  'use strict';
  function loadEnglishRollout(){
    if(document.querySelector('script[data-mizan-english-rollout]'))return;
    var s=document.createElement('script');
    s.src='js/i18n/english-rollout.js?v=20260812-en1';
    s.defer=true;
    s.dataset.mizanEnglishRollout='1';
    s.onerror=function(){try{console.error('[i18n] English rollout script failed to load; Arabic remains unchanged.');}catch(_){}};
    (document.head||document.documentElement).appendChild(s);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadEnglishRollout,{once:true});else loadEnglishRollout();
})();
