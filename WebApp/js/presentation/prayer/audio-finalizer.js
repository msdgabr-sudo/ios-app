/* QiblaAstro — Final adhan playback guard
 * Presentation/audio transport only. No prayer-time calculations.
 * Local, deterministic muezzin assets for reliable offline playback.
 * © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
 */
(function(root){'use strict';
  var LOCAL={
    makkah:{normal:'audio/adhan/mecca.mp3',fajr:'audio/adhan/fajr-alafasy.mp3'},
    calm:{normal:'audio/adhan/ahmed-al-nufais.mp3',fajr:'audio/adhan/fajr-alafasy.mp3'},
    deep:{normal:'audio/adhan/islam-sobhi.mp3',fajr:'audio/adhan/fajr-alafasy.mp3'}
  };
  var FALLBACK=LOCAL.makkah.normal;
  var previewAudio=null,attemptToken=0,bound=false,mapperInstalled=false;

  function status(text){var el=document.getElementById('qa-adhan-live-status');if(!el)return;el.textContent='';setTimeout(function(){el.textContent=text||'';},20);}
  function state(){try{return root.QiblaAdhanUI&&root.QiblaAdhanUI.getState?root.QiblaAdhanUI.getState():{profile:'makkah'};}catch(e){return {profile:'makkah'};}}
  function profile(){var s=state();return LOCAL[s.profile]||LOCAL.makkah;}

  function localizeURL(url,isFajr){
    var u=String(url||'');
    if(isFajr)return LOCAL.makkah.fajr;
    if(u.indexOf('Ahmed%20Al-Nufais')>=0||u.indexOf('Ahmed Al-Nufais')>=0)return LOCAL.calm.normal;
    if(u.indexOf('islam-sobhi-adhan.mp3')>=0||u.indexOf('IslamSobhi.mp3')>=0)return LOCAL.deep.normal;
    if(u.indexOf('audio/adhan/ahmed-al-nufais.mp3')>=0)return LOCAL.calm.normal;
    if(u.indexOf('audio/adhan/islam-sobhi.mp3')>=0)return LOCAL.deep.normal;
    if(u.indexOf('audio/adhan/mecca.mp3')>=0)return LOCAL.makkah.normal;
    return LOCAL.makkah.normal;
  }

  function installURLMapper(){
    if(mapperInstalled||typeof root.adhanSetAudioURLs!=='function')return;
    mapperInstalled=true;
    var original=root.adhanSetAudioURLs;
    root.adhanSetAudioURLs=function(normalURL,fajrURL,fallbackURL){
      return original(localizeURL(normalURL,false),localizeURL(fajrURL,true),FALLBACK);
    };
  }

  function syncEngine(){
    installURLMapper();
    var p=profile();
    try{if(typeof root.adhanSetAudioURLs==='function')root.adhanSetAudioURLs(p.normal,p.fajr,FALLBACK);}catch(e){}
  }

  function stop(){
    attemptToken++;
    try{if(previewAudio){previewAudio.pause();previewAudio.currentTime=0;previewAudio.src='';previewAudio=null;}}catch(e){}
    try{if(typeof _adhanAudio!=='undefined'&&_adhanAudio){_adhanAudio.pause();_adhanAudio.currentTime=0;}}catch(e){}
    status('تم إيقاف الصوت');
  }

  function playStrict(url,token,label){
    return new Promise(function(resolve,reject){
      try{
        if(previewAudio){try{previewAudio.pause();}catch(e){}}
        var a=new Audio();previewAudio=a;a.preload='auto';a.volume=1;a.playsInline=true;
        var settled=false,timer=setTimeout(function(){if(!settled){settled=true;try{a.pause();}catch(e){}reject(new Error('audio timeout'));}},9000);
        function ok(){if(settled||token!==attemptToken)return;settled=true;clearTimeout(timer);resolve(true);}
        function bad(){if(settled||token!==attemptToken)return;settled=true;clearTimeout(timer);reject(new Error('audio load failed'));}
        a.addEventListener('playing',ok,{once:true});a.addEventListener('error',bad,{once:true});
        a.src=url;
        var promise=a.play();if(promise&&promise.catch)promise.catch(bad);
      }catch(e){reject(e);}
    }).then(function(){status('يتم الآن تشغيل '+label);return true;});
  }

  function preview(fajr){
    stop();
    var token=++attemptToken,p=profile(),s=state(),url=fajr?p.fajr:p.normal;
    syncEngine();
    var name=fajr?'أذان الفجر':(s.profile==='calm'?'أذان أحمد النفيس':s.profile==='deep'?'أذان إسلام صبحي':'الأذان الأساسي');
    status('جارٍ تشغيل '+name+'…');
    playStrict(url,token,name).catch(function(){
      if(token!==attemptToken)return;
      status('تعذر تشغيل '+name+'. لا يتم استبداله بصوت مؤذن آخر أثناء التجربة.');
    });
  }

  function bind(){
    if(bound)return;bound=true;syncEngine();
    var card=document.getElementById('qa-adhan-card');
    if(card){var p=card.querySelector('[data-qa-adhan-preview]'),s=card.querySelector('[data-qa-stop-preview]');if(p)p.onclick=function(){preview(false);};if(s)s.onclick=stop;}
    document.addEventListener('click',function(e){
      var t=e.target&&e.target.closest?e.target.closest('[data-test-normal],[data-test-fajr],[data-profile]'):null;if(!t)return;
      if(t.hasAttribute('data-profile')){setTimeout(syncEngine,0);return;}
      e.preventDefault();e.stopImmediatePropagation();preview(t.hasAttribute('data-test-fajr'));
    },true);
  }

  root.QiblaPrayerAudioFinalizer=Object.freeze({bind:bind,preview:preview,stop:stop,syncEngine:syncEngine,profiles:LOCAL});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(bind,0);},{once:true});else setTimeout(bind,0);
})(typeof globalThis!=='undefined'?globalThis:window);
