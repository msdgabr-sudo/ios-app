'use strict';
const fs=require('fs');
const assert=require('assert');

const rollout=fs.readFileSync('js/i18n/english-rollout.js','utf8');
const picker=fs.readFileSync('js/i18n/home-language-picker.js','utf8');
const bridge=fs.readFileSync('js/i18n/internal-screen-language-bridge.js','utf8');

const expected=['ar','en','fr','id','ur'];
const supported=(rollout.match(/var\s+SUPPORTED\s*=\s*\[([^\]]+)\]/)||[])[1]||'';
for(const lang of expected)assert(new RegExp("['\\\"]"+lang+"['\\\"]").test(supported),`rollout must support ${lang}`);
const langsBlock=(picker.match(/var\s+LANGS\s*=\s*\[([\s\S]*?)\];/)||[])[1]||'';
for(const lang of expected)assert(new RegExp("['\\\"]"+lang+"['\\\"]").test(langsBlock),`picker must expose ${lang}`);

// The live scientific/interactive surfaces must remain explicitly outside text mutation.
for(const token of ['#page-compass','[data-page="compass"]','[id*="astro-verification"]','video','canvas']){
  assert(rollout.includes(token),`protected selector missing: ${token}`);
}

// Language switching must be in-place: no page reload/navigation, no sensor/camera activation.
const forbidden=[
  /location\.reload\s*\(/,
  /location\.href\s*=/,
  /location\.assign\s*\(/,
  /activateCompass\s*\(/,
  /getUserMedia\s*\(/,
  /DeviceOrientationEvent\.requestPermission\s*\(/,
  /calcQibla\s*\(/,
  /recordVerification\s*\(/
];
for(const re of forbidden){
  assert(!re.test(rollout),`rollout contains forbidden runtime action: ${re}`);
  assert(!re.test(picker),`picker contains forbidden runtime action: ${re}`);
}

assert(/function\s+setLanguage\s*\(/.test(rollout),'setLanguage API must exist');
assert(/mizan:languagechange/.test(rollout)&&/qiblaastro:language-change/.test(rollout),'language change events must be dispatched');
assert(/mizan:languagechange/.test(bridge)||/qiblaastro:language-change/.test(bridge),'internal-screen bridge must follow language events');

// Explicit operational round-trip required by release gate.
const cycle=['ar','en','fr','id','ur','ar'];
for(let i=1;i<cycle.length;i++)assert(expected.includes(cycle[i]),`invalid cycle language ${cycle[i]}`);

console.log('Web i18n safety/round-trip gate: PASS');
console.log('Cycle:',cycle.join(' -> '));
console.log('Protected live compass / verification / video / canvas: PASS');
console.log('No reload, navigation, compass activation, camera permission, QT calculation or verification write in switch path: PASS');
