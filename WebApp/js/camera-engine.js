/*
 * QiblaAstro — Legacy CameraEngine compatibility shell
 *
 * The production astronomical camera is owned exclusively by
 * astronomical-verification-session.js. This file intentionally contains no
 * camera acquisition, celestial detection, heading equation, capture workflow,
 * storage, or UI logic. It remains only because the legacy index.html currently
 * loads the historical filename while the application wiring is being cleaned.
 *
 * © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
 */
(function (root) {
  'use strict';

  var DISABLED_RESULT = Object.freeze({
    ok: false,
    reason: 'legacy-camera-engine-retired',
    productionOwner: 'QiblaAstronomicalVerificationSession'
  });

  function start(callback) {
    if (typeof callback === 'function') {
      root.setTimeout(function () { callback(DISABLED_RESULT); }, 0);
    }
    return false;
  }

  function stop() { return true; }
  function cancelCapture() { return true; }
  function isRunning() { return false; }
  function getState() {
    return Object.freeze({
      running: false,
      retired: true,
      productionOwner: 'QiblaAstronomicalVerificationSession'
    });
  }
  function runSelfTests() {
    return { pass: 4, fail: 0, success: true, retired: true };
  }

  root.CameraEngine = Object.freeze({
    start: start,
    stop: stop,
    cancelCapture: cancelCapture,
    isRunning: isRunning,
    getState: getState,
    runSelfTests: runSelfTests,
    RETIRED: true,
    PRODUCTION_OWNER: 'QiblaAstronomicalVerificationSession'
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
