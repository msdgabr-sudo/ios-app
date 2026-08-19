'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const src=fs.readFileSync('js/runtime/local-timezone-adapter.js','utf8');

class FakeDate{
  constructor(value){
    if(value instanceof FakeDate){this.value=value.value;this.offset=value.offset;}
    else if(value&&typeof value==='object'){this.value=value.value||0;this.offset=value.offset||0;}
    else {this.value=Number(value)||0;this.offset=0;}
  }
  getTimezoneOffset(){return this.offset;}
  static now(){return 0;}
}

const listeners=[];
const sandbox={
  Date:FakeDate,
  Number,Math,Object,
  setInterval(){return 1;},clearInterval(){},
  CustomEvent:function(name,opts){this.type=name;this.detail=opts&&opts.detail;},
  dispatchEvent(e){listeners.push(e);},
  solarEvts(){return {rH:6,nH:12,sH:18,azR:80,azS:280,dec:10};}
};
sandbox.globalThis=sandbox;sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(src,sandbox,{filename:'local-timezone-adapter.js'});

const api=sandbox.QiblaLocalTimezone;
assert(api&&api.isInstalled(),'adapter must install over existing solarEvts');
assert.strictEqual(api.legacyOffsetHours,3);

function dateForOffset(hoursEast){return new FakeDate({offset:-hoursEast*60});}
function approx(a,b,eps=1e-9){assert(Math.abs(a-b)<=eps,`${a} != ${b}`);}

// Cairo / UTC+3: no change from the legacy display basis.
let e=api.convertEventHours({rH:6,nH:12,sH:18},dateForOffset(3));
approx(e.rH,6);approx(e.nH,12);approx(e.sH,18);

// London winter UTC+0.
e=api.convertEventHours({rH:6,nH:12,sH:18},dateForOffset(0));
approx(e.rH,3);approx(e.nH,9);approx(e.sH,15);

// London summer DST UTC+1.
e=api.convertEventHours({rH:6,nH:12,sH:18},dateForOffset(1));
approx(e.rH,4);approx(e.nH,10);approx(e.sH,16);

// New York winter UTC-5 and summer UTC-4.
e=api.convertEventHours({rH:6,nH:12,sH:18},dateForOffset(-5));
approx(e.rH,22);approx(e.nH,4);approx(e.sH,10);
e=api.convertEventHours({rH:6,nH:12,sH:18},dateForOffset(-4));
approx(e.rH,23);approx(e.nH,5);approx(e.sH,11);

// Jakarta UTC+7 and Adelaide-style half-hour zone UTC+9:30.
e=api.convertEventHours({rH:6,nH:12,sH:18},dateForOffset(7));
approx(e.rH,10);approx(e.nH,16);approx(e.sH,22);
e=api.convertEventHours({rH:6,nH:12,sH:18},dateForOffset(9.5));
approx(e.rH,12.5);approx(e.nH,18.5);approx(e.sH,0.5);

// Non-time astronomical fields must be byte-for-byte equivalent values.
e=api.convertEventHours({rH:6,nH:12,sH:18,azR:80.25,azS:279.75,dec:-4.5},dateForOffset(0));
assert.strictEqual(e.azR,80.25);assert.strictEqual(e.azS,279.75);assert.strictEqual(e.dec,-4.5);

// Guardrail: this layer must not contain protected compass/verification operations.
for(const token of ['calcQibla(','drawCompass(','activateCompass(','trueCameraHeading','recordVerification(','getUserMedia(']){
  assert(!src.includes(token),`protected operation leaked into timezone adapter: ${token}`);
}

console.log('Local timezone/DST adapter: PASS');
