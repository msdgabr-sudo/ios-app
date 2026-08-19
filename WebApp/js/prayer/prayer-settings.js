/* QiblaAstro — prayer calculation preferences.
 * Stores user choices only; no astronomical calculations live here.
 */
(function(root){
'use strict';
var KEY='qiblaastro-prayer-settings-v1';
var DEFAULTS={mode:'auto',method:'auto',asr:'standard',highLatitude:'auto'};
function valid(v,list,fallback){return list.indexOf(v)>=0?v:fallback;}
function sanitize(x){x=x&&typeof x==='object'?x:{};return{
  mode:valid(x.mode,['auto','manual'],'auto'),
  method:valid(x.method,['auto','mwl','egyptian','ummAlQura','karachi','isna','singapore','kuwait','qatar'],'auto'),
  asr:valid(x.asr,['standard','hanafi'],'standard'),
  highLatitude:valid(x.highLatitude,['auto','middleNight','seventhNight','twilightAngle'],'auto')
};}
function read(){try{var raw=root.localStorage&&root.localStorage.getItem(KEY);return sanitize(raw?JSON.parse(raw):DEFAULTS);}catch(_){return sanitize(DEFAULTS);}}
var state=read();
function save(next){state=sanitize(Object.assign({},state,next||{}));try{if(root.localStorage)root.localStorage.setItem(KEY,JSON.stringify(state));}catch(_){}try{root.dispatchEvent(new CustomEvent('qiblaastro:prayer-settings-change',{detail:get()}));}catch(_){}return get();}
function get(){return Object.assign({},state);}
function reset(){state=sanitize(DEFAULTS);try{if(root.localStorage)root.localStorage.removeItem(KEY);}catch(_){}try{root.dispatchEvent(new CustomEvent('qiblaastro:prayer-settings-change',{detail:get()}));}catch(_){}return get();}
root.QiblaPrayerSettings=Object.freeze({get:get,save:save,reset:reset,key:KEY});
})(typeof globalThis!=='undefined'?globalThis:window);
