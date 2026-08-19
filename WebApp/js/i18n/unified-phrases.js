/* Mizan / QiblaAstro — unified i18n compatibility data layer.
 * Transitional consolidation layer: derives one final phrase map and one final
 * dynamic pattern list per language from the currently validated packs.
 * Presentation data only; no DOM, sensors, camera, calculations or verification logic.
 */
(function(root){
'use strict';
var LANGS=['en','fr','id','ur'];
function mergeStatic(lang){
  var out={};
  [
    root.MIZAN_UI_PHRASES,
    root.MIZAN_HOME_PHRASES,
    root.MIZAN_MODULE_PHRASES,
    root.MIZAN_EXTRA_PHRASES,
    root.MIZAN_PRAYER_PHRASES,
    root.MIZAN_STATUS_PHRASES,
    root.MIZAN_GENERAL_PHRASES,
    root.MIZAN_SAFE4_PHRASES
  ].forEach(function(pack){if(pack&&pack[lang])Object.assign(out,pack[lang]);});
  if(lang==='en')Object.assign(out,root.MIZAN_EN_BATCH1_PHRASES||{},root.MIZAN_EN_SAFE2_PHRASES||{});
  if(lang==='fr')Object.assign(out,root.MIZAN_FR_PHRASES||{});
  return Object.freeze(out);
}
function mergeDynamic(lang){
  var out=[];
  if(root.MIZAN_DYNAMIC_PATTERNS&&root.MIZAN_DYNAMIC_PATTERNS[lang])out=out.concat(root.MIZAN_DYNAMIC_PATTERNS[lang]);
  if(root.MIZAN_SAFE4_DYNAMIC&&root.MIZAN_SAFE4_DYNAMIC[lang])out=out.concat(root.MIZAN_SAFE4_DYNAMIC[lang]);
  if(lang==='en'){
    if(root.MIZAN_EN_BATCH1_DYNAMIC)out=out.concat(root.MIZAN_EN_BATCH1_DYNAMIC);
    if(root.MIZAN_EN_SAFE2_DYNAMIC)out=out.concat(root.MIZAN_EN_SAFE2_DYNAMIC);
  }
  if(lang==='fr'&&root.MIZAN_FR_DYNAMIC)out=out.concat(root.MIZAN_FR_DYNAMIC);
  return Object.freeze(out.slice());
}
var phrases={},dynamic={};
LANGS.forEach(function(lang){phrases[lang]=mergeStatic(lang);dynamic[lang]=mergeDynamic(lang);});
root.MIZAN_UNIFIED_PHRASES=Object.freeze(phrases);
root.MIZAN_UNIFIED_DYNAMIC=Object.freeze(dynamic);
root.MizanUnifiedI18nData=Object.freeze({languages:LANGS.slice(),phrases:root.MIZAN_UNIFIED_PHRASES,dynamic:root.MIZAN_UNIFIED_DYNAMIC});
})(typeof globalThis!=='undefined'?globalThis:window);
