// QiblaAstro phone-test live overlay and auto-capture fix.
// Aligns the main marker with the detected centroid and triggers auto capture from live progress.
// © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
(function (root) {
  'use strict';

  var module = root.QiblaAstronomicalObservationBridge;
  if (!module || !module.AstronomicalObservationBridge || !root.document) return;

  var InnerBridge = module.AstronomicalObservationBridge;
  var AUTO_READY_MS = 900;
  var MIN_FRAMES = 3;
  var MIN_CONFIDENCE = 0.50;
  var MIN_GRAVITY = 0.48;

  function clamp01(value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
  }

  function ensureMarker() {
    var camera = root.document.querySelector('.camera');
    if (!camera) return null;

    var overlay = root.document.getElementById('overlay');
    if (overlay) overlay.style.opacity = '0';

    var marker = root.document.getElementById('liveCelestialMarker');
    if (!marker) {
      marker = root.document.createElement('div');
      marker.id = 'liveCelestialMarker';
      marker.setAttribute('aria-hidden', 'true');
      marker.style.cssText =
        'position:absolute;z-index:11;width:74px;height:74px;border:4px solid #65d69a;' +
        'border-radius:50%;transform:translate(-50%,-50%);display:none;pointer-events:none;' +
        'box-shadow:0 0 0 2px rgba(0,0,0,.25),0 0 22px rgba(101,214,154,.45)';
      marker.innerHTML =
        '<span style="position:absolute;left:-17px;right:-17px;top:50%;height:3px;background:#65d69a;transform:translateY(-50%)"></span>' +
        '<span style="position:absolute;top:-17px;bottom:-17px;left:50%;width:3px;background:#65d69a;transform:translateX(-50%)"></span>';
      camera.appendChild(marker);
    }
    return marker;
  }

  function mode() {
    var select = root.document.getElementById('captureMode');
    return select ? select.value : 'auto';
  }

  function OuterBridge(options) {
    var opts = Object.assign({}, options || {});
    var originalProgress = typeof opts.onProgress === 'function' ? opts.onProgress : function () {};
    var originalResult = typeof opts.onResult === 'function' ? opts.onResult : function () {};
    var originalError = typeof opts.onError === 'function' ? opts.onError : function () {};

    var instance = null;
    var marker = ensureMarker();
    var readySince = 0;
    var liveReady = false;
    var autoTriggered = false;
    var timer = 0;

    function positionMarker(observation) {
      if (!marker || !instance || !instance.canvas || !observation || !observation.found) {
        if (marker) marker.style.display = 'none';
        return;
      }

      var camera = root.document.querySelector('.camera');
      if (!camera) return;
      var sourceW = Number(instance.canvas.width) || 1;
      var sourceH = Number(instance.canvas.height) || 1;
      var boxW = camera.clientWidth || 1;
      var boxH = camera.clientHeight || 1;

      // The preview uses object-fit: cover. Apply the same scale and crop offsets.
      var scale = Math.max(boxW / sourceW, boxH / sourceH);
      var offsetX = (boxW - sourceW * scale) / 2;
      var offsetY = (boxH - sourceH * scale) / 2;
      var x = Number(observation.x) * scale + offsetX;
      var y = Number(observation.y) * scale + offsetY;

      marker.style.left = x + 'px';
      marker.style.top = y + 'px';
      marker.style.display = 'block';
    }

    function triggerAutoCapture() {
      if (autoTriggered || mode() !== 'auto' || !liveReady) return;
      var shutter = root.document.getElementById('captureShutter');
      if (!shutter) return;
      autoTriggered = true;
      root.__qiblaAutoCaptureTriggered = true;
      var hint = root.document.getElementById('captureHint');
      if (hint) {
        hint.textContent = 'ثبات مكتمل — جارٍ الالتقاط التلقائي…';
        hint.style.color = '#65d69a';
      }
      shutter.click();
    }

    opts.onProgress = function (progress) {
      var tracked = progress && progress.trackedDetection || {};
      var observation = progress && progress.frameObservation;
      var frames = Number(tracked.frameCount || tracked.stableFrames || 0);
      var confidence = clamp01(tracked.confidence);
      var gravity = clamp01(progress && progress.gravity && progress.gravity.quality);

      positionMarker(observation);
      liveReady = frames >= MIN_FRAMES && confidence >= MIN_CONFIDENCE && gravity >= MIN_GRAVITY;

      if (mode() !== 'auto' || !liveReady) {
        readySince = 0;
        if (mode() !== 'auto') autoTriggered = false;
      } else if (!readySince) {
        readySince = Date.now();
      }

      originalProgress(progress);
    };

    opts.onResult = function (result) {
      if (root.__qiblaAutoCaptureTriggered && result) {
        result = Object.assign({}, result, { lockSource: 'auto' });
        var status = root.document.getElementById('status');
        if (status) {
          status.textContent = 'تم التقاط القراءة تلقائيًا';
          status.className = 'v ok';
        }
      }
      originalResult(result);
    };

    opts.onError = function (error) {
      originalError(error);
    };

    instance = new InnerBridge(opts);

    timer = root.setInterval(function () {
      if (mode() === 'auto' && liveReady && readySince && Date.now() - readySince >= AUTO_READY_MS) {
        triggerAutoCapture();
      }
    }, 100);

    var select = root.document.getElementById('captureMode');
    if (select) {
      select.addEventListener('change', function () {
        readySince = 0;
        liveReady = false;
        autoTriggered = false;
        root.__qiblaAutoCaptureTriggered = false;
      });
    }

    var originalReset = instance.resetTerminalState;
    instance.resetTerminalState = function () {
      readySince = 0;
      liveReady = false;
      autoTriggered = false;
      root.__qiblaAutoCaptureTriggered = false;
      if (marker) marker.style.display = 'none';
      return typeof originalReset === 'function' ? originalReset.apply(instance, arguments) : undefined;
    };

    var originalStop = instance.stop;
    instance.stop = function () {
      if (timer) root.clearInterval(timer);
      if (marker) marker.style.display = 'none';
      return typeof originalStop === 'function' ? originalStop.apply(instance, arguments) : undefined;
    };

    return instance;
  }

  OuterBridge.prototype = InnerBridge.prototype;
  OuterBridge.isCameraSupported = InnerBridge.isCameraSupported;

  root.QiblaAstronomicalObservationBridge = Object.freeze({
    DEFAULTS: module.DEFAULTS,
    cameraConstraints: module.cameraConstraints,
    AstronomicalObservationBridge: OuterBridge
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
