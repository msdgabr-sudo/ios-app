/* QiblaAstro — Falaki standalone page host
 * Application wiring only: mounts pages/falaki.html inside the existing page-night route.
 * Does not calculate, modify, or persist astronomical verification data.
 * © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved. */
(function(root){'use strict';
  var mounted=false,loading=false,mirrorTimer=null,eventTimer=null,parentObserver=null,falakiObserver=null,eventObserver=null,homeObserver=null,watchdog=null;
  var FRAME_SRC='pages/falaki.html';
  var FALAKI_LOCATION_KEY='qiblaastro:falaki:last-trusted-location:v1';
  var lastCachedSignature='';
  function cleanText(el){try{return el&&el.textContent?el.textContent.trim():'';}catch(_){return '';}}
  function setState(host,state){if(host)host.setAttribute('data-presentation-state',state);}
  function clearWatchdog(){if(watchdog){root.clearTimeout(watchdog);watchdog=null;}}
  function cleanupMirror(){if(mirrorTimer){clearInterval(mirrorTimer);mirrorTimer=null;}if(eventTimer){clearInterval(eventTimer);eventTimer=null;}if(parentObserver){parentObserver.disconnect();parentObserver=null;}if(falakiObserver){falakiObserver.disconnect();falakiObserver=null;}if(eventObserver){eventObserver.disconnect();eventObserver=null;}if(homeObserver){homeObserver.disconnect();homeObserver=null;}}
  function resetHost(host){host.innerHTML='';host.style.padding='0';host.style.background='transparent';host.style.overflow='hidden';host.style.height='100dvh';host.style.minHeight='100dvh';}
  function put(doc,id,value){try{var el=doc&&doc.getElementById(id);if(el&&value!==undefined&&value!==null&&value!==''&&el.textContent!==String(value))el.textContent=value;}catch(_){}}
  function validLocation(loc){
    try{
      if(!loc)return false;
      var lat=Number(loc.lat),lon=Number(loc.lon);
      return Number.isFinite(lat)&&Number.isFinite(lon)&&lat>=-90&&lat<=90&&lon>=-180&&lon<=180;
    }catch(_){return false;}
  }
  function readCachedLocation(){
    try{
      var raw=root.localStorage&&root.localStorage.getItem(FALAKI_LOCATION_KEY);if(!raw)return null;
      var loc=JSON.parse(raw);if(!validLocation(loc)||loc.source!=='gps')return null;
      return {
        lat:Number(loc.lat),lon:Number(loc.lon),
        alt:Number.isFinite(Number(loc.alt))?Number(loc.alt):0,
        accuracy:Number.isFinite(Number(loc.accuracy))?Number(loc.accuracy):null
      };
    }catch(_){return null;}
  }
  function cacheTrustedLocation(loc){
    try{
      if(!validLocation(loc)||!root.localStorage)return false;
      var payload={
        lat:Number(loc.lat),lon:Number(loc.lon),
        alt:Number.isFinite(Number(loc.alt))?Number(loc.alt):0,
        accuracy:Number.isFinite(Number(loc.accuracy))?Number(loc.accuracy):null,
        source:'gps',savedAt:Date.now()
      };
      var sig=[payload.lat.toFixed(6),payload.lon.toFixed(6),payload.alt.toFixed(1),payload.accuracy===null?'':Math.round(payload.accuracy)].join('|');
      if(sig===lastCachedSignature)return true;
      root.localStorage.setItem(FALAKI_LOCATION_KEY,JSON.stringify(payload));lastCachedSignature=sig;return true;
    }catch(_){return false;}
  }
  function readTrustedLocation(){
    try{
      if(typeof gnssHasTrustedFix==='undefined'||gnssHasTrustedFix!==true)return null;
      if(typeof gnssSource==='undefined'||gnssSource!=='gps')return null;
      var lat=Number(LAT),lon=Number(LON);
      if(!Number.isFinite(lat)||!Number.isFinite(lon))return null;
      return {
        lat:lat,
        lon:lon,
        alt:(typeof gnssAltitudeMeters!=='undefined'&&Number.isFinite(Number(gnssAltitudeMeters)))?Number(gnssAltitudeMeters):0,
        accuracy:(typeof gnssAccuracy!=='undefined'&&Number.isFinite(Number(gnssAccuracy)))?Number(gnssAccuracy):null
      };
    }catch(_){return null;}
  }
  function locationForFalaki(){
    var live=readTrustedLocation();
    if(live){cacheTrustedLocation(live);return live;}
    return readCachedLocation();
  }
  function syncFalakiLocation(frame){
    try{
      var loc=locationForFalaki();
      if(!loc||!frame||!frame.contentWindow)return false;
      var api=frame.contentWindow.FalakiPage;
      if(!api||typeof api.setLocation!=='function')return false;
      var state=typeof api.getState==='function'?api.getState():null;
      if(state&&Number(state.lat)===loc.lat&&Number(state.lon)===loc.lon)return true;
      return api.setLocation(loc.lat,loc.lon,'موقعك الحالي',loc.alt,loc.accuracy)!==false;
    }catch(_){return false;}
  }
  function formatHour(value){
    try{
      if(typeof root.hm==='function')return root.hm(value);
      if(!Number.isFinite(Number(value)))return '';
      var h=((Number(value)%24)+24)%24,m=Math.round((h-Math.floor(h))*60);h=Math.floor(h);if(m===60){m=0;h=(h+1)%24;}
      return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');
    }catch(_){return '';}
  }
  function eventTimes(){
    try{
      if(typeof root.solarEvts!=='function'||typeof root.moonPos!=='function'||typeof root.moonRS!=='function')return null;
      var now=new Date(),evts=root.solarEvts(now),mp=root.moonPos(now),mrs=evts?root.moonRS(evts,mp):null;
      return {sunrise:evts?formatHour(evts.rH):'',noon:evts?formatHour(evts.nH):'',sunset:evts?formatHour(evts.sH):'',moonrise:mrs?formatHour(mrs.rH):'',moonset:mrs?formatHour(mrs.sH):''};
    }catch(_){return null;}
  }
  function mirrorHomeEventTimes(times){
    try{
      if(!times||!root.document)return;
      function line(selector,id,a,b){
        var card=root.document.querySelector(selector);if(!card)return;
        var el=root.document.getElementById(id),riseValue,setValue;
        if(!el){el=root.document.createElement('div');el.id=id;el.style.cssText='margin-top:5px;font-size:.48rem;line-height:1.45;color:#c9d9ef;white-space:nowrap;font-weight:600;text-align:center;';card.appendChild(el);}
        riseValue=el.querySelector('[data-qa-rise-value]');setValue=el.querySelector('[data-qa-set-value]');
        if(!riseValue||!setValue){
          el.textContent='';
          var riseLabel=root.document.createElement('span');riseLabel.setAttribute('data-mizan-i18n-source','الشروق');riseLabel.textContent='الشروق';
          riseValue=root.document.createElement('span');riseValue.setAttribute('data-qa-rise-value','1');
          var setLabel=root.document.createElement('span');setLabel.setAttribute('data-mizan-i18n-source','الغروب');setLabel.textContent='الغروب';
          setValue=root.document.createElement('span');setValue.setAttribute('data-qa-set-value','1');
          el.appendChild(riseLabel);el.appendChild(root.document.createTextNode(' '));el.appendChild(riseValue);
          el.appendChild(root.document.createTextNode(' · '));el.appendChild(setLabel);el.appendChild(root.document.createTextNode(' '));el.appendChild(setValue);
        }
        var av=a||'—',bv=b||'—';if(riseValue.textContent!==av)riseValue.textContent=av;if(setValue.textContent!==bv)setValue.textContent=bv;
      }
      line('#qa-home .qa-sun-card','qaSunRiseSet',times.sunrise,times.sunset);
      line('#qa-home .qa-moon-card','qaMoonRiseSet',times.moonrise,times.moonset);
    }catch(_){ }
  }
  function mirrorEventTimes(frame){
    try{
      if(!frame||!frame.contentDocument)return false;
      var times=eventTimes();if(!times)return false;var doc=frame.contentDocument;
      put(doc,'sunT1',times.sunrise);put(doc,'noon',times.noon);put(doc,'sunT2',times.sunset);put(doc,'moonT1',times.moonrise);put(doc,'moonT2',times.moonset);
      mirrorHomeEventTimes(times);return true;
    }catch(_){return false;}
  }
  function mirrorMoonAltAz(frame){
    try{
      if(!frame||!frame.contentDocument)return false;
      var doc=frame.contentDocument,alt=cleanText(doc.getElementById('moonAlt')),az=cleanText(doc.getElementById('moonAz'));
      if(!alt||!az||alt==='—'||az==='—')return false;
      var target=root.document&&root.document.getElementById('qaMoonPhase');if(!target)return false;
      var altValue=target.querySelector('[data-qa-alt-value]'),azValue=target.querySelector('[data-qa-az-value]');
      if(!altValue||!azValue){
        target.textContent='';
        var altLabel=root.document.createElement('span');altLabel.setAttribute('data-mizan-i18n-source','الارتفاع');altLabel.textContent='الارتفاع';
        altValue=root.document.createElement('span');altValue.setAttribute('data-qa-alt-value','1');
        var azLabel=root.document.createElement('span');azLabel.setAttribute('data-mizan-i18n-source','السمت');azLabel.textContent='السمت';
        azValue=root.document.createElement('span');azValue.setAttribute('data-qa-az-value','1');
        target.appendChild(altLabel);target.appendChild(root.document.createTextNode(' '));target.appendChild(altValue);
        target.appendChild(root.document.createTextNode(' · '));target.appendChild(azLabel);target.appendChild(root.document.createTextNode(' '));target.appendChild(azValue);
      }
      if(altValue.textContent!==alt)altValue.textContent=alt;if(azValue.textContent!==az)azValue.textContent=az;
      target.setAttribute('data-falaki-altaz','true');target.style.setProperty('font-size','.52rem','important');target.style.setProperty('font-weight','600','important');target.style.setProperty('white-space','nowrap','important');target.style.setProperty('color','#c9d9ef','important');return true;
    }catch(_){return false;}
  }
  function bindMirror(frame){
    try{
      cleanupMirror();
      var liveRun=function(){syncFalakiLocation(frame);mirrorMoonAltAz(frame);},eventRun=function(){mirrorEventTimes(frame);};
      syncFalakiLocation(frame);eventRun();liveRun();setTimeout(eventRun,250);setTimeout(eventRun,1000);setTimeout(eventRun,5000);setTimeout(liveRun,250);setTimeout(liveRun,1000);
      mirrorTimer=setInterval(liveRun,1000);eventTimer=setInterval(eventRun,60000);
      var target=root.document&&root.document.getElementById('qaMoonPhase');
      if(target&&typeof MutationObserver!=='undefined'){parentObserver=new MutationObserver(function(){setTimeout(liveRun,0);});parentObserver.observe(target,{childList:true,subtree:true,characterData:true});}
      var doc=frame.contentDocument,alt=doc&&doc.getElementById('moonAlt'),az=doc&&doc.getElementById('moonAz');
      if(typeof MutationObserver!=='undefined'&&(alt||az)){falakiObserver=new MutationObserver(liveRun);if(alt)falakiObserver.observe(alt,{childList:true,subtree:true,characterData:true});if(az)falakiObserver.observe(az,{childList:true,subtree:true,characterData:true});}
      if(typeof MutationObserver!=='undefined'&&doc){
        var timeIds=['sunT1','noon','sunT2','moonT1','moonT2'],timeNodes=timeIds.map(function(id){return doc.getElementById(id);}).filter(Boolean);
        if(timeNodes.length){eventObserver=new MutationObserver(function(){setTimeout(eventRun,0);});timeNodes.forEach(function(node){eventObserver.observe(node,{childList:true,subtree:true,characterData:true});});}
      }
      if(typeof MutationObserver!=='undefined'&&root.document){
        var home=root.document.getElementById('qa-home');
        if(home){homeObserver=new MutationObserver(function(mutations){var needs=false;for(var i=0;i<mutations.length;i++){if(mutations[i].type==='childList'){needs=true;break;}}if(needs)setTimeout(eventRun,0);});homeObserver.observe(home,{childList:true,subtree:true});}
      }
    }catch(_){ }
  }
  function frameContractOk(frame){try{var doc=frame&&frame.contentDocument;return !!(doc&&doc.querySelector('main.shell')&&doc.getElementById('moonAlt')&&doc.getElementById('sunAlt')&&doc.getElementById('moonAz'));}catch(_){return false;}}
  function showFailure(host,message){clearWatchdog();cleanupMirror();loading=false;mounted=false;setState(host,'failed');host.innerHTML='<div role="alert" style="min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;background:#07111f;color:#eef5ff;font-family:inherit;"><div><strong style="display:block;margin-bottom:8px;">تعذر تحميل شاشة فلكي</strong><span style="display:block;opacity:.78;margin-bottom:14px;">'+(message||'تحقق من الاتصال ثم أعد المحاولة.')+'</span><button type="button" data-qa-falaki-retry style="padding:9px 16px;border-radius:10px;border:1px solid rgba(255,255,255,.24);background:rgba(255,255,255,.08);color:#eef5ff;font:inherit;cursor:pointer;">إعادة المحاولة</button></div></div>';var retry=host.querySelector('[data-qa-falaki-retry]');if(retry)retry.addEventListener('click',function(){mount(true);},{once:true});}
  function mount(force){if(mounted&&!force)return true;if(loading&&!force)return false;var host=root.document&&root.document.getElementById('page-night');if(!host)return false;clearWatchdog();cleanupMirror();loading=true;mounted=false;resetHost(host);setState(host,'loading');host.setAttribute('data-presentation-source','pages/falaki.html');var frame=root.document.createElement('iframe');frame.id='qa-falaki-frame';frame.title='فلكي — معلومات فلكية وتعليمية';frame.src=FRAME_SRC;frame.loading='eager';frame.setAttribute('allow','geolocation');frame.style.cssText='display:block;width:100%;height:100dvh;min-height:100dvh;border:0;background:transparent;';frame.addEventListener('load',function(){clearWatchdog();if(!frameContractOk(frame)){showFailure(host,'وصل رد غير صالح بدل شاشة فلكي الحديثة.');return;}loading=false;mounted=true;setState(host,'ready');syncFalakiLocation(frame);bindMirror(frame);root.dispatchEvent(new CustomEvent('qiblaastro:presentation-page-mounted',{detail:{name:'falaki',rootId:'page-night',source:'pages/falaki.html'}}));},{once:true});frame.addEventListener('error',function(){showFailure(host,'فشل تحميل ملف الشاشة الحديثة.');},{once:true});host.appendChild(frame);watchdog=root.setTimeout(function(){if(loading)showFailure(host,'استغرق التحميل وقتًا أطول من المتوقع.');},15000);return true;}
  root.QiblaFalakiHost=Object.freeze({mount:mount});
  if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',function(){mount(false);},{once:true});else mount(false);}
})(typeof globalThis!=='undefined'?globalThis:window);
