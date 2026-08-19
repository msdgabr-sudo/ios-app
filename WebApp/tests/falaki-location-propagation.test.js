'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const src=fs.readFileSync('js/10-astronomy.js','utf8');

function engineAt(lat,lon){
  const sandbox={
    LAT:lat,LON:lon,
    D2R:Math.PI/180,R2D:180/Math.PI,UTC_OFF:3,
    gnssHasTrustedFix:false,gnssSource:'unresolved',gnssAltitudeMeters:0,
    window:{},Math,Date,Number,console
  };
  sandbox.window=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(src,sandbox,{filename:'js/10-astronomy.js'});
  return sandbox;
}
function sample(lat,lon){
  const s=engineAt(lat,lon);
  const iso='2026-08-14T12:00:00Z';
  const dateExpr='new Date("'+iso+'")';
  const sun=vm.runInContext('sunPos('+dateExpr+')',s);
  const moon=vm.runInContext('moonPos('+dateExpr+')',s);
  const ev=vm.runInContext('solarEvts('+dateExpr+')',s);
  assert(ev,'solar events must be available for this test location/date');
  s.__ev=ev;s.__moon=moon;
  const mr=vm.runInContext('moonRS(__ev,__moon)',s);
  return {sun,moon,ev,mr};
}
function changed(a,b,key,tol=1e-6){return Math.abs(Number(a[key])-Number(b[key]))>tol;}

const cairo=sample(30.0444,31.2357);
const london=sample(51.5074,-0.1278);

assert(changed(cairo.sun,london.sun,'az'),'Sun azimuth must follow current LAT/LON');
assert(changed(cairo.sun,london.sun,'altApp'),'Sun altitude must follow current LAT/LON');
assert(changed(cairo.ev,london.ev,'rH'),'Sunrise must follow current LAT/LON');
assert(changed(cairo.ev,london.ev,'nH'),'Solar noon must follow current LAT/LON');
assert(changed(cairo.ev,london.ev,'sH'),'Sunset must follow current LAT/LON');
assert(changed(cairo.moon,london.moon,'az'),'Moon azimuth must follow current LAT/LON');
assert(changed(cairo.moon,london.moon,'altApp'),'Moon altitude must follow current LAT/LON');
assert(changed(cairo.mr,london.mr,'rH'),'Moon rise display model must follow location-dependent solar event input');
assert(changed(cairo.mr,london.mr,'sH'),'Moon set display model must follow location-dependent solar event input');

const syncSrc=fs.readFileSync('js/presentation/falaki/event-times-sync.js','utf8');
assert(syncSrc.includes('root.LAT')&&syncSrc.includes('root.LON'),'Falaki presentation sync must read current parent LAT/LON');
assert(syncSrc.includes('root.solarEvts')&&syncSrc.includes('root.moonPos')&&syncSrc.includes('root.moonRS'),'Falaki sync must reuse existing engines');
assert(!/calcQibla\s*\(/.test(syncSrc),'Falaki presentation sync must not calculate QT');
assert(!/activateCompass\s*\(/.test(syncSrc),'Falaki presentation sync must not activate compass');

function fmt(x){return Number(x).toFixed(4);}
console.log('Falaki location propagation gate: PASS');
console.log('Cairo sun az/alt:',fmt(cairo.sun.az),fmt(cairo.sun.altApp),'rise/noon/set:',fmt(cairo.ev.rH),fmt(cairo.ev.nH),fmt(cairo.ev.sH));
console.log('London sun az/alt:',fmt(london.sun.az),fmt(london.sun.altApp),'rise/noon/set:',fmt(london.ev.rH),fmt(london.ev.nH),fmt(london.ev.sH));
console.log('Cairo moon az/alt:',fmt(cairo.moon.az),fmt(cairo.moon.altApp),'rise/set:',fmt(cairo.mr.rH),fmt(cairo.mr.sH));
console.log('London moon az/alt:',fmt(london.moon.az),fmt(london.moon.altApp),'rise/set:',fmt(london.mr.rH),fmt(london.mr.sH));
