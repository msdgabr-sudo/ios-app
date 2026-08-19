/* QiblaAstro — Compass external page host
 * Presentation infrastructure only.
 * It preserves the exact canonical #cvs and #dev-slider DOM node identities created before engine startup,
 * then moves those same nodes into the external compass fragment slots. No scientific state is read or written.
 * © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
 */
(function(root){'use strict';
  var mounted=false,mounting=null,deviationRefreshBound=false;
  function doc(){return root.document||null;}
  function byId(id){var d=doc();return d?d.getElementById(id):null;}
  function fail(msg){throw new Error('[CompassHost] '+msg);}
  function fetchText(url){return root.fetch(url,{cache:'no-store'}).then(function(r){if(!r||!r.ok)fail('Failed to load '+url+' ('+(r&&r.status)+')');return r.text();});}

  function refreshOriginalCompassBoxes(){
    try{
      if(typeof root.updateCompassBoxes==='function')root.updateCompassBoxes();
      else if(typeof updateCompassBoxes==='function')updateCompassBoxes();
    }catch(_){ }
  }

  function bindDeviationPresentationRefresh(){
    if(deviationRefreshBound)return;
    deviationRefreshBound=true;
    var schedule=function(){
      if(typeof root.requestAnimationFrame==='function')root.requestAnimationFrame(refreshOriginalCompassBoxes);
      else refreshOriginalCompassBoxes();
    };
    root.addEventListener('deviceorientationabsolute',schedule,true);
    root.addEventListener('deviceorientation',schedule,true);
    root.addEventListener('qiblaastro:compass-fragment-mounted',schedule);
  }

  function mount(){
    if(mounted)return Promise.resolve(true);
    if(mounting)return mounting;
    var d=doc();if(!d)return Promise.resolve(false);
    var page=byId('page-compass');
    var canvas=byId('cvs');
    var slider=byId('dev-slider');
    if(!page) return Promise.reject(new Error('[CompassHost] Missing #page-compass'));
    if(!canvas) return Promise.reject(new Error('[CompassHost] Missing canonical #cvs engine node'));
    if(!slider) return Promise.reject(new Error('[CompassHost] Missing canonical #dev-slider engine node'));

    mounting=fetchText('pages/compass.html?v=20260809-stage-c3').then(function(html){
      var template=d.createElement('template');template.innerHTML=html;
      var fragment=template.content;
      var canvasSlot=fragment.querySelector('[data-qibla-engine-slot="cvs"]');
      var sliderSlot=fragment.querySelector('[data-qibla-engine-slot="dev-slider"]');
      if(!canvasSlot||!sliderSlot)fail('Required engine slots are missing from pages/compass.html');
      if(fragment.querySelector('#cvs')||fragment.querySelector('#dev-slider'))fail('Fragment must not duplicate canonical engine node IDs');

      // Detach, never clone/recreate: engine-held references and listeners remain valid.
      if(canvas.parentNode)canvas.parentNode.removeChild(canvas);
      if(slider.parentNode)slider.parentNode.removeChild(slider);
      page.replaceChildren(fragment);
      canvasSlot=page.querySelector('[data-qibla-engine-slot="cvs"]');
      sliderSlot=page.querySelector('[data-qibla-engine-slot="dev-slider"]');
      if(!canvasSlot||!sliderSlot)fail('Engine slots disappeared during mount');
      canvasSlot.replaceWith(canvas);
      sliderSlot.replaceWith(slider);

      if(byId('cvs')!==canvas)fail('Canonical canvas identity was not preserved');
      if(byId('dev-slider')!==slider)fail('Canonical slider identity was not preserved');
      if(d.querySelectorAll('#cvs').length!==1||d.querySelectorAll('#dev-slider').length!==1)fail('Canonical engine IDs must remain unique');

      bindDeviationPresentationRefresh();
      refreshOriginalCompassBoxes();
      page.setAttribute('data-external-page','compass');
      page.setAttribute('data-compass-mounted','true');
      mounted=true;
      mounting=null;
      if(typeof root.CustomEvent==='function'&&typeof root.dispatchEvent==='function'){
        root.dispatchEvent(new root.CustomEvent('qiblaastro:compass-fragment-mounted',{detail:{canvas:canvas,slider:slider}}));
      }
      return true;
    }).catch(function(err){mounting=null;console.error(err);throw err;});
    return mounting;
  }

  root.QiblaCompassHost=Object.freeze({mount:mount,isMounted:function(){return mounted;}});
})(typeof globalThis!=='undefined'?globalThis:window);
