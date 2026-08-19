'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const src=fs.readFileSync('js/astronomical-verification-store.js','utf8');
const backing=new Map();
function localStorage(){return {
  getItem:k=>backing.has(k)?backing.get(k):null,
  setItem:(k,v)=>backing.set(k,String(v)),
  removeItem:k=>backing.delete(k)
};}
function boot(){
  const events=[];
  const sandbox={
    localStorage:localStorage(),
    Date,Math,Number,JSON,Object,
    CustomEvent:function(type,opt){this.type=type;this.detail=opt&&opt.detail;},
    dispatchEvent:e=>events.push(e),
    console
  };
  sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(src,sandbox,{filename:'js/astronomical-verification-store.js'});
  return {store:sandbox.QiblaAstronomicalVerificationStore,events};
}
function valid(body,bearing,timestamp){return {
  body,
  alignmentMode:'astronomical-solved-bearing',
  observedQiblaBearingDeg:bearing,
  referenceQiblaBearingDeg:136,
  trueCameraHeadingDeg:bearing,
  verificationOffsetDeg:136-bearing,
  reticleResidualDeg:0.2,
  targetAzDeg:120,
  targetAltDeg:25,
  quality:0.95,
  latitude:30.0444,
  longitude:31.2357,
  timestamp,
  captureMode:'auto'
};}
function near(actual,expected,message){
  assert(Number.isFinite(actual)&&Math.abs(actual-expected)<1e-9,`${message}: got ${actual}, expected ${expected}`);
}

backing.clear();
const t0=Date.UTC(2026,7,14,2,0,0);
let app=boot();
const A=app.store.record(valid('sun',135.6,t0));
assert(A&&A.body==='sun','success A must be accepted');
near(app.store.getLast().observedQiblaBearingDeg,135.6,'A must become last record');
assert(backing.has(app.store.STORAGE_KEY),'A must persist to localStorage');

// App close/reopen: same persisted A must restore.
app=boot();
assert(app.store.getLast(),'A must restore after reopen');
near(app.store.getLast().observedQiblaBearingDeg,135.6,'restored record must still be A');

// Failed B: invalid input returns null and must not erase or replace A.
const beforeFailure=backing.get(app.store.STORAGE_KEY);
const B=app.store.record({body:'moon',alignmentMode:'invalid',observedQiblaBearingDeg:140});
assert.strictEqual(B,null,'failed B must be rejected');
near(app.store.getLast().observedQiblaBearingDeg,135.6,'failed B must preserve A in memory');
assert.strictEqual(backing.get(app.store.STORAGE_KEY),beforeFailure,'failed B must preserve persisted A');

// Session/UI reset must not erase persistent A.
app.store.reset();
assert.strictEqual(app.store.getLast(),null,'session reset may clear in-memory presentation state');
assert.strictEqual(backing.get(app.store.STORAGE_KEY),beforeFailure,'session reset must not erase persistent A');
app=boot();
near(app.store.getLast().observedQiblaBearingDeg,135.6,'A must return after reopen following UI reset');

// Success C replaces A.
const C=app.store.record(valid('moon',136.2,t0+60000));
assert(C&&C.body==='moon','success C must be accepted');
near(app.store.getLast().observedQiblaBearingDeg,136.2,'C must replace A in memory');
const persistedC=JSON.parse(backing.get(app.store.STORAGE_KEY));
assert.strictEqual(persistedC.body,'moon','C must replace A persistently');
near(persistedC.observedQiblaBearingDeg,136.2,'persisted record must be C');

// Storage layer must not own scientific acceptance/camera/QT mechanics.
for(const re of [/getUserMedia\s*\(/,/activateCompass\s*\(/,/calcQibla\s*\(/,/cameraFOV/i,/successThreshold/i]){
  assert(!re.test(src),`store contains forbidden scientific/runtime responsibility: ${re}`);
}

console.log('Astronomical verification persistent-store gate: PASS');
console.log('A saved -> reopen A -> failed B preserves A -> success C replaces A: PASS');
console.log('Camera / compass / QT / success-threshold ownership: NONE');
