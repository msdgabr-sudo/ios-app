// QiblaAstro phone-test centroid refinement.
// Refines the detected Sun/Moon center using a local luminance-weighted centroid.
// Test-only layer; production detector remains unchanged.
(function (root) {
  'use strict';

  var base = root.QiblaCelestialDetector;
  if (!base || typeof base.analyzeFrame !== 'function') return;

  function luminance(r, g, b) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }

  function refine(pixels, width, height, detection) {
    if (!detection || !detection.found || !Number.isFinite(detection.x) || !Number.isFinite(detection.y)) {
      return detection;
    }

    var radius = Math.max(5, Math.min(28, Math.round((detection.radiusPx || 7) * 2.4)));
    var cx = Math.round(detection.x);
    var cy = Math.round(detection.y);
    var x0 = Math.max(0, cx - radius);
    var x1 = Math.min(width - 1, cx + radius);
    var y0 = Math.max(0, cy - radius);
    var y1 = Math.min(height - 1, cy + radius);

    var localMax = 0;
    var x, y, i, lum;
    for (y = y0; y <= y1; y++) {
      for (x = x0; x <= x1; x++) {
        i = (y * width + x) * 4;
        lum = luminance(pixels[i], pixels[i + 1], pixels[i + 2]);
        if (lum > localMax) localMax = lum;
      }
    }

    var floor = Math.max(145, localMax * 0.58);
    var sumW = 0;
    var sumX = 0;
    var sumY = 0;
    var used = 0;

    for (y = y0; y <= y1; y++) {
      for (x = x0; x <= x1; x++) {
        i = (y * width + x) * 4;
        lum = luminance(pixels[i], pixels[i + 1], pixels[i + 2]);
        if (lum < floor) continue;
        var dx = x - detection.x;
        var dy = y - detection.y;
        var distanceWeight = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / (radius + 1));
        var weight = Math.max(0, lum - floor) * (0.35 + 0.65 * distanceWeight);
        if (weight <= 0) continue;
        sumW += weight;
        sumX += x * weight;
        sumY += y * weight;
        used++;
      }
    }

    if (sumW <= 0 || used < 3) return detection;

    var refinedX = sumX / sumW;
    var refinedY = sumY / sumW;
    var shift = Math.hypot(refinedX - detection.x, refinedY - detection.y);

    // Reject implausible jumps caused by nearby lamps or reflections.
    if (shift > radius * 0.9) return detection;

    var result = Object.assign({}, detection, {
      x: refinedX,
      y: refinedY,
      centroidRefined: true,
      centroidShiftPx: shift,
      centroidSamples: used,
      detectorMode: (detection.detectorMode || 'detector') + '+weighted-centroid'
    });

    // Reward a small, coherent refinement without artificially forcing acceptance.
    if (Number.isFinite(result.confidence)) {
      var coherence = Math.max(0, 1 - shift / Math.max(radius, 1));
      result.confidence = Math.min(0.94, result.confidence + 0.035 * coherence);
    }

    return result;
  }

  function analyzeFrame(pixels, width, height, options) {
    return refine(pixels, width, height, base.analyzeFrame(pixels, width, height, options));
  }

  root.QiblaCelestialDetector = Object.freeze({
    DEFAULTS: base.DEFAULTS,
    luminance: base.luminance,
    analyzeFrame: analyzeFrame,
    Tracker: base.Tracker,
    runSelfTests: base.runSelfTests,
    refineCentroid: refine,
    fallbackBrightCluster: base.fallbackBrightCluster
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
