'use strict';
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
function assert(c,m){if(!c)throw new Error(m);}
const adapter=read('js/presentation/compass/digital-adapter.js');
const layout=read('js/presentation/compass/digital-layout.js');
const mode=read('js/presentation/compass/mode-view.js');
const runtime=read('js/qibla-card-runtime.js');
const css=read('css/presentation/compass/digital-visual-match.css');
const fixes=read('css/presentation/compass/digital-final-fixes.css');
const sw=read('service-worker.js');

for(const [name,src] of [['digital-adapter.js',adapter],['digital-layout.js',layout],['mode-view.js',mode]]){
  assert(!/\bcalcQibla\b/.test(src),name+' must not calculate Qibla');
  assert(!/\bQT\s*=/.test(src),name+' must not write QT');
  assert(!/getUserMedia|mediaDevices|camera-engine|celestial-solver/i.test(src),name+' must not access camera/solver');
  assert(!/AstronomicalVerificationStore|VerificationSession|recordVerification|verificationOffsetDeg/.test(src),name+' must not access verification state');
}

['box-heading','box-qibla','box-diff','compass-accuracy','gnss-badge','gnss-btn-status'].forEach(x=>assert(adapter.includes(x),'adapter missing canonical output '+x));
['tryBrowserGPS','showManualCal','hideManualCal','resetCompassCalibration'].forEach(x=>assert(adapter.includes(x),'adapter missing existing action '+x));
['calcQibla','sunPos','moonPos','QiblaAstronomicalVerificationStore','getUserMedia','mediaDevices'].forEach(x=>assert(!adapter.includes(x),'adapter crossed engine boundary: '+x));

['qa-compass-legacy-grid','qa-deviation-calculator','qa-calc-title','qa-calc-radar'].forEach(x=>assert(layout.includes(x),'layout missing annotation '+x));
['calcQibla','QT','LAT','LON','deviceHeading','compassAvailable','tryBrowserGPS','startVerification','getUserMedia'].forEach(x=>assert(!layout.includes(x),'layout crossed engine boundary: '+x));

assert(mode.includes('QiblaDigitalCompassAdapter'),'mode view must consume adapter');
assert(mode.includes('QiblaDigitalCompassLayout'),'mode view must consume digital layout mount');
assert(mode.includes('qa-digital-dashboard-active'),'mode view must own digital class');
assert(mode.includes('qa-astro-dashboard-active'),'mode view must own astro class switch');
['calcQibla','deviceHeading','compassAvailable','QiblaAstronomicalVerificationStore','getUserMedia'].forEach(x=>assert(!mode.includes(x),'mode controller crossed engine boundary: '+x));

['#box-heading','#box-qibla','#box-diff','showManualCal','tryBrowserGPS','qa-digital-dashboard-active'].forEach(x=>assert(css.includes(x)||fixes.includes(x),'missing approved digital selector/action '+x));

const a=runtime.indexOf('digital-adapter.js');
const l=runtime.indexOf('digital-layout.js');
const m=runtime.indexOf('mode-view.js');
const x=runtime.indexOf('astro-dashboard.js');
assert(a>=0&&l>a&&m>l&&x>m,'runtime must load adapter -> digital layout -> mode -> astro dashboard');

['digital-adapter.js','digital-layout.js','mode-view.js','digital-visual-match.css','digital-final-fixes.css'].forEach(x=>assert(sw.includes(x),'offline shell missing '+x));
assert(/const VERSION='qiblaastro-v5\.[^']+';/.test(sw),'service worker must use a QiblaAstro v5 cache generation');
console.log('PASS digital compass presentation/engine boundary contract');
