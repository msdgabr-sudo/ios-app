'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const elements={};
function node(id){
  return elements[id]||(elements[id]={id,textContent:'',style:{},innerHTML:''});
}
function near(a,b,eps=1e-9){return Math.abs(Number(a)-Number(b))<=eps;}
[
  'astro-qibla-value','astro-qibla-hint','astro-deviation-value','astro-deviation-hint',
  'astro-body-value','astro-body-hint','astro-body-label','astro-body-icon',
  'live-compass-hint','box-heading'
].forEach(node);

const listeners={};
const appendedScripts=[];
const context={
  console,
  Date,
  Math,
  Number,
  Object,
  setInterval:()=>1,
  clearInterval:()=>{},
  setTimeout:(fn)=>{fn();return 1;},
  CustomEvent:function(type,init){this.type=type;this.detail=init&&init.detail;},
  addEventListener:(type,fn)=>{(listeners[type]||(listeners[type]=[])).push(fn);},
  dispatchEvent:(event)=>{(listeners[event.type]||[]).forEach(fn=>fn(event));return true;},
  document:{
    readyState:'complete',
    getElementById:id=>elements[id]||null,
    querySelector:()=>null,
    createElement:tag=>({tagName:String(tag).toUpperCase(),src:'',async:true,setAttribute(){},onload:null}),
    head:{appendChild:el=>{appendedScripts.push(el);return el;}},
    documentElement:{appendChild:el=>{appendedScripts.push(el);return el;}},
    addEventListener:()=>{}
  },
  compassAvailable:false,
  deviceHeading:NaN,
  QT:136.04,
  AstroVerification:{
    getFlowState:()=>({state:'success',selectedBody:'moon'}),
    canStartVerification:()=>({possible:true,primary:'moon'})
  }
};
context.globalThis=context;
context.window=context;
vm.createContext(context);

for(const file of ['js/astronomical-verification-store.js','js/compass-cards.js','js/qibla-card-runtime.js']){
  vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
}

const payload={
  body:'moon',
  observedQiblaBearingDeg:136.04,
  referenceQiblaBearingDeg:136.04,
  verificationOffsetDeg:0,
  reticleResidualDeg:0,
  trueCameraHeadingDeg:102.29,
  alignmentMode:'astronomical-solved-bearing',
  quality:.64,
  detectionConfidence:.80,
  gravityQuality:.87,
  targetAzDeg:102.30,
  targetAltDeg:45,
  latitude:31.13,
  longitude:30.125,
  timestamp:Date.now(),
  captureMode:'auto'
};

const record=context.QiblaAstronomicalVerificationStore.record(payload);
assert(record,'Store.record must return a canonical record');
assert(near(record.observedQiblaBearingDeg,136.04),'stored Qibla bearing must preserve 136.04°');
assert(near(record.trueCameraHeadingDeg,102.29),'camera heading must remain 102.29°');
assert.strictEqual(context.__qiblaIndependentAstroRecord,record,'record must be published globally');
assert(context.QiblaCardRuntime&&typeof context.QiblaCardRuntime.update==='function','authoritative card runtime must expose update()');
context.QiblaCardRuntime.update();
assert.strictEqual(elements['astro-qibla-value'].textContent,'136.04°','DOM Qibla card must render canonical record through CompassCards');
assert.strictEqual(elements['astro-deviation-value'].textContent,'0.00°','DOM deviation card must render canonical verification offset');
const bodyCard=context.CompassCards.getAstroBodyCard();
assert.strictEqual(bodyCard.value,'102.3°','CompassCards must retain camera/celestial heading separately');
assert.strictEqual(bodyCard.cardLabel,'البوصلة القمرية','CompassCards must retain the verified body identity');

const session=fs.readFileSync('js/astronomical-verification-session.js','utf8');
assert(session.includes("alignmentMode: result.alignmentMode || 'astronomical-solved-bearing'"),'session must send canonical alignment mode');
assert(!session.includes("alignmentMode: 'qibla-axis',"),'session must not hard-code rejected legacy mode');
const sw=fs.readFileSync('service-worker.js','utf8');
assert(/const VERSION='qiblaastro-v5\.[^']+'/.test(sw),'service worker must identify a current QiblaAstro cache generation');

console.log('ASTRONOMICAL RECORD -> STORE -> COMPASS CARDS -> AUTHORITATIVE RUNTIME: PASS');
