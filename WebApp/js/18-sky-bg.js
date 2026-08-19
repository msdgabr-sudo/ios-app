// ══════════════════════════════════════════════════════════════════════════════
// [JS-27] DYNAMIC SKY BACKGROUND
// ══════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════
//  DYNAMIC SKY BACKGROUND — CSS class switcher
//  Updates body class based on real sun altitude
// ════════════════════════════════════════════════
function updateSkyBackground(sp, now){
  const alt = sp ? sp.altApp : 30;
  const lh  = now.getHours() + now.getMinutes()/60;
  const isMorn = lh < 13;
  let skyClass;
  if(alt < -6)           skyClass = 'sky-night';
  else if(alt < -0.8)    skyClass = isMorn ? 'sky-dawn' : 'sky-dusk';
  else if(alt < 8)       skyClass = isMorn ? 'sky-dawn' : 'sky-golden';
  else if(alt < 25)      skyClass = 'sky-blue';
  else                   skyClass = 'sky-midday';
  
  // Only update if changed
  const body = document.body;
  const classes = ['sky-night','sky-dusk','sky-dawn','sky-golden','sky-blue','sky-midday'];
  if(!body.classList.contains(skyClass)){
    classes.forEach(c => body.classList.remove(c));
    body.classList.add(skyClass);
  }
}



// ══════════════════════════════════════════════════════════════════════════════
// [JS-30] DEVICE COMPASS
// ══════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════
//  DEVICE COMPASS — بوصلة الهاتف الحقيقية
//  Supports: iOS (webkitCompassHeading)
//            Android (DeviceOrientationEvent alpha)
//            WMM2025 magnetic correction applied
// ════════════════════════════════════════════════
let deviceHeading    = null;
let compassAvailable = false;
let compassPermission = 'unknown';
let compassRaw       = null;
let compassAccuracy  = null;
let calSamples       = [];
let calMode          = false;
let calOffset        = 0;
let calTimer         = null;
const CAL_DURATION   = 8000;

try{ calOffset = parseFloat(localStorage.getItem('qibla_calOffset')||'0')||0; }catch(e){}


function _safeOrient(){ _requestCompassPermission(); }


function requestCompassPermission(){
  if(typeof DeviceOrientationEvent !== 'undefined' &&
     typeof DeviceOrientationEvent.requestPermission === 'function'){
    DeviceOrientationEvent.requestPermission()
      .then(perm => {
        compassPermission = perm;
        if(perm === 'granted'){
          _safeOrient();
          updateCompassStatus('granted');
        } else {
          updateCompassStatus('denied');
        }
      }).catch(()=> updateCompassStatus('denied'));
  } else if(typeof DeviceOrientationEvent !== 'undefined'){
    _safeOrient();
    compassPermission = 'granted';
    updateCompassStatus('auto');
  } else {
    updateCompassStatus('unavailable');
  }
}

function updateCompassStatus(status){
  const el  = gel('compass-status');
  const btn = gel('compass-perm-btn');
  if(!el) return;
  const msgs = {
    granted:     ['var(--ok)',   '✓ البوصلة متصلة — تحديث فوري'],
    auto:        ['var(--ok)',   '✓ البوصلة نشطة تلقائياً'],
    denied:      ['var(--err)',  '✗ تم رفض الإذن — استخدم التحديد الفلكي'],
    unavailable: ['var(--warn)', '⚠ الجهاز لا يدعم بوصلة']
  };
  const [col, txt] = msgs[status] || ['var(--muted)', status];
  el.innerHTML = `<span style="color:${col}">${txt}</span>`;
  if(btn && (status==='granted'||status==='auto')) btn.style.display='none';
}

function updateCompassHeadingUI(){
  if(deviceHeading === null) return;
  set('device-heading',     deviceHeading.toFixed(1)+'°');
  set('device-heading-dir', d8(deviceHeading));
  set('device-raw', compassRaw !== null ? compassRaw.toFixed(1)+'°' : '--');
  const qDiff = ((QT - deviceHeading) + 360) % 360;
  set('device-qibla-diff', qDiff.toFixed(1)+'°');
  try{if(window._celCheck)window._celCheck(qDiff);}catch(e){}
  set('device-qibla-side',
    qDiff < 180
      ? `انحرف ${qDiff.toFixed(0)}° يساراً \u2190`
      : `انحرف ${(360-qDiff).toFixed(0)}° يميناً \u2192`);
  const accEl = gel('compass-accuracy');
  if(accEl){
    if(compassAccuracy === null){ accEl.textContent='جاري القياس...'; accEl.style.color='var(--muted)'; }
    else if(compassAccuracy<=1){ accEl.textContent='●●●● ممتازة'; accEl.style.color='var(--ok)'; }
    else if(compassAccuracy<=5){ accEl.textContent='●●●○ جيدة';   accEl.style.color='var(--gold)'; }
    else if(compassAccuracy<=15){accEl.textContent='●●○○ مقبولة'; accEl.style.color='var(--warn)';}
    else { accEl.textContent='●○○○ ضعيفة — يحتاج معايرة'; accEl.style.color='var(--err)'; }
  }
}

