'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const source=fs.readFileSync('js/ios-orientation-adapter.js','utf8');
const listeners={};
const documentListeners={};
let startCount=0;
let stopCount=0;
let legacyCalls=[];

const context={
  console,
  Date,
  Math,
  Number,
  Object,
  setTimeout(fn){fn();return 1;},
  addEventListener(type,fn){(listeners[type]||(listeners[type]=[])).push(fn);},
  document:{
    visibilityState:'visible',
    addEventListener(type,fn){(documentListeners[type]||(documentListeners[type]=[])).push(fn);}
  },
  QiblaIOSNative:{
    platform:'ios',
    startOrientation(){startCount++;return true;},
    stopOrientation(){stopCount++;}
  },
  updateCompassStatus(){},
  onDeviceOrientation(event){legacyCalls.push(event);}
};
context.globalThis=context;
context.window=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:'ios-orientation-adapter.js'});

assert(context.QiblaIOSOrientationAdapter,'adapter API must be exported on native iOS');
assert.strictEqual(startCount,1,'native orientation must start once on adapter activation');
assert.strictEqual(context.QiblaIOSOrientationAdapter.isActive(),true,'adapter must become active');

// Browser DeviceOrientation must be locked out once native iOS is active.
context.onDeviceOrientation({alpha:12,absolute:false});
assert.strictEqual(legacyCalls.length,0,'browser orientation must not become a second iOS compass source');

const now=Date.now();
const nativeDetail={
  source:'ios-native-sensors',
  referenceFrame:'xMagneticNorthZVertical',
  magneticHeading:123.4,
  headingAccuracy:2.1,
  headingTimestamp:now,
  motionTimestamp:now,
  attitude:{quaternion:{x:0,y:0,z:0,w:1}},
  gravity:{x:0,y:0,z:-1}
};
(listeners['qibla-ios-orientation']||[]).forEach(fn=>fn({detail:nativeDetail}));
assert.strictEqual(legacyCalls.length,1,'trusted native sample must enter existing compass handler exactly once');
const synthetic=legacyCalls[0];
assert(Math.abs(synthetic.alpha-236.6)<1e-9,'alpha must reconstruct magnetic heading through the unchanged legacy magnetic branch');
assert.strictEqual(synthetic.absolute,false,'native magnetic sample must remain magnetic so WMM2025 is applied exactly once');
assert.strictEqual(synthetic.__qiblaNativeIOS,true,'synthetic event must carry the native source lock marker');
assert(!Object.prototype.hasOwnProperty.call(synthetic,'webkitCompassHeading'),'adapter must never masquerade as Apple true heading');

// Wrong source and stale samples must be rejected.
(listeners['qibla-ios-orientation']||[]).forEach(fn=>fn({detail:{...nativeDetail,source:'unknown'}}));
(listeners['qibla-ios-orientation']||[]).forEach(fn=>fn({detail:{...nativeDetail,headingTimestamp:now-5000,motionTimestamp:now-5000}}));
assert.strictEqual(legacyCalls.length,1,'untrusted or stale native samples must be rejected');

// Background/foreground must reset JS running flags through the public native API.
context.document.visibilityState='hidden';
(documentListeners.visibilitychange||[]).forEach(fn=>fn());
assert.strictEqual(stopCount,1,'background visibility must stop native orientation');
assert.strictEqual(context.QiblaIOSOrientationAdapter.isActive(),false);
context.document.visibilityState='visible';
(documentListeners.visibilitychange||[]).forEach(fn=>fn());
assert.strictEqual(startCount,2,'foreground visibility must restart native orientation cleanly');
assert.strictEqual(context.QiblaIOSOrientationAdapter.isActive(),true);

// Static guardrails: no protected math or true-heading bypass may be introduced here.
for(const forbidden of ['calculateQiblaBearing','calcQibla(','MDECL=','MDECL +','trueHeading','webkitCompassHeading =']){
  assert(!source.includes(forbidden),`adapter must not contain protected/bypass token: ${forbidden}`);
}
assert(source.includes("absolute: false"),'adapter must deliberately select the existing magnetic branch');
assert(source.includes("xMagneticNorthZVertical"),'adapter must require the audited magnetic-north reference frame');

console.log('iOS orientation adapter gate: PASS');
console.log('Verified: single native iOS source -> unchanged magnetic compass branch -> WMM2025 exactly once.');
