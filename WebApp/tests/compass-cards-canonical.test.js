'use strict';

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync('js/compass-cards.js', 'utf8');

assert(source.includes('observedQiblaBearingDeg'),
  'Astronomical Qibla card must read observedQiblaBearingDeg.');
assert(source.includes('referenceQiblaBearingDeg'),
  'Canonical record validation must retain the separate reference bearing.');
assert(source.includes('verificationOffsetDeg'),
  'Astronomical verification card must read verificationOffsetDeg.');
assert(source.includes("schemaVersion === 4"),
  'Cards must require the schema-v4 observation contract.');
assert(source.includes("alignmentMode === 'astronomical-solved-bearing'"),
  'Cards must require an aligned qibla-axis observation.');
assert(!source.includes('Number(record.rawAstronomicalQiblaDeg)'),
  'Cards must not read the retired rawAstronomicalQiblaDeg field.');
assert(!source.includes('Number(record.qiblaBearingDeg)'),
  'Cards must not fallback to qiblaBearingDeg.');
assert(!source.includes('Number(record.rawRelativeQiblaAngleDeg)'),
  'Cards must not read the retired rawRelativeQiblaAngleDeg field.');
assert(!source.includes('Number(record.relativeQiblaAngleDeg)'),
  'Cards must not fallback to relativeQiblaAngleDeg.');

const sandbox = {
  globalThis: {},
  window: {},
  Date,
  Math,
  Number,
  Object,
  String
};
sandbox.globalThis = sandbox.window;
vm.runInNewContext(source, sandbox, { filename: 'compass-cards.js' });
const Cards = sandbox.window.CompassCards;
assert(Cards, 'CompassCards API must initialize.');

const canonical = {
  schemaVersion: 4,
  source: 'astronomical-qibla-solved-bearing',
  alignmentMode: 'astronomical-solved-bearing',
  body: 'sun',
  trueCameraHeadingDeg: 135.72,
  observedQiblaBearingDeg: 136.04,
  referenceQiblaBearingDeg: 136.04,
  verificationOffsetDeg: 0.32,
  timestamp: Date.now()
};

const qibla = Cards.getAstroQiblaCard({ independentRecord: canonical });
const deviation = Cards.getAstroDeviationCard({ independentRecord: canonical });
assert.strictEqual(qibla.value, '136.04°',
  'Card must display the solved Qibla bearing, not the camera heading.');
assert.strictEqual(deviation.value, '0.32°',
  'Deviation card must display the verification offset.');
assert.notStrictEqual(qibla.value, '135.72°',
  'Qibla card must not display the camera heading.');

const legacyOnly = Cards.getAstroQiblaCard({ independentRecord: {
  rawAstronomicalQiblaDeg: 136.04,
  qiblaBearingDeg: 136.04,
  rawRelativeQiblaAngleDeg: 0
}});
assert.strictEqual(legacyOnly.state, 'error',
  'A legacy-only record must be rejected instead of displayed.');

console.log('Canonical astronomical CompassCards contract tests passed.');
