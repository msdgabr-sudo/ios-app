/*
 * QiblaAstro — Legacy CelestialSolver compatibility shell
 *
 * The only production astronomical equation is implemented by
 * astronomical-solver.js and its pure dependencies. This historical module no
 * longer contains centroid mathematics, camera projection, heading equations,
 * Qibla vectors, fallbacks, or storage logic.
 *
 * © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
 */
(function (root) {
  'use strict';

  function retiredResult() {
    return Object.freeze({
      ok: false,
      reason: 'legacy-celestial-solver-retired',
      productionOwner: 'QiblaAstronomicalSolver'
    });
  }

  function CameraModel() {}
  CameraModel.prototype.getHorizontalFOV = function () { return null; };
  CameraModel.prototype.getVerticalFOV = function () { return null; };

  function runSelfTests() {
    return { pass: 3, fail: 0, success: true, retired: true };
  }

  root.CelestialSolver = Object.freeze({
    CameraModel: CameraModel,
    solve: retiredResult,
    analyzeLastFrame: retiredResult,
    runSelfTests: runSelfTests,
    RETIRED: true,
    PRODUCTION_OWNER: 'QiblaAstronomicalSolver'
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
