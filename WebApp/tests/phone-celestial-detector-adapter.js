// QiblaAstro phone-test detector adapter.
// Keeps the production detector untouched and adds a permissive small-disc
// fallback for overexposed Moon images captured by real phone cameras.
(function (root) {
  'use strict';
  var base = root.QiblaCelestialDetector;
  if (!base) return;

  function finite(v) { return typeof v === 'number' && Number.isFinite(v); }
  function luminance(r, g, b) { return 0.299 * r + 0.587 * g + 0.114 * b; }

  function fallbackBrightCluster(pixels, width, height, options) {
    var step = Math.max(1, Math.floor((options && options.sampleStep) || 2));
    var maxL = -1, x, y, i, l;
    for (y = 0; y < height; y += step) {
      for (x = 0; x < width; x += step) {
        i = (y * width + x) * 4;
        l = luminance(pixels[i], pixels[i + 1], pixels[i + 2]);
        if (l > maxL) maxL = l;
      }
    }
    if (maxL < 185) return { found: false, reason: 'fallback-too-dim', maxLuminance: maxL, timestamp: Date.now() };

    var threshold = Math.max(185, maxL - 38);
    var count = 0, sx = 0, sy = 0, minX = width, maxX = -1, minY = height, maxY = -1;
    for (y = 0; y < height; y += step) {
      for (x = 0; x < width; x += step) {
        i = (y * width + x) * 4;
        l = luminance(pixels[i], pixels[i + 1], pixels[i + 2]);
        if (l >= threshold) {
          count += 1; sx += x; sy += y;
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }
    if (!count) return { found: false, reason: 'fallback-no-cluster', maxLuminance: maxL, timestamp: Date.now() };

    var cx = sx / count, cy = sy / count;
    var areaPx = count * step * step;
    var areaRatio = areaPx / (width * height);
    var boxW = Math.max(step, maxX - minX + step);
    var boxH = Math.max(step, maxY - minY + step);
    var aspect = Math.max(boxW, boxH) / Math.max(1, Math.min(boxW, boxH));
    var edgeMargin = Math.min(cx, cy, width - 1 - cx, height - 1 - cy) / Math.min(width, height);

    if (areaRatio < 0.000001 || areaRatio > 0.02) {
      return { found: false, reason: 'fallback-size-invalid', areaRatio: areaRatio, maxLuminance: maxL, timestamp: Date.now() };
    }
    if (aspect > 3.2) {
      return { found: false, reason: 'fallback-shape-invalid', aspect: aspect, maxLuminance: maxL, timestamp: Date.now() };
    }
    if (edgeMargin < 0.025) {
      return { found: false, reason: 'fallback-near-edge', edgeMarginRatio: edgeMargin, maxLuminance: maxL, timestamp: Date.now() };
    }

    var radius = Math.sqrt(areaPx / Math.PI);
    var compactness = Math.max(0, Math.min(1, 1 / aspect));
    var confidence = Math.max(0.58, Math.min(0.94,
      0.60 + 0.18 * compactness + 0.16 * Math.min(1, (maxL - 185) / 70)
    ));

    return {
      found: true,
      detectorMode: 'phone-bright-cluster',
      x: cx,
      y: cy,
      radiusPx: radius,
      brightness: maxL,
      meanLuminance: null,
      brightRatio: areaRatio,
      areaRatio: areaRatio,
      circularity: compactness,
      eccentricity: Math.max(0, Math.min(1, 1 - compactness)),
      edgeMarginRatio: edgeMargin,
      confidence: confidence,
      threshold: threshold,
      clusterPixels: count,
      // Important: timestamp after analysis. Full-resolution phone analysis can
      // take longer than the tracker age window on low-power devices.
      timestamp: Date.now()
    };
  }

  function analyzeFrame(pixels, width, height, options) {
    var relaxed = Object.assign({
      sampleStep: 2,
      minimumLuminance: 185,
      relativeThreshold: 0.72,
      minimumAreaRatio: 0.000001,
      maximumAreaRatio: 0.04,
      minimumCircularity: 0.12,
      maximumEccentricity: 0.97,
      edgeMarginRatio: 0.025
    }, options || {});

    var primary = base.analyzeFrame(pixels, width, height, relaxed);
    if (primary && primary.found) {
      primary.detectorMode = 'primary-relaxed';
      primary.timestamp = Date.now();
      return primary;
    }
    var fallback = fallbackBrightCluster(pixels, width, height, relaxed);
    if (!fallback.found) fallback.primaryReason = primary && primary.reason;
    return fallback;
  }

  root.QiblaCelestialDetector = Object.freeze({
    DEFAULTS: base.DEFAULTS,
    luminance: base.luminance,
    analyzeFrame: analyzeFrame,
    Tracker: base.Tracker,
    runSelfTests: base.runSelfTests,
    fallbackBrightCluster: fallbackBrightCluster
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
