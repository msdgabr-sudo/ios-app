/* QiblaAstro — Prayer audio readiness controller
 * Browser/PWA audio-permission readiness only. No prayer-time calculations.
 * © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
 */
(function(root){'use strict';
  var localAudioVerified=false;
  function byId(id){return document.getElementById(id);}
  function setState(state,title,sub){var box=byId('qa-audio-readiness'),t=byId('qa-audio-readiness-title'),s=byId('qa-audio-readiness-sub'),b=byId('qa-audio-readiness-btn');if(!box)return;box.dataset.state=state;if(t)t.textContent=title;if(s)s.textContent=sub;if(b){b.hidden=state==='ready';b.disabled=state==='working';}}
  function playLocalProofTone(){return new Promise(function(resolve,reject){try{var Ctx=root.AudioContext||root.webkitAudioContext;if(!Ctx)return reject(new Error('AudioContext unsupported'));var ctx=new Ctx();var osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=880;gain.gain.setValueAtTime(0.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(0.16,ctx.currentTime+0.025);gain.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.28);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+0.3);osc.onended=function(){try{ctx.close();}catch(e){}resolve(true);};if(ctx.state==='suspended')ctx.resume().catch(reject);}catch(e){reject(e);}});}
  function isReady(){return localAudioVerified;}
  function refresh(){if(localAudioVerified)setState('ready','الصوت مسموح على هذا الهاتف','نجح اختبار الصوت المحلي — يمكنك الآن تجربة الأذان');else setState('attention','اختبار صلاحية الصوت','اضغط مرة واحدة لسماع نغمة قصيرة والتأكد من سماح الهاتف بالصوت');}
  function activate(){var b=byId('qa-audio-readiness-btn');if(b)b.disabled=true;setState('working','جارٍ اختبار الصوت…','يجب أن تسمع نغمة قصيرة الآن');playLocalProofTone().then(function(){localAudioVerified=true;try{if(typeof adhanUnlockAudio==='function')adhanUnlockAudio();else if(typeof _unlockAudio==='function')_unlockAudio();}catch(e){}setState('ready','الصوت مسموح على هذا الهاتف','نجح الاختبار المحلي — اضغط الآن «تجربة الأذان»');}).catch(function(){localAudioVerified=false;setState('error','تعذر تشغيل الصوت على هذا الهاتف','ارفع مستوى صوت الوسائط وتأكد أن المتصفح غير مكتوم ثم أعد المحاولة');if(b)b.disabled=false;});}
  function bind(){var box=byId('qa-audio-readiness'),btn=byId('qa-audio-readiness-btn');if(!box||box.dataset.bound==='1')return;box.dataset.bound='1';if(btn)btn.addEventListener('click',activate);document.addEventListener('visibilitychange',function(){if(!document.hidden)refresh();});refresh();}
  root.QiblaPrayerAudioReadiness=Object.freeze({bind:bind,refresh:refresh,isReady:isReady,playLocalProofTone:playLocalProofTone});
})(typeof globalThis!=='undefined'?globalThis:window);
