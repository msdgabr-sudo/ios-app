'use strict';

const assert = require('assert');
const Reticle = require('../js/qibla-alignment-reticle.js');

const self = Reticle.runSelfTests();
assert.strictEqual(self.success, true, 'Reticle self-tests must pass.');

const target = Reticle.calculateTarget({
  celestialAzimuthDeg: 146.04,
  referenceQiblaBearingDeg: 136.04,
  camera: { width: 1080, height: 1920, horizontalFovDeg: 65 }
});
assert.strictEqual(target.mode, 'qibla-axis');
assert.strictEqual(target.visible, true);
assert(target.targetX > 540, 'Body east/right of Qibla must produce a right-side reticle.');

const evaluation = Reticle.evaluateDetection(target, { x: target.targetX }, 0.5);
assert.strictEqual(evaluation.aligned, true);

const observation = Reticle.observedQiblaFromSolvedHeading(135.72, target, evaluation);
assert.strictEqual(observation.source, 'astronomical-qibla-alignment-observation');
assert(Math.abs(observation.observedQiblaBearingDeg - 135.72) < 1e-9);
assert(Math.abs(observation.referenceQiblaBearingDeg - 136.04) < 1e-9);
assert(Math.abs(observation.verificationOffsetDeg - 0.32) < 1e-9);

assert.throws(() => {
  Reticle.observedQiblaFromSolvedHeading(135.72, target, {
    aligned: false,
    angularResidualDeg: 2
  });
}, /aligned qibla-axis reticle capture/);

console.log('Astronomical Qibla alignment-reticle tests passed.');
