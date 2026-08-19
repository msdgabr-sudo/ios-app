'use strict';

const assert = require('assert');
const Trace = require('../js/astronomical-trace.js');

Trace.clear();
const sessionId = Trace.begin({ body: 'moon', mode: 'qibla-axis' });
assert(sessionId, 'Trace must create a session identifier.');

Trace.add('input.location', {
  latitude: 30.12517,
  longitude: 31.13009,
  source: 'device-gnss-location-only'
});
Trace.add('input.celestial', {
  body: 'moon',
  azimuthDeg: 146.04,
  altitudeDeg: 31.6
});
Trace.add('reticle.target', {
  referenceQiblaBearingDeg: 136.04,
  celestialOffsetDeg: 10,
  targetX: 638.2,
  visible: true
});
Trace.add('reticle.evaluation', {
  detectedX: 636.1,
  angularResidualDeg: -0.18,
  aligned: true
});
Trace.add('solver.pose', {
  trueCameraHeadingDeg: 135.72,
  poseAccepted: true
});
Trace.accepted({
  source: 'astronomical-qibla-alignment-observation',
  body: 'moon',
  observedQiblaBearingDeg: 135.72,
  referenceQiblaBearingDeg: 136.04,
  verificationOffsetDeg: 0.32,
  reticleResidualDeg: -0.18
});

const snapshot = Trace.snapshot();
assert(Object.isFrozen(snapshot), 'Trace snapshot must be immutable.');
assert.strictEqual(snapshot.eventCount, 7, 'Trace must preserve the complete stage sequence.');

const accepted = snapshot.events[snapshot.events.length - 1];
assert.strictEqual(accepted.stage, 'decision.accepted');
assert.strictEqual(accepted.payload.observedQiblaBearingDeg, 135.72,
  'Observed astronomical Qibla must remain the solved camera heading.');
assert.strictEqual(accepted.payload.referenceQiblaBearingDeg, 136.04,
  'Reference Qibla must remain a separate comparison value.');
assert.strictEqual(accepted.payload.verificationOffsetDeg, 0.32,
  'Verification offset must remain separate from both bearings.');
assert.notStrictEqual(
  accepted.payload.observedQiblaBearingDeg,
  accepted.payload.referenceQiblaBearingDeg,
  'Trace must not force the astronomical observation to equal the geodetic reference.'
);

const json = Trace.exportJson();
assert(json.includes('astronomical-qibla-alignment-observation'));
assert(json.includes('observedQiblaBearingDeg'));
assert(!json.includes('QT +'));
assert(!json.includes('deviceHeading'));

assert.strictEqual(Trace.runSelfTests().success, true, 'Trace self-tests must pass.');
console.log('Astronomical immutable trace tests passed.');
