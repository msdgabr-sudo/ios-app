/*
 * QiblaAstro — Astronomical Compass Dashboard Layout
 * Full-screen astronomical workspace; existing calculation engines remain authoritative.
 * Legacy tracking/lock UI is removed entirely.
 * Confidence is an operational UI score derived from verification age + offset.
 * © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
 */
(function(root){
'use strict';
var mounted=false,confidenceTimer=0,pageObserver=null;
function byId(id){return root.document&&root.document.getElementById(id);}
function cardFromValue(id){var v=byId(id);return v&&v.parentElement&&v.parentElement.parentElement?v.parentElement.parentElement:null;}
function mode(){try{return root.QiblaCompassViewMode&&root.QiblaCompassViewMode.get?root.QiblaCompassViewMode.get():(root.sessionStorage.getItem('qibla-compass-view-mode')||'digital');}catch(_){return'digital';}}
function pageIsActive(){var p=byId('page-compass');return !!(p&&p.classList.contains('active'));}
function astroScreenActive(){return mode()==='astro'&&pageIsActive();}
function setShellState(){
 var p=byId('page-compass'),active=astroScreenActive();if(!p)return;
 p.classList.toggle('qa-astro-dashboard-active',mode()==='astro');
 p.classList.toggle('qa-digital-dashboard-active',mode()!=='astro');
 if(root.document&&root.document.body)root.document.body.classList.toggle('qa-astro-fullscreen-mode',active);
 var button=byId('qa-compass-menu-button'),drawer=byId('qa-compass-drawer');
 if(button)button.hidden=!active;
 if(drawer&&!active){drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true');}
 if(active)removeObsoleteControls();
}
function annotateCard(card,cls){if(!card)return;card.classList.add('qa-astro-metric-card',cls);card.removeAttribute('style');}
function lastRecord(){try{var s=root.QiblaAstronomicalVerificationStore;if(s&&typeof s.getLast==='function'){var r=s.getLast();if(r)return r;}}catch(_){}return root.__qiblaIndependentAstroRecord||null;}
function finite(v){return Number.isFinite(Number(v));}
function formatAge(ts){if(!finite(ts))return 'لا يوجد تحقق محفوظ';var m=Math.max(0,(Date.now()-Number(ts))/60000);if(m<1)return 'الآن';if(m<60)return 'منذ '+Math.round(m)+' دقيقة';if(m<1440)return 'منذ '+Math.round(m/60)+' ساعة';return 'منذ '+Math.round(m/1440)+' يوم';}
function confidence(record){
 if(!record||!finite(record.timestamp)||!finite(record.verificationOffsetDeg))return {score:null,label:'بانتظار أول تحقق',state:'empty',validity:'لا توجد قراءة فلكية محفوظة'};
 var age=Math.max(0,(Date.now()-Number(record.timestamp))/60000),dev=Math.abs(Number(record.verificationOffsetDeg));
 var penaltyDev=Math.min(45,dev*12),penaltyAge=age<=5?0:age<=15?5:age<=60?15:age<=360?30:45;
 var score=Math.max(0,Math.round(100-penaltyDev-penaltyAge)),label,state,validity;
 if(dev<=1&&age<=15){label='ممتازة';state='excellent';validity='القراءة حديثة وصالحة';}
 else if(dev<=3&&age<=60){label='جيدة';state='good';validity='القراءة صالحة';}
 else if(age<=360){label='متوسطة';state='fair';validity='يفضل إعادة التحقق';}
 else{label='قديمة';state='stale';validity='أعد التحقق الفلكي';}
 return {score:score,label:label,state:state,validity:validity};
}
function updateConfidence(){
 var box=byId('qa-astro-confidence');if(!box)return;
 var r=lastRecord(),c=confidence(r),age=byId('qa-confidence-age'),score=byId('qa-confidence-score'),label=byId('qa-confidence-label'),valid=byId('qa-confidence-validity'),bar=byId('qa-confidence-bar');
 box.setAttribute('data-state',c.state);
 if(age)age.textContent=formatAge(r&&r.timestamp);
 if(score)score.textContent=c.score===null?'—':c.score+'%';
 if(label)label.textContent=c.label;
 if(valid)valid.textContent=c.validity;
 if(bar)bar.style.width=(c.score===null?0:c.score)+'%';
}
function createConfidenceCard(beforeNode){
 var box=root.document.createElement('section');box.id='qa-astro-confidence';box.className='qa-astro-confidence';box.setAttribute('aria-label','حالة آخر تحقق فلكي ودرجة الثقة');
 box.innerHTML='<div class="qa-confidence-main"><span class="qa-confidence-icon">◎</span><div><b>آخر تحقق فلكي</b><strong id="qa-confidence-age">لا يوجد تحقق محفوظ</strong><small id="qa-confidence-validity">لا توجد قراءة فلكية محفوظة</small></div></div><div class="qa-confidence-score"><span>درجة الثقة</span><strong id="qa-confidence-score">—</strong><b id="qa-confidence-label">بانتظار أول تحقق</b><div class="qa-confidence-track"><i id="qa-confidence-bar"></i></div></div>';
 beforeNode.parentElement.insertBefore(box,beforeNode);return box;
}
function go(page){try{if(typeof root.GT==='function')root.GT(page);}catch(_){}}
function createDrawer(){
 if(byId('qa-compass-menu-button'))return;
 var button=root.document.createElement('button');button.id='qa-compass-menu-button';button.className='qa-compass-menu-button';button.type='button';button.hidden=true;button.setAttribute('aria-label','فتح قائمة التنقل');button.setAttribute('aria-expanded','false');button.innerHTML='<span></span><span></span><span></span>';
 var drawer=root.document.createElement('aside');drawer.id='qa-compass-drawer';drawer.className='qa-compass-drawer';drawer.setAttribute('aria-hidden','true');
 drawer.innerHTML='<div class="qa-drawer-backdrop" data-drawer-close></div><div class="qa-drawer-panel" role="dialog" aria-label="قائمة QiblaAstro"><div class="qa-drawer-head"><div><b>QiblaAstro</b><small>التنقل السريع</small></div><button type="button" data-drawer-close aria-label="إغلاق">×</button></div><nav><button data-page="home">⌂ <span>الرئيسية</span></button><button data-page="compass" class="current">◉ <span>البوصلة</span></button><button data-page="night">⌕ <span>الفلك</span></button><button data-page="prayer">♢ <span>الصلاة</span></button><button data-page="azkar">◌ <span>الأذكار</span></button><button data-page="quran">▤ <span>القرآن</span></button><button data-page="settings">⚙ <span>الإعدادات</span></button></nav><div class="qa-drawer-foot">© 2026 Mohamed SG Behairy</div></div>';
 root.document.body.appendChild(button);root.document.body.appendChild(drawer);
 function close(){drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true');button.setAttribute('aria-expanded','false');}
 button.addEventListener('click',function(){var open=!drawer.classList.contains('open');drawer.classList.toggle('open',open);drawer.setAttribute('aria-hidden',open?'false':'true');button.setAttribute('aria-expanded',open?'true':'false');});
 drawer.addEventListener('click',function(e){var closeEl=e.target.closest('[data-drawer-close]');if(closeEl){close();return;}var item=e.target.closest('[data-page]');if(item){close();go(item.getAttribute('data-page'));root.setTimeout(setShellState,0);}});
 root.document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});
}
function cleanArabic(s){return String(s||'').replace(/[\u064B-\u065F\u0670]/g,'').replace(/\s+/g,' ').trim();}
function removeObsoleteControls(){
 var page=byId('page-compass');if(!page)return;
 var direct=[];
 ['tracking-toggle-btn','lock-toggle-btn'].forEach(function(id){var b=byId(id);if(b&&b.parentElement&&b.parentElement.parentElement)direct.push(b.parentElement.parentElement);});
 direct.forEach(function(n){if(n&&n.parentNode)n.parentNode.removeChild(n);});
 var candidates=[];
 Array.prototype.forEach.call(page.querySelectorAll('div,section'),function(node){
   if(node.id==='qa-astro-confidence'||node.classList.contains('qa-deviation-calculator')||node.classList.contains('qa-astro-metrics-row'))return;
   var t=cleanArabic(node.textContent);
   if(t.indexOf('تتبع')!==-1&&t.indexOf('قفل')!==-1&&t.length<650)candidates.push({node:node,len:t.length});
 });
 candidates.sort(function(a,b){return a.len-b.len;});
 if(candidates.length){var target=candidates[0].node;if(target&&target.parentNode)target.parentNode.removeChild(target);}
}
function mount(){
 if(mounted)return true;
 var page=byId('page-compass'),canvas=byId('cvs'),verify=byId('astro-body-card'),qibla=cardFromValue('astro-qibla-value'),deviation=cardFromValue('astro-deviation-value');
 if(!page||!canvas||!verify||!qibla||!deviation)return false;
 var legacy=verify.parentElement&&verify.parentElement.parentElement;if(!legacy)return false;
 legacy.classList.add('qa-compass-legacy-grid');
 var grid=root.document.createElement('section');grid.id='qa-astro-metrics-row';grid.className='qa-astro-metrics-row';grid.setAttribute('aria-label','قراءات التحقق الفلكي');legacy.parentElement.insertBefore(grid,legacy);
 annotateCard(verify,'qa-astro-verify-card');annotateCard(qibla,'qa-astro-qibla-card');annotateCard(deviation,'qa-astro-deviation-card');
 grid.appendChild(verify);grid.appendChild(qibla);grid.appendChild(deviation);
 var verifyLabel=byId('astro-body-label');if(verifyLabel)verifyLabel.textContent='البوصلة الفلكية';
 removeObsoleteControls();
 var slider=byId('dev-slider');
 if(slider){
   var calc=slider;while(calc&&calc.parentElement&&calc.parentElement!==page)calc=calc.parentElement;
   if(calc&&calc.parentElement===page){
     calc.classList.add('qa-deviation-calculator');calc.removeAttribute('style');
     var kids=calc.children;if(kids[0])kids[0].classList.add('qa-calc-title');if(kids[1])kids[1].classList.add('qa-calc-stats');if(kids[2])kids[2].classList.add('qa-calc-hint');if(kids[3])kids[3].classList.add('qa-calc-slider');if(kids[4])kids[4].classList.add('qa-calc-radar');if(kids[5])kids[5].classList.add('qa-calc-result');
     if(!byId('qa-astro-confidence'))createConfidenceCard(calc);
   }
 }
 var status=byId('compass-status-msg');if(status)status.classList.add('qa-compass-status');canvas.classList.add('qa-astro-compass-canvas');
 createDrawer();
 pageObserver=new MutationObserver(function(){setShellState();});pageObserver.observe(page,{attributes:true,attributeFilter:['class']});
 mounted=true;setShellState();updateConfidence();confidenceTimer=root.setInterval(updateConfidence,30000);return true;
}
var tries=0;function boot(){if(mount())return;if(++tries<100)root.setTimeout(boot,100);}
root.addEventListener('qiblaastro:compass-view-mode',function(){root.setTimeout(function(){setShellState();removeObsoleteControls();updateConfidence();},0);});
root.addEventListener('qiblaastro:verification-recorded',updateConfidence);root.addEventListener('qiblaastro:verification-updated',updateConfidence);
if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();}
})(typeof globalThis!=='undefined'?globalThis:window);
