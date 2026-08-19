/* QiblaAstro — local civil-time adapter for solar/prayer event hours.
 * The astronomical engine remains unchanged. Its legacy solarEvts() returns
 * civil-hour fields relative to UTC+3. This adapter converts only those hour
 * fields to the device's current local UTC offset (including DST).
 *
 * Scope: presentation/time-zone conversion only. No Sun/Moon/Qibla/WMM,
 * compass, camera, solver or astronomical-verification equations are changed.
 */
(function(root){
  'use strict';

  var LEGACY_ENGINE_UTC_OFFSET_HOURS=3;
  var installed=false;
  var original=null;

  function offsetHours(date){
    var d=date instanceof Date?date:new Date(date||Date.now());
    var minutes=d.getTimezoneOffset();
    return Number.isFinite(minutes)?-minutes/60:0;
  }

  function wrap24(hour){return ((Number(hour)%24)+24)%24;}

  function convertEventHours(ev,date){
    if(!ev||typeof ev!=='object')return ev;
    var delta=offsetHours(date)-LEGACY_ENGINE_UTC_OFFSET_HOURS;
    var out=Object.assign({},ev);
    ['rH','nH','sH'].forEach(function(k){
      if(Number.isFinite(Number(out[k])))out[k]=wrap24(Number(out[k])+delta);
    });
    return out;
  }

  function install(){
    if(installed)return true;
    try{
      if(typeof solarEvts!=='function')return false;
      original=solarEvts;
      solarEvts=function(date){return convertEventHours(original(date),date);};
      installed=true;
      try{root.dispatchEvent(new CustomEvent('qiblaastro:timezone-adapter-ready',{detail:{offsetHours:offsetHours(new Date())}}));}catch(_){ }
      return true;
    }catch(_){return false;}
  }

  root.QiblaLocalTimezone=Object.freeze({
    install:install,
    offsetHours:offsetHours,
    convertEventHours:convertEventHours,
    legacyOffsetHours:LEGACY_ENGINE_UTC_OFFSET_HOURS,
    isInstalled:function(){return installed;}
  });

  if(!install()){
    var tries=0,t=root.setInterval(function(){
      tries++;
      if(install()||tries>=40)root.clearInterval(t);
    },100);
  }
})(typeof globalThis!=='undefined'?globalThis:window);
