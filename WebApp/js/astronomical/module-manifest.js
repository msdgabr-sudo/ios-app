/*
 * QiblaAstro — Astronomical protected module manifest
 * Structural map only. Contains no equations and changes no runtime values.
 * © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.QiblaAstronomicalModuleManifest = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var FOUNDATION_REF = 'feature/astronomical-solver-foundation';
  var FOUNDATION_COMMIT = 'ac2bb57aa4a829d1730a64b657432320c6295da7';

  var MODULES = Object.freeze([
    Object.freeze({ id:'trace',       role:'diagnostics', path:'js/astronomical-trace.js' }),
    Object.freeze({ id:'position',    role:'input',       path:'js/position-provider.js' }),
    Object.freeze({ id:'frames',      role:'math-core',   path:'js/coordinate-frames.js' }),
    Object.freeze({ id:'world',       role:'math-core',   path:'js/world-orientation.js' }),
    Object.freeze({ id:'projection',  role:'math-core',   path:'js/camera-projection.js' }),
    Object.freeze({ id:'pose',        role:'math-core',   path:'js/camera-pose.js' }),
    Object.freeze({ id:'gravity',     role:'sensor',      path:'js/gravity-reference.js' }),
    Object.freeze({ id:'qibla',       role:'math-core',   path:'js/astro-qibla-engine.js' }),
    Object.freeze({ id:'quality',     role:'validation',  path:'js/verification-quality.js' }),
    Object.freeze({ id:'detector',    role:'camera',      path:'js/celestial-detector.js' }),
    Object.freeze({ id:'solver',      role:'math-core',   path:'js/astronomical-solver.js' }),
    Object.freeze({ id:'reticle',     role:'validation',  path:'js/qibla-alignment-reticle.js' }),
    Object.freeze({ id:'bridge',      role:'orchestration',path:'js/astronomical-observation-bridge.js' }),
    Object.freeze({ id:'ui',          role:'presentation-adapter',path:'js/astronomical-observatory-ui.js' }),
    Object.freeze({ id:'store',       role:'state',       path:'js/astronomical-verification-store.js' }),
    Object.freeze({ id:'session',     role:'orchestration',path:'js/astronomical-verification-session.js' })
  ]);

  var LOCKED_CONTRACT = Object.freeze({
    horizontalFovDeg: 65,
    alignmentToleranceDeg: 1,
    solverCompassFree: true,
    immutableObservationResult: true,
    foundationRef: FOUNDATION_REF,
    foundationCommit: FOUNDATION_COMMIT
  });

  return Object.freeze({
    FOUNDATION_REF: FOUNDATION_REF,
    FOUNDATION_COMMIT: FOUNDATION_COMMIT,
    MODULES: MODULES,
    LOCKED_CONTRACT: LOCKED_CONTRACT
  });
});
