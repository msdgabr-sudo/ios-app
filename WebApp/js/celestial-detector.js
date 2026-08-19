// ══════════════════════════════════════════════════════════════════════════════
// QiblaAstro — Celestial Detector
// Multi-frame bright-disc detection for Sun/Moon observations.
// © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
// ══════════════════════════════════════════════════════════════════════════════

(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.QiblaCelestialDetector = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var DEFAULTS = Object.freeze({
    sampleStep: 2,
    minimumLuminance: 205,
    relativeThreshold: 0.82,
    maximumBrightRatio: 0.32,
    minimumAreaRatio: 0.00003,
    maximumAreaRatio: 0.08,
    minimumCircularity: 0.42,
    maximumEccentricity: 0.88,
    edgeMarginRatio: 0.04,
    historySize: 12,
    minimumStableFrames: 5,
    maximumCentroidSpreadPx: 8,
    maximumRadiusSpreadRatio: 0.35,
    maximumFrameAgeMs: 900
  });

  function finite(v) { return typeof v === 'number' && Number.isFinite(v); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function luminance(r, g, b) { return 0.299 * r + 0.587 * g + 0.114 * b; }
  function merge(options) {
    var out = {}, k;
    for (k in DEFAULTS) out[k] = DEFAULTS[k];
    options = options || {};
    for (k in options) if (Object.prototype.hasOwnProperty.call(options, k)) out[k] = options[k];
    return out;
  }
  function assertFrame(pixels, width, height) {
    if (!pixels || !finite(width) || !finite(height) || width <= 0 || height <= 0) {
      throw new TypeError('pixels, width and height are required.');
    }
    if (pixels.length < width * height * 4) throw new RangeError('pixel buffer is too small.');
  }

  function analyzeFrame(pixels, width, height, options) {
    assertFrame(pixels, width, height);
    var cfg = merge(options), step = Math.max(1, Math.floor(cfg.sampleStep));
    var maxL = -1, sumL = 0, samples = 0, x, y, idx, l;
    for (y = 0; y < height; y += step) {
      for (x = 0; x < width; x += step) {
        idx = (y * width + x) * 4;
        l = luminance(pixels[idx], pixels[idx + 1], pixels[idx + 2]);
        if (l > maxL) maxL = l;
        sumL += l; samples++;
      }
    }
    if (!samples) return { found: false, reason: 'empty-frame' };
    var meanL = sumL / samples;
    var threshold = Math.max(cfg.minimumLuminance, maxL * cfg.relativeThreshold);
    if (maxL < cfg.minimumLuminance) return { found: false, reason: 'too-dim', maxLuminance: maxL, meanLuminance: meanL };

    var count = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
    var minX = width, maxX = -1, minY = height, maxY = -1;
    for (y = 0; y < height; y += step) {
      for (x = 0; x < width; x += step) {
        idx = (y * width + x) * 4;
        l = luminance(pixels[idx], pixels[idx + 1], pixels[idx + 2]);
        if (l >= threshold) {
          count++; sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y;
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }
    if (!count) return { found: false, reason: 'no-candidate' };
    var brightRatio = count / samples;
    if (brightRatio > cfg.maximumBrightRatio) return { found: false, reason: 'too-uniform', brightRatio: brightRatio };

    var areaPx = count * step * step;
    var frameArea = width * height;
    var areaRatio = areaPx / frameArea;
    if (areaRatio < cfg.minimumAreaRatio) return { found: false, reason: 'candidate-too-small', areaRatio: areaRatio };
    if (areaRatio > cfg.maximumAreaRatio) return { found: false, reason: 'candidate-too-large', areaRatio: areaRatio };

    var cx = sx / count, cy = sy / count;
    var varX = Math.max(0, sxx / count - cx * cx);
    var varY = Math.max(0, syy / count - cy * cy);
    var cov = sxy / count - cx * cy;
    var trace = varX + varY;
    var disc = Math.sqrt(Math.max(0, (varX - varY) * (varX - varY) + 4 * cov * cov));
    var lambda1 = Math.max(0, (trace + disc) / 2);
    var lambda2 = Math.max(0, (trace - disc) / 2);
    var eccentricity = lambda1 > 0 ? Math.sqrt(Math.max(0, 1 - lambda2 / lambda1)) : 1;

    var boxW = Math.max(step, maxX - minX + step), boxH = Math.max(step, maxY - minY + step);
    var equivalentRadius = Math.sqrt(areaPx / Math.PI);
    var perimeterApprox = 2 * (boxW + boxH);
    var circularity = perimeterApprox > 0 ? clamp((4 * Math.PI * areaPx) / (perimeterApprox * perimeterApprox), 0, 1) : 0;
    if (circularity < cfg.minimumCircularity) return { found: false, reason: 'not-circular', circularity: circularity };
    if (eccentricity > cfg.maximumEccentricity) return { found: false, reason: 'too-elongated', eccentricity: eccentricity };

    var edgeMargin = Math.min(cx, cy, width - 1 - cx, height - 1 - cy) / Math.min(width, height);
    if (edgeMargin < cfg.edgeMarginRatio) return { found: false, reason: 'near-edge', edgeMarginRatio: edgeMargin };

    var contrast = clamp((maxL - meanL) / 255, 0, 1);
    var shapeScore = clamp(0.55 * circularity + 0.45 * (1 - eccentricity), 0, 1);
    var sizeScore = areaRatio <= 0.02 ? 1 : clamp(1 - (areaRatio - 0.02) / (cfg.maximumAreaRatio - 0.02), 0, 1);
    var confidence = clamp(0.42 * contrast + 0.38 * shapeScore + 0.20 * sizeScore, 0, 1);

    return {
      found: true,
      x: cx, y: cy,
      radiusPx: equivalentRadius,
      brightness: maxL,
      meanLuminance: meanL,
      brightRatio: brightRatio,
      areaRatio: areaRatio,
      circularity: circularity,
      eccentricity: eccentricity,
      edgeMarginRatio: edgeMargin,
      confidence: confidence,
      timestamp: finite(options && options.timestamp) ? options.timestamp : Date.now()
    };
  }

  function median(values) {
    var a = values.slice().sort(function (x, y) { return x - y; });
    var m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  }
  function distance(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }

  function Tracker(options) {
    this.options = merge(options);
    this.history = [];
  }
  Tracker.prototype.reset = function () { this.history.length = 0; };
  Tracker.prototype.push = function (observation) {
    if (!observation || !observation.found) return this.getResult();
    this.history.push(observation);
    while (this.history.length > this.options.historySize) this.history.shift();
    return this.getResult();
  };
  Tracker.prototype.getResult = function (now) {
    now = finite(now) ? now : Date.now();
    var valid = this.history.filter(function (o) { return now - o.timestamp <= this.options.maximumFrameAgeMs; }, this);
    if (valid.length < this.options.minimumStableFrames) {
      return { stable: false, reason: 'insufficient-stable-frames', frameCount: valid.length };
    }
    var mx = median(valid.map(function (o) { return o.x; }));
    var my = median(valid.map(function (o) { return o.y; }));
    var mr = median(valid.map(function (o) { return o.radiusPx; }));
    var center = { x: mx, y: my };
    var maxSpread = 0, maxRadiusSpread = 0;
    valid.forEach(function (o) {
      maxSpread = Math.max(maxSpread, distance(o, center));
      if (mr > 0) maxRadiusSpread = Math.max(maxRadiusSpread, Math.abs(o.radiusPx - mr) / mr);
    });
    if (maxSpread > this.options.maximumCentroidSpreadPx) {
      return { stable: false, reason: 'centroid-unstable', frameCount: valid.length, centroidSpreadPx: maxSpread };
    }
    if (maxRadiusSpread > this.options.maximumRadiusSpreadRatio) {
      return { stable: false, reason: 'radius-unstable', frameCount: valid.length, radiusSpreadRatio: maxRadiusSpread };
    }
    var confidence = valid.reduce(function (s, o) { return s + o.confidence; }, 0) / valid.length;
    var stabilityScore = clamp(1 - maxSpread / this.options.maximumCentroidSpreadPx, 0, 1);
    confidence = clamp(0.75 * confidence + 0.25 * stabilityScore, 0, 1);
    return {
      stable: true,
      x: mx, y: my, radiusPx: mr,
      confidence: confidence,
      frameCount: valid.length,
      centroidSpreadPx: maxSpread,
      radiusSpreadRatio: maxRadiusSpread,
      timestamp: Math.max.apply(null, valid.map(function (o) { return o.timestamp; }))
    };
  };

  function runSelfTests(logger) {
    var log = logger || console, passed = 0, failed = 0;
    function ok(name, cond) { if (cond) { passed++; if (log && log.log) log.log('PASS:', name); } else { failed++; if (log && log.error) log.error('FAIL:', name); } }
    function frame(w, h, bg) { var a = new Uint8ClampedArray(w*h*4); for (var i=0;i<w*h;i++){a[i*4]=a[i*4+1]=a[i*4+2]=bg;a[i*4+3]=255;} return a; }
    function disc(a,w,h,cx,cy,r,v){ for(var y=0;y<h;y++)for(var x=0;x<w;x++){var dx=x-cx,dy=y-cy;if(dx*dx+dy*dy<=r*r){var i=(y*w+x)*4;a[i]=a[i+1]=a[i+2]=v;}} }
    var w=200,h=120,a=frame(w,h,20); disc(a,w,h,100,60,8,255);
    var d=analyzeFrame(a,w,h,{sampleStep:1,timestamp:1000});
    ok('bright disc found', d.found);
    ok('centroid x accurate', Math.abs(d.x-100)<1);
    ok('centroid y accurate', Math.abs(d.y-60)<1);
    ok('radius plausible', d.radiusPx>6 && d.radiusPx<10);
    ok('confidence positive', d.confidence>0.5);
    var dim=analyzeFrame(frame(w,h,20),w,h,{sampleStep:1}); ok('dim frame rejected', !dim.found && dim.reason==='too-dim');
    var uniform=frame(w,h,250); var u=analyzeFrame(uniform,w,h,{sampleStep:1}); ok('uniform glare rejected', !u.found);
    var edge=frame(w,h,20); disc(edge,w,h,2,60,8,255); var e=analyzeFrame(edge,w,h,{sampleStep:1}); ok('edge candidate rejected', !e.found && e.reason==='near-edge');
    var t=new Tracker({minimumStableFrames:5,maximumFrameAgeMs:5000});
    for(var j=0;j<5;j++) t.push({found:true,x:100+j*0.2,y:60,radiusPx:8,confidence:0.9,timestamp:1000+j});
    var tr=t.getResult(1200); ok('stable sequence accepted', tr.stable); ok('stable centroid accurate', Math.abs(tr.x-100.4)<0.3);
    var t2=new Tracker({minimumStableFrames:5,maximumFrameAgeMs:5000,maximumCentroidSpreadPx:4});
    [0,10,0,10,0].forEach(function(x,j){t2.push({found:true,x:100+x,y:60,radiusPx:8,confidence:0.9,timestamp:1000+j});});
    ok('moving target rejected', !t2.getResult(1200).stable);
    var t3=new Tracker({minimumStableFrames:5,maximumFrameAgeMs:10});
    for(j=0;j<5;j++) t3.push({found:true,x:100,y:60,radiusPx:8,confidence:0.9,timestamp:1000+j});
    ok('stale frames rejected', !t3.getResult(2000).stable);
    var t4=new Tracker({minimumStableFrames:5,maximumFrameAgeMs:5000,maximumRadiusSpreadRatio:0.2});
    [8,8,15,8,8].forEach(function(r,j){t4.push({found:true,x:100,y:60,radiusPx:r,confidence:0.9,timestamp:1000+j});});
    ok('radius instability rejected', !t4.getResult(1200).stable);
    ok('tracker reset works', (t.reset(), t.history.length===0));
    return {passed:passed,failed:failed,success:failed===0};
  }

  return Object.freeze({ DEFAULTS: DEFAULTS, luminance: luminance, analyzeFrame: analyzeFrame, Tracker: Tracker, runSelfTests: runSelfTests });
});
