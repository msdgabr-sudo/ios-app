// ══════════════════════════════════════════════════════════════════════════════
// QiblaAstro — Qibla Alignment Reticle Geometry
//
// Computes where a celestial body must appear horizontally in the camera frame
// when the optical forward axis is aligned with the reference Qibla azimuth.
// The vertical coordinate is intentionally unconstrained: device gravity and the
// full camera-pose solver recover pitch/roll independently.
//
// Uses no magnetometer, live compass heading, QT global or card text.
// © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
// ══════════════════════════════════════════════════════════════════════════════
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./camera-projection.js'));
    return;
  }
  if (!root || !root.QiblaCameraProjection) {
    throw new Error('QiblaAlignmentReticle requires QiblaCameraProjection.');
  }
  root.QiblaAlignmentReticle = factory(root.QiblaCameraProjection);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Projection) {
  'use strict';

  var DEG_TO_RAD = Math.PI / 180;
  var RAD_TO_DEG = 180 / Math.PI;

  function finite(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }

  function assertFinite(value, name) {
    if (!finite(value)) throw new TypeError((name || 'value') + ' must be finite.');
  }

  function normalize360(value) {
    assertFinite(value, 'angle');
    var result = value % 360;
    return result < 0 ? result + 360 : result;
  }

  function signedDifference(targetDeg, referenceDeg) {
    var value = normalize360(targetDeg) - normalize360(referenceDeg);
    return ((value + 540) % 360) - 180;
  }

  /**
   * Horizontal body angle relative to a camera whose optical axis points to the
   * reference Qibla bearing.
   *
   * Positive means the body must appear to the right of the optical center.
   */
  function celestialOffsetFromQibla(celestialAzimuthDeg, referenceQiblaBearingDeg) {
    return signedDifference(celestialAzimuthDeg, referenceQiblaBearingDeg);
  }

  function buildIntrinsics(camera) {
    camera = camera || {};
    return Projection.intrinsicsFromFov({
      width: Number(camera.width),
      height: Number(camera.height),
      horizontalFovDeg: finite(Number(camera.horizontalFovDeg)) ? Number(camera.horizontalFovDeg) : 65,
      verticalFovDeg: finite(Number(camera.verticalFovDeg)) ? Number(camera.verticalFovDeg) : undefined,
      cx: finite(Number(camera.cx)) ? Number(camera.cx) : undefined,
      cy: finite(Number(camera.cy)) ? Number(camera.cy) : undefined
    });
  }

  /**
   * Returns the vertical target line where the body must be placed. The target
   * may be outside the frame when the body/Qibla separation exceeds the camera
   * horizontal field of view; that observation is then not usable.
   */
  function calculateTarget(options) {
    var input = options || {};
    var bodyAzimuthDeg = Number(input.celestialAzimuthDeg);
    var qiblaBearingDeg = Number(input.referenceQiblaBearingDeg);
    assertFinite(bodyAzimuthDeg, 'celestialAzimuthDeg');
    assertFinite(qiblaBearingDeg, 'referenceQiblaBearingDeg');

    var intrinsics = buildIntrinsics(input.camera);
    var offsetDeg = celestialOffsetFromQibla(bodyAzimuthDeg, qiblaBearingDeg);
    var halfFov = intrinsics.horizontalFovDeg / 2;
    var inHorizontalFov = Math.abs(offsetDeg) < halfFov;
    var targetX = intrinsics.cx + intrinsics.fx * Math.tan(offsetDeg * DEG_TO_RAD);
    var marginPx = finite(Number(input.marginPx)) ? Math.max(0, Number(input.marginPx)) : 24;
    var visible = inHorizontalFov && targetX >= marginPx && targetX <= intrinsics.width - marginPx;

    return Object.freeze({
      mode: 'qibla-axis',
      referenceQiblaBearingDeg: normalize360(qiblaBearingDeg),
      celestialAzimuthDeg: normalize360(bodyAzimuthDeg),
      celestialOffsetDeg: offsetDeg,
      targetX: targetX,
      targetY: null,
      verticalConstraint: false,
      visible: visible,
      reason: visible ? null : 'CELESTIAL_BODY_OUTSIDE_QIBLA_CAMERA_FOV',
      intrinsics: intrinsics
    });
  }

  function evaluateDetection(target, detection, toleranceDeg) {
    if (!target || target.mode !== 'qibla-axis') {
      throw new TypeError('A qibla-axis target is required.');
    }
    detection = detection || {};
    var x = Number(detection.x);
    assertFinite(x, 'detection.x');
    var tolerance = finite(Number(toleranceDeg)) ? Math.abs(Number(toleranceDeg)) : 1;
    var pixelResidual = x - target.targetX;
    var observedOffsetDeg = Math.atan2(
      x - target.intrinsics.cx,
      target.intrinsics.fx
    ) * RAD_TO_DEG;
    var angularResidualDeg = observedOffsetDeg - target.celestialOffsetDeg;

    return Object.freeze({
      mode: 'qibla-axis',
      targetX: target.targetX,
      detectedX: x,
      pixelResidual: pixelResidual,
      angularResidualDeg: angularResidualDeg,
      absoluteAngularResidualDeg: Math.abs(angularResidualDeg),
      toleranceDeg: tolerance,
      aligned: target.visible && Math.abs(angularResidualDeg) <= tolerance
    });
  }

  function observedQiblaFromSolvedHeading(solvedTrueHeadingDeg, target, evaluation) {
    assertFinite(Number(solvedTrueHeadingDeg), 'solvedTrueHeadingDeg');
    if (!target || target.mode !== 'qibla-axis' || !evaluation || !evaluation.aligned) {
      throw new Error('Qibla observation requires an aligned qibla-axis reticle capture.');
    }
    return Object.freeze({
      source: 'astronomical-qibla-alignment-observation',
      observedQiblaBearingDeg: normalize360(Number(solvedTrueHeadingDeg)),
      referenceQiblaBearingDeg: target.referenceQiblaBearingDeg,
      verificationOffsetDeg: signedDifference(
        target.referenceQiblaBearingDeg,
        Number(solvedTrueHeadingDeg)
      ),
      reticleResidualDeg: evaluation.angularResidualDeg
    });
  }

  function runSelfTests() {
    var passed = 0;
    var failed = 0;
    function test(condition) { if (condition) passed++; else failed++; }
    function near(a, b, tolerance) { return Math.abs(a - b) <= tolerance; }

    var centered = calculateTarget({
      celestialAzimuthDeg: 136,
      referenceQiblaBearingDeg: 136,
      camera: { width: 1000, height: 750, horizontalFovDeg: 65 }
    });
    test(centered.visible && near(centered.targetX, 500, 1e-8));

    var right = calculateTarget({
      celestialAzimuthDeg: 146,
      referenceQiblaBearingDeg: 136,
      camera: { width: 1000, height: 750, horizontalFovDeg: 65 }
    });
    test(right.visible && right.targetX > 500);

    var aligned = evaluateDetection(right, { x: right.targetX }, 0.5);
    test(aligned.aligned && near(aligned.angularResidualDeg, 0, 1e-8));

    var observation = observedQiblaFromSolvedHeading(135.72, right, aligned);
    test(near(observation.observedQiblaBearingDeg, 135.72, 1e-9));
    test(near(observation.verificationOffsetDeg, 0.28, 1e-9));

    var outside = calculateTarget({
      celestialAzimuthDeg: 220,
      referenceQiblaBearingDeg: 136,
      camera: { width: 1000, height: 750, horizontalFovDeg: 65 }
    });
    test(outside.visible === false);

    return Object.freeze({ passed: passed, failed: failed, success: failed === 0 });
  }

  return Object.freeze({
    normalize360: normalize360,
    signedDifference: signedDifference,
    celestialOffsetFromQibla: celestialOffsetFromQibla,
    calculateTarget: calculateTarget,
    evaluateDetection: evaluateDetection,
    observedQiblaFromSolvedHeading: observedQiblaFromSolvedHeading,
    runSelfTests: runSelfTests
  });
});
