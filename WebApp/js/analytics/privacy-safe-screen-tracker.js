/* QiblaAstro — privacy-safe GA4 SPA screen tracking.
 * Analytics only: screen identity, surface type, view counts and active-screen duration.
 * No app sensor, prayer, content or user payloads are read or transmitted here.
 */
(function(root){
'use strict';

var SCREEN_TITLES={
  home:'QiblaAstro | Home',
  digital_qibla:'QiblaAstro | Digital Qibla',
  astronomical_verification:'QiblaAstro | Astronomical Verification',
  prayer:'QiblaAstro | Prayer Times',
  quran:'QiblaAstro | Holy Quran',
  azkar:'QiblaAstro | Adhkar',
  serenity:'QiblaAstro | Serenity',
  falaki:'QiblaAstro | Astronomy',
  night:'QiblaAstro | Astronomy',
  gnss:'QiblaAstro | GNSS',
  settings:'QiblaAstro | Settings'
};
var ALLOWED=Object.create(null);
Object.keys(SCREEN_TITLES).forEach(function(k){ALLOWED[k]=1;});

var currentScreen='';
var activeSince=0;
var pending=[];
var lastView='';

function now(){return (root.performance&&typeof root.performance.now==='function')?root.performance.now():Date.now();}
function visible(){return !root.document||root.document.visibilityState!=='hidden';}
function surface(){
  try{if(new URLSearchParams(root.location.search).get('twa')==='1')return 'android_twa';}catch(_){ }
  try{if(root.matchMedia&&root.matchMedia('(display-mode: standalone)').matches)return 'pwa';}catch(_){ }
  try{if(root.navigator&&root.navigator.standalone)return 'pwa';}catch(_){ }
  return 'web';
}
function compassScreen(){
  try{return root.sessionStorage.getItem('qibla-compass-view-mode')==='astro'?'astronomical_verification':'digital_qibla';}catch(_){return 'digital_qibla';}
}
function normalize(page){
  page=String(page||'').trim().toLowerCase();
  if(page==='compass')return compassScreen();
  if(page==='astro')return 'astronomical_verification';
  if(page==='prayer')return 'prayer';
  if(page==='quran')return 'quran';
  if(page==='azkar')return 'azkar';
  if(page==='serenity')return 'serenity';
  if(page==='falaki')return 'falaki';
  if(page==='night')return 'night';
  if(page==='gnss')return 'gnss';
  if(page==='settings')return 'settings';
  return 'home';
}
function syntheticPageLocation(screen){
  var origin='https://app.qiblalabs.com';
  try{if(root.location&&/^https?:$/.test(root.location.protocol))origin=root.location.origin;}catch(_){ }
  return origin+'/app/'+encodeURIComponent(screen);
}
function dispatch(name,params){
  var item=[name,params||{}];
  if(typeof root.gtag==='function'){
    try{root.gtag('event',item[0],item[1]);return;}catch(_){ }
  }
  pending.push(item);
}
function flushPending(){
  if(typeof root.gtag!=='function'||!pending.length)return;
  var q=pending.splice(0,pending.length);
  q.forEach(function(item){try{root.gtag('event',item[0],item[1]);}catch(_){pending.push(item);}});
}
function sendView(screen){
  if(!ALLOWED[screen])return;
  var key=screen+'|'+surface();
  if(lastView===key&&currentScreen===screen)return;
  lastView=key;
  dispatch('page_view',{
    page_title:SCREEN_TITLES[screen],
    page_location:syntheticPageLocation(screen),
    app_screen:screen,
    app_surface:surface()
  });
}
function flushDuration(reason){
  if(!currentScreen||!activeSince)return;
  var elapsed=Math.round(Math.max(0,now()-activeSince));
  activeSince=0;
  if(elapsed<1000)return;
  dispatch('screen_engagement',{
    screen_name:currentScreen,
    engagement_time_msec:elapsed,
    app_surface:surface(),
    exit_reason:String(reason||'navigation').slice(0,24),
    transport_type:'beacon'
  });
}
function enter(page){
  var screen=normalize(page);
  if(screen!==currentScreen){
    flushDuration('navigation');
    currentScreen=screen;
    sendView(screen);
  }
  if(visible()&&!activeSince)activeSince=now();
}
function detectInitial(){
  var page='home';
  try{page=root.document&&root.document.body&&root.document.body.getAttribute('data-qa-active-page')||'';}catch(_){ }
  if(!page){
    try{var active=root.document&&root.document.querySelector('.page.active[id^="page-"]');if(active)page=active.id.replace(/^page-/,'');}catch(_){ }
  }
  enter(page||'home');
}

try{
  if(typeof root.gtag==='function'){
    root.gtag('set','allow_google_signals',false);
    root.gtag('set','allow_ad_personalization_signals',false);
  }
}catch(_){ }

root.addEventListener('qiblaastro:navigation-change',function(event){
  enter(event&&event.detail&&event.detail.page||'home');
});
root.addEventListener('qiblaastro:compass-view-mode',function(){
  try{if(root.document.body.getAttribute('data-qa-active-page')==='compass')enter('compass');}catch(_){ }
});
root.document.addEventListener('visibilitychange',function(){
  if(root.document.visibilityState==='hidden')flushDuration('background');
  else if(currentScreen&&!activeSince)activeSince=now();
});
root.addEventListener('pagehide',function(){flushDuration('pagehide');});
root.addEventListener('beforeunload',function(){flushDuration('unload');});

if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',detectInitial,{once:true});
else detectInitial();
root.setInterval(flushPending,1000);
root.setTimeout(flushPending,50);

root.QiblaAnalytics=Object.freeze({current:function(){return currentScreen;},surface:surface});
})(typeof globalThis!=='undefined'?globalThis:window);
