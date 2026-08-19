// ══════════════════════════════════════════════════════════════════════════════
// [JS-33] INIT & START
// ══════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════
// Try auto-start compass (Android / non-iOS)
if(typeof DeviceOrientationEvent !== 'undefined' &&
   typeof DeviceOrientationEvent.requestPermission !== 'function'){
  _safeOrient();
  compassPermission = 'auto';
}

// Permission button
const permBtn = gel('compass-perm-btn');
if(permBtn) permBtn.addEventListener('click', requestCompassPermission);

// Calibration button
const calBtn = gel('cal-compass-btn');
if(calBtn) calBtn.addEventListener('click', startCalibration);


// Smart startup splash: keep the approved presentation visible while the static
// Home screen finishes its own presentation binding. This block changes only the
// splash release timing; it does not delay or alter calculations, sensors or loops.
(()=>{
  const started = (typeof performance!=='undefined'&&performance.now)?performance.now():Date.now();
  const MIN_VISIBLE_MS = 1050;
  const MAX_VISIBLE_MS = 2800;
  let released = false;

  function elapsed(){
    const now=(typeof performance!=='undefined'&&performance.now)?performance.now():Date.now();
    return now-started;
  }

  function homePresentationReady(){
    const page=gel('page-home');
    const home=gel('qa-home');
    if(!page||!home) return false;
    const essential=gel('qaBearing')&&gel('qaPrayer')&&gel('qaGreg')&&gel('qaHijri');
    const finalized=document.body&&document.body.classList.contains('qa-home-active');
    return !!(essential&&finalized);
  }

  function releaseSplash(){
    if(released) return;
    released=true;
    const s=gel('splash');
    if(!s) return;
    s.classList.add('hide');
    setTimeout(()=>{if(s&&s.parentNode)s.remove();},480);
  }

  function checkSplash(){
    if(released) return;
    const t=elapsed();
    if((t>=MIN_VISIBLE_MS&&homePresentationReady())||t>=MAX_VISIBLE_MS){
      releaseSplash();
      return;
    }
    requestAnimationFrame(checkSplash);
  }

  requestAnimationFrame(checkSplash);
})();

_safeOrient();
_lastSp=sunPos(new Date());_lastMp=moonPos(new Date());

// Dev slider event
const devSlider = gel('dev-slider');
if(devSlider){
  devSlider.addEventListener('input', function(){
    const angleDeg = parseFloat(this.value);
    set('dev-deg', angleDeg.toFixed(1)+'°');
    const km = (2*1300*Math.sin(angleDeg/2*D2R)).toFixed(1);
    set('dev-km', km+' كم');
    set('dev-txt', angleDeg===0
      ? 'دقة مثالية — تصل الصلاة إلى الكعبة المشرفة بالضبط'
      : 'خطأ '+angleDeg.toFixed(1)+'° = انحراف '+km+' كم عن الكعبة');
    drawDeviation(angleDeg);
  });
  devSlider.dispatchEvent(new Event('input'));
}

  loop();







