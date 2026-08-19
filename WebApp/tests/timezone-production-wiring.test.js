'use strict';
const fs=require('fs'),assert=require('assert'),vm=require('vm');

function read(p){return fs.readFileSync(p,'utf8');}
const index=read('index.html');
const label=read('js/presentation/location-label.js');
const adapter=read('js/runtime/local-timezone-adapter.js');
const sync=read('js/runtime/trusted-location-dependent-sync.js');
const sw=read('service-worker.js');

const solarPos=index.indexOf('function solarEvts(');
const labelTag='<script src="js/presentation/location-label.js"></script>';
const labelPos=index.indexOf(labelTag);
assert(solarPos>=0,'production index must define solarEvts');
assert(labelPos>solarPos,'location-label dependency loader must execute after solarEvts is defined');

for(const src of [
  'js/runtime/local-timezone-adapter.js?v=20260814-timezone1',
  'js/prayer/calculation-methods.js?v=20260814-global-prayer2',
  'js/prayer/prayer-settings.js?v=20260814-global-prayer1',
  'js/prayer/prayer-location.js?v=20260814-prayer-location2',
  'js/prayer/time-format.js?v=20260814-prayer-12h1',
  'js/runtime/trusted-location-dependent-sync.js?v=20260814-prayer-runtime6'
]) assert(label.includes(src),`production prayer dependency missing: ${src}`);

// The source defines loader functions in reverse dependency order, so validate callback edges,
// not textual filename order.
assert(/function loadSync\(\)\{script\('js\/runtime\/trusted-location-dependent-sync\.js[^']*','data-qibla-trusted-location-runtime-sync'\);loadUi\(\);\}/.test(label),'loadSync must install trusted runtime before UI binding');
assert(/function loadFormat\(\)\{script\('js\/prayer\/time-format\.js[^']*','data-qibla-prayer-time-format',loadSync\);\}/.test(label),'time-format must callback into trusted runtime sync');
assert(/function loadLocation\(\)\{script\('js\/prayer\/prayer-location\.js[^']*','data-qibla-prayer-location',loadFormat\);\}/.test(label),'prayer-location must callback into time-format');
assert(/function loadSettings\(\)\{script\('js\/prayer\/prayer-settings\.js[^']*','data-qibla-prayer-settings',loadLocation\);\}/.test(label),'prayer-settings must callback into prayer-location');
assert(/function loadMethods\(\)\{script\('js\/prayer\/calculation-methods\.js[^']*','data-qibla-prayer-methods',loadSettings\);\}/.test(label),'calculation methods must callback into prayer-settings');
assert(/function afterTimezone\(\)\{loadMethods\(\);\}/.test(label),'timezone readiness must begin the prayer dependency chain');
assert(label.includes("window.addEventListener('qiblaastro:timezone-adapter-ready',afterTimezone,{once:true})"),'prayer chain must wait for timezone adapter readiness when adapter is already loading');
assert(/script\('js\/runtime\/local-timezone-adapter\.js[^']*','data-qibla-local-timezone-adapter',afterTimezone\);/.test(label),'timezone adapter load must callback into prayer methods');
assert(adapter.includes("root.dispatchEvent(new CustomEvent('qiblaastro:timezone-adapter-ready'"),'timezone adapter must publish readiness after installation');
assert(sync.includes("if(l.mode==='auto')return solarEvts(now)"),'auto/GNSS prayer runtime must consume the wrapped solarEvts');
assert(sync.includes('targetOffset(date,l)-deviceOffset(date)'),'manual prayer runtime must convert device civil events to the selected IANA zone');

for(const asset of [
  './js/runtime/local-timezone-adapter.js',
  './js/runtime/trusted-location-dependent-sync.js',
  './js/prayer/prayer-location.js',
  './js/prayer/time-format.js'
]) assert(sw.includes(asset),`offline cache must include production timezone dependency: ${asset}`);

for(const forbidden of ['sunPos=function','moonPos=function','calcQibla=function','deviceHeading=','MDECL='])
  assert(!adapter.includes(forbidden),`timezone adapter must not replace protected scientific path: ${forbidden}`);

// Runtime proof using the real adapter around a legacy UTC+3 event source.
const events=[];
const root={
  solarEvts:()=>({rH:6,nH:12,sH:18,azR:90,azS:270,dec:12.5}),
  dispatchEvent:e=>events.push(e),
  CustomEvent:function(type,init){this.type=type;this.detail=init&&init.detail;},
  setInterval:()=>0,
  clearInterval:()=>{},
  Date:Date,
  Object:Object,
  Number:Number
};
root.globalThis=root;root.window=root;
vm.runInContext(adapter,vm.createContext(root));
assert(root.QiblaLocalTimezone&&root.QiblaLocalTimezone.isInstalled(),'adapter must install around an existing solarEvts');
assert(events.some(e=>e.type==='qiblaastro:timezone-adapter-ready'),'adapter readiness event must be emitted');

function converted(offsetMinutes){
  const d=new Date('2026-07-15T12:00:00Z');
  d.getTimezoneOffset=()=>offsetMinutes;
  return root.QiblaLocalTimezone.convertEventHours({rH:6,nH:12,sH:18,azR:90,azS:270,dec:12.5},d);
}
const londonSummer=converted(-60); // UTC+1
assert.strictEqual(londonSummer.nH,10,'UTC+3 legacy noon must become UTC+1 civil noon by -2h');
assert.strictEqual(londonSummer.azR,90);assert.strictEqual(londonSummer.azS,270);assert.strictEqual(londonSummer.dec,12.5);
const newYorkSummer=converted(240); // UTC-4
assert.strictEqual(newYorkSummer.nH,5,'UTC+3 legacy noon must become UTC-4 civil noon by -7h');
const jakarta=converted(-420); // UTC+7
assert.strictEqual(jakarta.nH,16,'UTC+3 legacy noon must become UTC+7 civil noon by +4h');
const adelaide=converted(-570); // UTC+9:30
assert.strictEqual(adelaide.nH,18.5,'half-hour zones must remain supported');

console.log('Production timezone wiring gate: PASS');
console.log('Verified: index load order, adapter readiness callbacks, auto/manual prayer consumers, offline cache, half-hour offsets, and protected-engine isolation.');
