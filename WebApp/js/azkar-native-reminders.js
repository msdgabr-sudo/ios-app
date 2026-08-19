/* QiblaAstro — Android/TWA native Azkar reminder bridge.
 * Presentation/integration only. Does not touch Qibla, GNSS, astronomy or verification engines.
 */
(function(root){
'use strict';
var TOKEN_KEY='qiblaastro:native-token',STATE_KEY='qiblaastro:native-azkar-state:v2',MIN_INTERVAL=15,HANDOFF_TIMEOUT_MS=10000;
var PHRASES={'سبحان الله':'subhanallah','الحمد لله':'alhamdulillah','الله أكبر':'allahuakbar','لا إله إلا الله':'lailahaillallah','أستغفر الله':'astaghfirullah','أستغفر الله العظيم':'astaghfirullahalazim','سبحان الله وبحمده':'subhanallahwabihamdih','لا حول ولا قوة إلا بالله':'lahawla','حسبي الله':'hasbiyallah','اللهم صل وسلم على نبينا محمد':'salat'};
var TEXT_BY_ID={subhanallah:'سبحان الله',alhamdulillah:'الحمد لله',allahuakbar:'الله أكبر',lailahaillallah:'لا إله إلا الله',astaghfirullah:'أستغفر الله',astaghfirullahalazim:'أستغفر الله العظيم',subhanallahwabihamdih:'سبحان الله وبحمده',lahawla:'لا حول ولا قوة إلا بالله',hasbiyallah:'حسبي الله',salat:'اللهم صل وسلم على نبينا محمد'};
var handoffTimer=0;
function parentPart(name){try{return root.parent&&root.parent!==root?String(root.parent.location[name]||''):'';}catch(_){return '';}}
function topPart(name){try{return root.top&&root.top!==root?String(root.top.location[name]||''):'';}catch(_){return '';}}
function tokenFromHash(h){try{return new URLSearchParams(String(h||'').replace(/^#/,'')).get('nativeToken')||'';}catch(_){return '';}}
function tokenFromStorage(win){try{return win&&win.sessionStorage?win.sessionStorage.getItem(TOKEN_KEY)||'':'';}catch(_){return '';}}
function captureToken(){
  try{
    var t=tokenFromHash(root.location.hash)||tokenFromHash(parentPart('hash'))||tokenFromHash(topPart('hash'))||tokenFromStorage(root)||tokenFromStorage(root.parent)||tokenFromStorage(root.top)||'';
    if(t&&t.length>=32){
      try{root.sessionStorage.setItem(TOKEN_KEY,t);}catch(_){}
      try{if(root.parent&&root.parent!==root)root.parent.sessionStorage.setItem(TOKEN_KEY,t);}catch(_){}
      try{if(root.top&&root.top!==root)root.top.sessionStorage.setItem(TOKEN_KEY,t);}catch(_){}
      return t;
    }
    return '';
  }catch(_){return '';}
}
function isNativeTwa(){try{var here=new URLSearchParams(root.location.search||''),parent=new URLSearchParams(parentPart('search')),top=new URLSearchParams(topPart('search'));if(here.get('twa')==='1'||parent.get('twa')==='1'||top.get('twa')==='1'||captureToken()){root.sessionStorage.setItem('qiblaastro:twa','1');return true;}return root.sessionStorage.getItem('qiblaastro:twa')==='1';}catch(_){return false;}}
function safePhraseId(value){value=String(value||'subhanallah');return Object.prototype.hasOwnProperty.call(TEXT_BY_ID,value)?value:'subhanallah';}
function clampInterval(value){var n=parseInt(value,10);return Number.isFinite(n)?Math.max(MIN_INTERVAL,Math.min(1440,n)):MIN_INTERVAL;}
function hashState(){
  var sources=[topPart('hash'),parentPart('hash'),String(root.location.hash||'')];
  for(var i=0;i<sources.length;i++){
    try{
      var p=new URLSearchParams(String(sources[i]||'').replace(/^#/,''));
      var active=p.get('nativeAzkar');
      if(active!=='1'&&active!=='0')continue;
      return {active:active==='1',interval:clampInterval(p.get('azkarInterval')),phrase:safePhraseId(p.get('azkarPhrase')),result:p.get('azkarResult')||'',issue:p.get('azkarIssue')||''};
    }catch(_){ }
  }
  return null;
}
function stateStorage(win){try{if(!win||!win.sessionStorage)return null;var raw=win.sessionStorage.getItem(STATE_KEY);return raw?JSON.parse(raw):null;}catch(_){return null;}}
function persistState(state){if(!state)return;[root,root.parent,root.top].forEach(function(win){try{if(win&&win.sessionStorage)win.sessionStorage.setItem(STATE_KEY,JSON.stringify(state));}catch(_){}});}
function nativeState(){var s=hashState();if(s){persistState(s);return s;}return stateStorage(root)||stateStorage(root.parent)||stateStorage(root.top)||{active:false,interval:MIN_INTERVAL,phrase:'subhanallah',result:'',issue:''};}
function selectedInterval(){var b=root.document.querySelector('#azIntervals .az-interval.is-on');var n=b?parseInt(b.textContent,10):MIN_INTERVAL;return clampInterval(n);}
function selectedText(){var s=root.document.getElementById('azAudioPhrase');return s&&s.value?s.value:'سبحان الله';}
function phraseId(text){return PHRASES[text]||'subhanallah';}
function directUri(mode,minutes,text,token){return 'qiblaastro://azkar-reminder?token='+encodeURIComponent(token)+'&mode='+encodeURIComponent(mode)+'&interval='+encodeURIComponent(String(clampInterval(minutes)))+'&phrase='+encodeURIComponent(phraseId(text));}
function intentUri(mode,minutes,text,token){return 'intent://azkar-reminder?token='+encodeURIComponent(token)+'&mode='+encodeURIComponent(mode)+'&interval='+encodeURIComponent(String(clampInterval(minutes)))+'&phrase='+encodeURIComponent(phraseId(text))+'#Intent;scheme=qiblaastro;package=com.qiblalabs;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end';}
function navigateTop(uri){try{var topWin=root.top||root;topWin.location.href=uri;return true;}catch(_){try{root.location.href=uri;return true;}catch(__){return false;}}}
function launch(mode,minutes,text){var token=captureToken();if(!token)return false;return navigateTop(intentUri(mode,minutes,text,token))||navigateTop(directUri(mode,minutes,text,token));}
function statusRow(){var btn=root.document.getElementById('azAudioToggle'),row=btn&&btn.closest('.az-audio-panel')&&btn.closest('.az-audio-panel').querySelector('.az-audio-status');if(row){row.style.setProperty('display','flex','important');row.removeAttribute('aria-hidden');row.setAttribute('aria-live','polite');}return row;}
function setStatus(title,summary){var state=root.document.getElementById('azAudioState'),desc=root.document.getElementById('azAudioSummary');statusRow();if(state)state.textContent=title||'';if(desc)desc.textContent=summary||'';}
function setButton(running,busy){var btn=root.document.getElementById('azAudioToggle');if(!btn)return;btn.disabled=!!busy;btn.classList.toggle('is-stop',!!running&&!busy);btn.textContent=busy?(running?'جاري إيقاف التنبيه...':'جاري تفعيل التنبيه...'):(running?'إيقاف التنبيه':'بدء التنبيه');}
function setUi(running,state){state=state||nativeState();setButton(!!running,false);if(running)setStatus('يعمل',(TEXT_BY_ID[state.phrase]||'الذكر المختار')+' — كل '+clampInterval(state.interval)+' دقيقة');else setStatus('متوقف','اختر الذكر والفاصل الزمني ثم اضغط بدء التنبيه');}
function showFailure(code){setButton(false,false);var message='تعذر تفعيل التنبيه. أعد المحاولة.';if(code==='native-token')message='أغلق QiblaAstro وافتحه من أيقونة التطبيق ثم أعد المحاولة.';else if(code==='notification-denied'||code==='notifications-disabled')message='اسمح بإشعارات QiblaAstro من إعدادات Android ثم أعد المحاولة.';else if(code==='channel-muted')message='فعّل صوت قناة تنبيه الأذكار في إعدادات Android ثم أعد المحاولة.';else if(code==='audio-missing')message='ملف صوت الذكر غير متاح داخل نسخة Android الحالية.';else if(code==='scheduler-error')message='تعذر جدولة التنبيه في Android. أعد تشغيل التطبيق ثم أعد المحاولة.';setStatus('لم يبدأ التنبيه',message);}
function enforceMinimumInterval(){
  var buttons=[].slice.call(root.document.querySelectorAll('#azIntervals .az-interval'));
  if(!buttons.length)return;
  var selected=buttons.find(function(b){return b.classList.contains('is-on');});
  var selectedValue=selected?parseInt(selected.textContent,10):0;
  buttons.forEach(function(b){var n=parseInt(b.textContent,10);if(Number.isFinite(n)&&n<MIN_INTERVAL)b.remove();});
  if(selectedValue>=MIN_INTERVAL)return;
  var target=[].slice.call(root.document.querySelectorAll('#azIntervals .az-interval')).find(function(b){return parseInt(b.textContent,10)===MIN_INTERVAL;})||root.document.querySelector('#azIntervals .az-interval');
  if(target)target.click();
}
function applyNativeSelection(state){
  if(!state)return;enforceMinimumInterval();
  var select=root.document.getElementById('azAudioPhrase'),text=TEXT_BY_ID[state.phrase];if(select&&text&&[].some.call(select.options,function(o){return o.value===text;})){select.value=text;try{select.dispatchEvent(new Event('change',{bubbles:true}));}catch(_){}}
  var target=[].slice.call(root.document.querySelectorAll('#azIntervals .az-interval')).find(function(b){return parseInt(b.textContent,10)===clampInterval(state.interval);});if(target&&!target.classList.contains('is-on'))target.click();
}
function restoreUi(){
  enforceMinimumInterval();if(!isNativeTwa())return;
  if(!captureToken()){showFailure('native-token');return;}
  var state=nativeState();applyNativeSelection(state);
  if(state.active){setUi(true,state);return;}
  setUi(false,state);
  var issue=state.result||state.issue;if(issue&&issue!=='stopped')showFailure(issue);else if(issue==='stopped')setStatus('متوقف','تم إيقاف تنبيه الأذكار.');
}
function armHandoffWatch(running){if(handoffTimer){root.clearTimeout(handoffTimer);handoffTimer=0;}handoffTimer=root.setTimeout(function(){try{if(root.document&&root.document.visibilityState==='visible')showFailure('bridge-timeout');}catch(_){showFailure('bridge-timeout');}},HANDOFF_TIMEOUT_MS);setButton(running,true);setStatus(running?'جاري الإيقاف':'جاري التفعيل','يتم الآن تسليم الطلب إلى Android والتحقق من حالة الإشعارات والصوت.');}
function intercept(event){
  if(!isNativeTwa())return;
  var btn=event.target&&event.target.closest?event.target.closest('#azAudioToggle'):null;if(!btn)return;
  event.preventDefault();event.stopPropagation();if(event.stopImmediatePropagation)event.stopImmediatePropagation();
  var current=nativeState();
  if(current.active){armHandoffWatch(true);if(!launch('stop',current.interval||MIN_INTERVAL,TEXT_BY_ID[current.phrase]||'ذكر الله'))showFailure('native-token');return;}
  if(btn.disabled)return;
  var text=selectedText(),interval=selectedInterval();armHandoffWatch(false);if(!launch('start',interval,text))showFailure('native-token');
}
root.document.addEventListener('click',intercept,true);
function init(){captureToken();enforceMinimumInterval();root.setTimeout(restoreUi,50);}
if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});else init();
root.QiblaAzkarNativeReminder=Object.freeze({isNativeTwa:isNativeTwa,getState:nativeState,refresh:restoreUi,stop:function(){var s=nativeState();if(!s.active)return true;armHandoffWatch(true);return launch('stop',s.interval,TEXT_BY_ID[s.phrase]||'ذكر الله');}});
})(typeof globalThis!=='undefined'?globalThis:window);
