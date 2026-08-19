/* QiblaAstro — Quran standalone page host | application wiring only
 * The verified Quran corpus and standalone Quran screen remain isolated and unmodified.
 * © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved. */
(function(root){
  'use strict';
  var mounted=false;
  var loading=false;
  var watchdog=null;
  var FRAME_SRC='pages/quran.html';
  function setState(host,state){if(host)host.setAttribute('data-presentation-state',state);}
  function clearWatchdog(){if(watchdog){root.clearTimeout(watchdog);watchdog=null;}}
  function resetHost(host){host.innerHTML='';host.style.padding='0';host.style.background='transparent';host.style.overflow='hidden';host.style.height='100dvh';host.style.minHeight='100dvh';}
  function showFailure(host,message){clearWatchdog();loading=false;mounted=false;setState(host,'failed');host.innerHTML='<div role="alert" style="min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;background:#071508;color:#eef7ef;font-family:inherit;"><div><strong style="display:block;margin-bottom:8px;">تعذر تحميل شاشة القرآن الكريم</strong><span style="display:block;opacity:.78;margin-bottom:14px;">'+(message||'تحقق من الاتصال ثم أعد المحاولة.')+'</span><button type="button" data-qa-quran-retry style="padding:9px 16px;border-radius:10px;border:1px solid rgba(255,255,255,.24);background:rgba(255,255,255,.08);color:#eef7ef;font:inherit;cursor:pointer;">إعادة المحاولة</button></div></div>';var retry=host.querySelector('[data-qa-quran-retry]');if(retry)retry.addEventListener('click',function(){mount(true);},{once:true});}
  function frameContractOk(frame){try{var doc=frame&&frame.contentDocument;return !!(doc&&doc.getElementById('qrApp')&&doc.getElementById('qrHome')&&doc.getElementById('qrReader'));}catch(_){return false;}}
  function wireHome(frame){
    try{
      var d=frame.contentDocument,home=d&&d.getElementById('qrHome'),button=d&&d.getElementById('qrAppBack');
      if(!home||!button||button.dataset.qaAppHome==='1')return;
      button.dataset.qaAppHome='1';
      button.setAttribute('aria-label','العودة إلى الرئيسية');
      button.setAttribute('title','الرئيسية');
      button.innerHTML='<span aria-hidden="true">⌂</span>';
      button.addEventListener('click',function(e){
        if(!home.classList.contains('is-active'))return;
        e.preventDefault();e.stopImmediatePropagation();
        if(typeof root.GT==='function')root.GT('home');
      },true);
    }catch(_){ }
  }
  function wireBackHistory(frame){
    try{
      var d=frame&&frame.contentDocument;
      if(!d||d.querySelector('script[data-qa-quran-back-history]'))return;
      var s=d.createElement('script');
      s.src='../js/presentation/quran/back-history.js?v=20260816-back1';
      s.defer=true;
      s.dataset.qaQuranBackHistory='1';
      s.onerror=function(){try{console.error('[quran] nested Back history bridge failed to load');}catch(_){ }};
      (d.head||d.documentElement).appendChild(s);
    }catch(_){ }
  }
  function mount(force){if(mounted&&!force)return true;if(loading&&!force)return false;var host=root.document&&root.document.getElementById('page-quran');if(!host)return false;clearWatchdog();loading=true;mounted=false;resetHost(host);setState(host,'loading');host.setAttribute('data-presentation-source','pages/quran.html');var frame=root.document.createElement('iframe');frame.id='qa-quran-frame';frame.title='القرآن الكريم — QiblaAstro';frame.src=FRAME_SRC;frame.loading='eager';frame.style.cssText='display:block;width:100%;height:100dvh;min-height:100dvh;border:0;background:#071508;';frame.addEventListener('load',function(){clearWatchdog();if(!frameContractOk(frame)){showFailure(host,'وصل رد غير صالح بدل شاشة القرآن الحديثة.');return;}wireHome(frame);wireBackHistory(frame);loading=false;mounted=true;setState(host,'ready');root.dispatchEvent(new CustomEvent('qiblaastro:presentation-page-mounted',{detail:{name:'quran',rootId:'page-quran',source:'pages/quran.html'}}));},{once:true});frame.addEventListener('error',function(){showFailure(host,'فشل تحميل ملف الشاشة الحديثة.');},{once:true});host.appendChild(frame);watchdog=root.setTimeout(function(){if(loading)showFailure(host,'استغرق التحميل وقتًا أطول من المتوقع.');},15000);return true;}
  root.QiblaQuranHost=Object.freeze({mount:mount});
  if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',function(){mount(false);},{once:true});else mount(false);}
})(typeof globalThis!=='undefined'?globalThis:window);
