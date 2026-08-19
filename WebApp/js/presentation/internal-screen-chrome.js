/* QiblaAstro — internal screens chrome controller
 * Presentation only. Home is the navigation hub; every internal screen is fullscreen.
 * Compass owns its existing Home button. Quran owns its own index/reader back controls.
 * © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
 */
(function(root){
'use strict';
var d=root.document;if(!d)return;
var NO_OWN_HOME={home:true,compass:true,quran:true};
var azkarViewObserver=null,azkarObservedDoc=null;
function activePage(){return d.querySelector('.page.active');}
function activePageId(){var p=activePage();return p&&p.id?String(p.id).replace(/^page-/,''):'';}
function azkarInternalViewActive(){
  try{
    var frame=d.getElementById('qa-azkar-frame');
    var fd=frame&&frame.contentDocument;
    if(!fd)return false;
    var home=fd.getElementById('azHome');
    if(home&&home.classList.contains('is-active'))return false;
    var active=fd.querySelector('.az-view.is-active');
    return !!active;
  }catch(_){return false;}
}
function bindAzkarViewObserver(){
  try{
    var frame=d.getElementById('qa-azkar-frame');
    if(!frame)return;
    var fd=frame.contentDocument;
    if(!fd){frame.addEventListener('load',function(){bindAzkarViewObserver();sync();},{once:true});return;}
    if(azkarObservedDoc===fd)return;
    if(azkarViewObserver)azkarViewObserver.disconnect();
    azkarObservedDoc=fd;
    var views=fd.querySelectorAll('.az-view');
    if(views.length&&typeof root.MutationObserver==='function'){
      azkarViewObserver=new root.MutationObserver(function(){sync();});
      Array.prototype.forEach.call(views,function(view){azkarViewObserver.observe(view,{attributes:true,attributeFilter:['class']});});
    }
    fd.addEventListener('click',function(){root.setTimeout(sync,0);},true);
  }catch(_){ }
}
function ensureHomeButton(){
  var b=d.getElementById('qa-internal-home-button');if(b)return b;
  b=d.createElement('button');b.id='qa-internal-home-button';b.type='button';b.hidden=true;
  b.setAttribute('aria-label','العودة إلى الشاشة الرئيسية');b.setAttribute('title','الرئيسية');
  b.innerHTML='<svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true"><path d="M3.5 10.5 12 3l8.5 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-4.5v-6h-5v6H5a1.5 1.5 0 0 1-1.5-1.5z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();if(typeof root.GT==='function')root.GT('home');});
  (d.body||d.documentElement).appendChild(b);return b;
}
function syncHomeMansions(){
  try{
    var frame=d.getElementById('qa-falaki-frame');
    var fd=frame&&frame.contentDocument;if(!fd)return;
    function value(id){var e=fd.getElementById(id),v=e&&e.textContent?e.textContent.trim():'';return v&&v!=='—'?v:'';}
    function badge(selector,id,label,val){
      if(!val)return;var card=d.querySelector(selector);if(!card)return;
      var el=d.getElementById(id),labelEl,valueEl;
      if(!el){
        el=d.createElement('div');el.id=id;
        labelEl=d.createElement('span');labelEl.setAttribute('data-qa-mansion-label','1');labelEl.setAttribute('data-mizan-i18n-source',label);labelEl.textContent=label;
        valueEl=d.createElement('span');valueEl.setAttribute('data-qa-mansion-value','1');
        el.appendChild(labelEl);el.appendChild(valueEl);card.appendChild(el);
      }else{
        labelEl=el.querySelector('[data-qa-mansion-label]');
        valueEl=el.querySelector('[data-qa-mansion-value]');
      }
      /* Two compact lines prevent long Arabic labels from being ellipsized on the
         narrower Sun card while keeping the existing card geometry unchanged. */
      el.style.cssText='margin:4px auto 0;padding:3px 7px 4px;width:94%;max-width:128px;border-radius:10px;background:linear-gradient(90deg,rgba(93,157,207,.10),rgba(217,176,75,.08));border:1px solid rgba(151,198,231,.16);color:#d3deec;line-height:1.12;text-align:center;overflow:visible;';
      if(labelEl){labelEl.style.cssText='display:block;font-size:.31rem;font-weight:600;color:#9fb4cd;white-space:nowrap;';}
      if(valueEl){valueEl.style.cssText='display:block;margin-top:2px;font-size:.44rem;font-weight:800;color:#edf4ff;white-space:nowrap;overflow:visible;text-overflow:clip;';if(valueEl.textContent!==val)valueEl.textContent=val;}
    }
    badge('#qa-home .qa-sun-card','qaSunMansionHome','المنزلة الشمسية',value('sunMansion'));
    badge('#qa-home .qa-moon-card','qaMoonMansionHome','المنزلة القمرية',value('moonMansion'));
  }catch(_){ }
}
function sync(){
  bindAzkarViewObserver();syncHomeMansions();
  var id=activePageId();
  var internal=!!id&&id!=='home';
  var hideForAzkarInternal=id==='azkar'&&azkarInternalViewActive();
  var needsHome=internal&&!NO_OWN_HOME[id]&&!hideForAzkarInternal;
  d.body.classList.toggle('qa-internal-chromeless',internal);
  d.body.setAttribute('data-qa-active-internal-screen',id||'');
  d.body.classList.toggle('qa-azkar-internal-screen',hideForAzkarInternal);
  var b=ensureHomeButton();b.hidden=!needsHome;b.style.display=needsHome?'grid':'none';
}
function boot(){sync();root.setInterval(syncHomeMansions,2000);if(typeof root.MutationObserver==='function'){var scheduled=false;var o=new root.MutationObserver(function(){if(scheduled)return;scheduled=true;root.setTimeout(function(){scheduled=false;sync();},0);});o.observe(d.documentElement,{subtree:true,attributes:true,attributeFilter:['class','style'],childList:true});}d.addEventListener('click',function(){root.setTimeout(sync,0);},true);root.addEventListener('hashchange',sync);}
root.QiblaInternalScreenChrome=Object.freeze({sync:sync});
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(typeof globalThis!=='undefined'?globalThis:window);
