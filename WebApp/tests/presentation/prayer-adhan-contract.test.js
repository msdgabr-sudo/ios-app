const fs=require('fs');const assert=require('assert');
const ui=fs.readFileSync('js/presentation/prayer/adhan-ui.js','utf8');
const engine=fs.readFileSync('js/02-adhan.js','utf8');
const readiness=fs.readFileSync('js/presentation/prayer/audio-readiness.js','utf8');
const finalizer=fs.readFileSync('js/presentation/prayer/audio-finalizer.js','utf8');
const bootstrap=fs.readFileSync('js/presentation/bootstrap.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const page=fs.readFileSync('pages/prayer.html','utf8');
const css=fs.readFileSync('css/presentation/prayer/refinement.css','utf8');
const polish=fs.readFileSync('css/presentation/prayer/final-polish.css','utf8');

assert.match(ui,/makkah:\{/);assert.match(ui,/calm:\{/);assert.match(ui,/deep:\{/);
['الأذان الأساسي','أذان أحمد النفيس','أذان إسلام صبحي'].forEach(x=>assert.ok(ui.includes(x),x));
assert.ok(!ui.includes('www.islamcan.com'),'IslamCan UI dependency must not return');
assert.ok(!engine.includes('www.islamcan.com'),'IslamCan engine default must not return');

// Release contract: user-selectable muezzin playback is local/offline and deterministic.
for(const asset of ['audio/adhan/mecca.mp3','audio/adhan/ahmed-al-nufais.mp3','audio/adhan/islam-sobhi.mp3','audio/adhan/fajr-alafasy.mp3']){
  assert.ok(finalizer.includes(asset),'finalizer missing local Adhan asset: '+asset);
  assert.ok(sw.includes(asset),'Service Worker missing local Adhan asset: '+asset);
  assert.ok(fs.existsSync(asset),'local Adhan file missing: '+asset);
}
assert.match(finalizer,/var LOCAL=\{/);
assert.match(finalizer,/FALLBACK=LOCAL\.makkah\.normal/);
assert.match(finalizer,/playStrict/);
assert.match(finalizer,/audio timeout/);
assert.ok(!finalizer.includes('download.tvquran.com'),'remote TVQuran fallback must not return');
assert.ok(!finalizer.includes('GITHUB_DEFAULT'),'remote GitHub fallback contract must not return');
assert.ok(!finalizer.includes('trySources'),'multi-remote-source fallback must not return');

assert.match(sw,/const VERSION='qiblaastro-v\d+\.\d+-[^']+'/);
assert.match(sw,/audio-finalizer\.js/);assert.match(sw,/final-polish\.css/);
assert.match(bootstrap,/audio-finalizer\.js/);

['الفجر','الظهر','العصر','المغرب','العشاء'].forEach(name=>assert.ok(ui.includes("'"+name+"':'adhan'"),name));
['أذان كامل','إشعار فقط','بدون تنبيه'].forEach(x=>assert.ok(ui.includes(x),x));
assert.match(ui,/qiblaastro-adhan-ui-v5/);assert.match(ui,/LEGACY_KEYS/);assert.match(ui,/enabled:true/);assert.match(ui,/state\.enabled=!state\.enabled/);assert.match(ui,/localStorage\.setItem\(PREF_KEY/);assert.match(engine,/function adhanSetEnabled/);assert.match(engine,/function adhanIsEnabled/);
assert.match(ui,/advance:0/);assert.match(ui,/Notification\.requestPermission/);assert.match(ui,/preAlertPlayed/);assert.match(ui,/qa-adhan-live-status/);
['data-qa-open="fajr"','data-qa-open="advance"','data-qa-open="notifications"','data-qa-open="muezzin"','data-qa-adhan-preview','data-qa-stop-preview','data-qa-back-sheet','data-qa-close-sheet','aria-live="polite"','qa-audio-readiness-btn'].forEach(token=>assert.ok(page.includes(token),token));
assert.match(ui,/openPrayer\(name\)/);assert.match(ui,/open\('notifications'\)/);assert.match(ui,/setBack\(/);assert.match(ui,/lastFocus/);assert.match(ui,/trapFocus/);assert.match(ui,/focus\(\{preventScroll:true\}\)/);
assert.match(readiness,/AudioContext/);assert.match(readiness,/createOscillator/);assert.match(readiness,/playLocalProofTone/);assert.match(readiness,/adhanUnlockAudio/);assert.match(bootstrap,/audio-readiness\.js/);assert.match(sw,/audio-readiness\.js/);
['calcPrayers','solarNoon','sunDeclination','Math.atan2','KAABA_LAT','KAABA_LON','QiblaAstronomicalSolver'].forEach(token=>{assert.ok(!readiness.includes(token),'forbidden readiness token: '+token);assert.ok(!finalizer.includes(token),'forbidden finalizer token: '+token);});
['.qa-chevron','.qa-sheet-arrow','.qa-sheet-option.selected','.qa-sheet-back','.qa-sheet-close','focus-visible','prefers-reduced-motion','.qa-audio-readiness','data-state="ready"'].forEach(token=>assert.ok(css.includes(token),token));assert.match(css,/border-radius:15px/);assert.match(css,/grid-template-columns:44px 1fr 44px/);assert.match(css,/min-height:44px/);
['qa-quick-setting small','qa-sheet-option small','qa-sheet-note','qa-adhan-live-status','qa-audio-readiness-copy small'].forEach(token=>assert.ok(polish.includes(token),token));
['calcPrayers','solarNoon','sunDeclination','Math.atan2','KAABA_LAT','KAABA_LON'].forEach(token=>assert.ok(!ui.includes(token),'forbidden calculation token: '+token));
console.log('Prayer Adhan local/offline presentation contract: PASS');
