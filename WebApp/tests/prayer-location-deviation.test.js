'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const prayerSrc=fs.readFileSync('js/11-prayer.js','utf8');
const devSrc=fs.readFileSync('js/17-deviation.js','utf8');

function prayerSandbox(lat,lon){
  const writes={};
  const sandbox={
    LAT:lat,LON:lon,D2R:Math.PI/180,R2D:180/Math.PI,
    QT:136,QM:131,MDECL:5,
    set:(id,v)=>{writes[id]=String(v);},
    gel:()=>null,
    shms:s=>String(Math.round(s)),
    hm:h=>Number(h).toFixed(2),
    moonPos:()=>({az:0}),
    console
  };
  vm.createContext(sandbox);
  vm.runInContext(prayerSrc,sandbox,{filename:'js/11-prayer.js'});
  return {sandbox,writes};
}

const day=new Date('2026-08-14T12:00:00Z');
const cairo=prayerSandbox(30.0444,31.2357);
const london=prayerSandbox(51.5074,-0.1278);
const cairoKey=vm.runInContext('prayerCacheKey(new Date("2026-08-14T12:00:00Z"))',cairo.sandbox);
const londonKey=vm.runInContext('prayerCacheKey(new Date("2026-08-14T12:00:00Z"))',london.sandbox);
assert.notStrictEqual(cairoKey,londonKey,'same-day prayer cache key must change with LAT/LON');
assert(cairoKey.includes('30.0444')&&cairoKey.includes('31.2357'),'Cairo coordinates must be represented in cache key');
assert(londonKey.includes('51.5074')&&londonKey.includes('-0.1278'),'London coordinates must be represented in cache key');

const cairoEv={rH:5.35,sH:18.45,nH:11.90,dec:14.0};
const londonEv={rH:4.75,sH:19.75,nH:12.25,dec:14.0};
const cairoPr=vm.runInContext('calcPrayers('+JSON.stringify(cairoEv)+')',cairo.sandbox);
const londonPr=vm.runInContext('calcPrayers('+JSON.stringify(londonEv)+')',london.sandbox);
assert.notDeepStrictEqual(Array.from(cairoPr,x=>x.h),Array.from(londonPr,x=>x.h),'same date at different locations must not reuse identical prayer schedule');

function distanceFor(lat,lon){
  const sandbox={LAT:lat,LON:lon,KLAT:21.42250833,KLON:39.82616667,D2R:Math.PI/180,Math,gel:()=>null,set:()=>{}};
  vm.createContext(sandbox);
  vm.runInContext(devSrc,sandbox,{filename:'js/17-deviation.js'});
  return vm.runInContext('deviationBaseDistanceKm()',sandbox);
}
function deviationKm(distance,deg){return Math.round(2*distance*Math.sin(Math.abs(deg)/2*Math.PI/180));}
const cities={
  Cairo:distanceFor(30.0444,31.2357),
  London:distanceFor(51.5074,-0.1278),
  NewYork:distanceFor(40.7128,-74.0060),
  Jakarta:distanceFor(-6.2088,106.8456)
};
for(const [name,d] of Object.entries(cities))assert(Number.isFinite(d)&&d>0,`${name} distance to Kaaba must be finite`);
for(const deg of [0,0.5,1,2,5,10]){
  const vals=Object.values(cities).map(d=>deviationKm(d,deg));
  if(deg===0)assert(vals.every(v=>v===0),'0° deviation must produce 0 km');
  else assert(new Set(vals).size>1,`${deg}° must not produce the same km globally`);
}
assert(!/const\s+R\s*=\s*1296\b/.test(devSrc),'legacy fixed 1296 km distance must stay removed');

const core=fs.readFileSync('js/04-core.js','utf8');
assert(/const\s+UTC_OFF\s*=\s*3\s*;/.test(core),'time-zone audit expects the current fixed UTC+3 implementation to remain explicitly visible until separate migration');

console.log('Prayer location/cache + deviation gate: PASS');
console.log('Cairo cache:',cairoKey);
console.log('London cache:',londonKey);
console.log('Distances to Kaaba (km):',Object.fromEntries(Object.entries(cities).map(([k,v])=>[k,Number(v.toFixed(1))])));
console.log('Time-zone status: FIXED UTC_OFF=3 detected — separate migration required before global release.');