function startCalibration(){
  if(calTimer) clearInterval(calTimer);
  calSamples = [];
  calMode    = true;  // set BEFORE anything else

  // Ensure orientation listener is active
  if(!compassAvailable){
    if(typeof DeviceOrientationEvent!=='undefined'){
      if(typeof DeviceOrientationEvent.requestPermission==='function'){
        DeviceOrientationEvent.requestPermission().then(p=>{
          if(p==='granted'){
            _safeOrient();
            compassAvailable=true; compassPermission='granted';
          }
        }).catch(()=>{});
      } else {
        _safeOrient();
        compassAvailable=true;
      }
    }
  }

  const btn  = gel('cal-compass-btn');
  const res  = gel('cal-result');
  const prog = gel('cal-progress-bar');
  if(btn){ btn.disabled=true; btn.style.background='var(--warn)';
           btn.textContent='⏳ ابدأ الحركة — 8ث'; }
  if(res)  res.innerHTML='<span style="color:var(--gold)">🔄 حرّك الهاتف على شكل ∞</span>';
  if(prog) prog.style.width='0%';

  const t0=Date.now();
  calTimer=setInterval(()=>{
    const elapsed=Date.now()-t0;
    const pct=Math.min(100, elapsed/CAL_DURATION*100);
    const sec=Math.max(0,Math.round((CAL_DURATION-elapsed)/1000));
    if(btn) btn.textContent=`⏳ ${sec}ث — حرّك ∞ (${calSamples.length} عينة)`;
    if(prog) prog.style.width=pct.toFixed(0)+'%';
    // Show live sample count so user knows it's working
    if(res && calSamples.length>0 && elapsed<CAL_DURATION-500)
      res.innerHTML=`<span style="color:var(--gold)">✓ ${calSamples.length} عينة — استمر بالحركة</span>`;
    if(pct>=100){ clearInterval(calTimer); finishCalibration(); }
  }, 200);
}

function finishCalibration(){
  calMode = false;
  clearInterval(calTimer);
  const btn  = gel('cal-compass-btn');
  const res  = gel('cal-result');
  const prog = gel('cal-progress-bar');
  if(btn) btn.disabled = false;
  if(prog) prog.style.width = '100%';
  const N = calSamples.length;
  if(N < 5){
    if(btn){ btn.textContent='🔄 إعادة المعايرة'; btn.style.background='var(--err)'; }
    if(res) res.innerHTML=`<span style="color:var(--err)">⚠ عينات غير كافية (${N}) — حرّك أكثر</span>`;
    return;
  }
  const sinS = calSamples.reduce((s,a)=>s+Math.sin(a*D2R),0);
  const cosS = calSamples.reduce((s,a)=>s+Math.cos(a*D2R),0);
  const R_vec= Math.sqrt(sinS*sinS+cosS*cosS)/N;
  const meanRaw=((Math.atan2(sinS,cosS)*R2D)+360)%360;
  const spread=calSamples.reduce((mx,a)=>{
    const d=Math.abs(((a-meanRaw+180+360)%360)-180); return Math.max(mx,d);
  },0);
  if(spread < 40) calOffset = 0;
  try{ localStorage.setItem('qibla_calOffset', calOffset.toString()); }catch(e){}
  const consistency = Math.round(R_vec*100);
  let quality, qColor;
  if(spread<20||R_vec>0.85){ quality='✓✓ ممتازة'; qColor='var(--ok)'; }
  else if(spread<50||R_vec>0.60){ quality='✓ جيدة'; qColor='var(--gold)'; }
  else { quality='⚠ مقبولة'; qColor='var(--warn)'; }
  if(btn){ btn.textContent=`✓ المعايرة: ${quality}`; btn.style.background=qColor; }
  if(res) res.innerHTML=
    `<span style="color:${qColor}">📊 عينات:${N} · انتشار:${spread.toFixed(1)}° · اتساق:${consistency}% · ${quality}</span>`;
  try{ if(navigator.vibrate) navigator.vibrate([100,50,100]); }catch(e){}

  // ── Force immediate compass redraw with new calOffset ──
  if(compassRaw !== null){
    deviceHeading = ((compassRaw + calOffset + MDECL) + 360) % 360;
    const ring = gel('compass-ring');
    if(ring) ring.style.transform = `rotate(${-deviceHeading}deg)`;
    // Redraw canvas immediately
    if(_lastSp && _lastMp){
      drawCompass(_lastSp.az, _lastSp.altApp, _lastMp.az, _lastMp.altApp, eCache);
    }
  }

  // ── Flash compass ring to confirm update ──────────────
  const ringEl = gel('compass-ring');
  if(ringEl){
    const flashColor = qColor.includes('ok') ? '#40B870' :
                       qColor.includes('gold') ? '#C8A44A' : '#E0A030';
    ringEl.style.boxShadow = `0 0 24px 8px ${flashColor}66`;
    setTimeout(()=>{ if(ringEl) ringEl.style.boxShadow='none'; }, 2000);
  }

  updateCompassHeadingUI();
  set('compass-status',
    `<span style="color:${qColor}">✓ معايرة ${quality} · انتشار ${spread.toFixed(0)}° · ${N} عينة</span>`);
}

