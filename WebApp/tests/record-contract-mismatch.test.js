'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const session=fs.readFileSync('js/astronomical-verification-session.js','utf8');
const storeSource=fs.readFileSync('js/astronomical-verification-store.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

assert(
  session.includes("alignmentMode: result.alignmentMode || 'qibla-axis'"),
  'accept() must forward the current astronomical alignment contract.'
);
assert(
  storeSource.includes("input.alignmentMode === 'astronomical-solved-bearing' || input.alignmentMode === 'qibla-axis'"),
  'Store must accept both the canonical solved-bearing mode and the current qibla-axis compatibility mode.'
);
assert(
  storeSource.includes("alignmentMode: 'astronomical-solved-bearing'"),
  'Stored records must normalize alignmentMode to astronomical-solved-bearing.'
);
assert(
  /const VERSION='qiblaastro-v[^']+';/.test(sw),
  'Service worker must expose a versioned cache generation.'
);

const sandbox={module:{exports:{}},exports:{},console};
vm.runInNewContext(storeSource,sandbox,{filename:'astronomical-verification-store.js'});
const Store=sandbox.module.exports;

function makeRecord(alignmentMode){
  return Store.record({
    body:'moon',
    observedQiblaBearingDeg:136.04,
    referenceQiblaBearingDeg:136.04,
    verificationOffsetDeg:33.75,
    trueCameraHeadingDeg:102.29,
    alignmentMode,
    quality:0.64,
    detectionConfidence:0.80,
    gravityQuality:0.87,
    latitude:31.13,
    longitude:30.12,
    timestamp:Date.now(),
    captureMode:'auto'
  });
}

const solved=makeRecord('astronomical-solved-bearing');
assert(solved,'Store must accept the canonical solved-bearing contract.');
assert.strictEqual(solved.alignmentMode,'astronomical-solved-bearing');
assert.strictEqual(solved.observedQiblaBearingDeg,136.04);
assert.strictEqual(solved.trueCameraHeadingDeg,102.29);

const compatible=makeRecord('qibla-axis');
assert(compatible,'Store must accept the current qibla-axis compatibility contract.');
assert.strictEqual(compatible.alignmentMode,'astronomical-solved-bearing');

console.log('RECORD CONTRACT: PASS');
