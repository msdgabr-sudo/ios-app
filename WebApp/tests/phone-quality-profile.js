// QiblaAstro — real-phone quality profile for the isolated test page only.
// Calibrated from repeated Moon observations on a real Android phone.
// Production defaults remain unchanged.
(function (root) {
  'use strict';

  var base = root.QiblaVerificationQuality;
  if (!base || typeof base.evaluate !== 'function') return;

  var PHONE_THRESHOLDS = Object.freeze({
    minimumOverallScore: 0.58,
    minimumDetectionConfidence: 0.60,
    minimumGravityQuality: 0.52,
    maximumGravitySpreadDeg: 6.5,
    minimumPoseQuality: 0.65,
    minimumStableFrames: 6,
    maximumFrameAgeMs: 1800,
    maximumGravityAgeMs: 1800,
    maximumTimingSkewMs: 1400
  });

  function merge(baseOptions, overrides) {
    var result = {}, key;
    baseOptions = baseOptions || {};
    overrides = overrides || {};
    for (key in baseOptions) {
      if (Object.prototype.hasOwnProperty.call(baseOptions, key)) result[key] = baseOptions[key];
    }
    for (key in overrides) {
      if (Object.prototype.hasOwnProperty.call(overrides, key)) result[key] = overrides[key];
    }
    return result;
  }

  function evaluate(input, options) {
    return base.evaluate(input, merge(PHONE_THRESHOLDS, options));
  }

  var wrapped = {};
  Object.keys(base).forEach(function (key) { wrapped[key] = base[key]; });
  wrapped.evaluate = evaluate;
  wrapped.PHONE_THRESHOLDS = PHONE_THRESHOLDS;

  root.QiblaVerificationQuality = Object.freeze(wrapped);
})(typeof globalThis !== 'undefined' ? globalThis : window);
