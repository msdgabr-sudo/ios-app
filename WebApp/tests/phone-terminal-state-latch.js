// QiblaAstro phone-test capture controller v2.
// Visible shutter, automatic/manual burst capture, live magnifier and stable result freeze.
// © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
(function (root) {
  'use strict';

  var module = root.QiblaAstronomicalObservationBridge;
  if (!module || !module.AstronomicalObservationBridge || !root.document) return;

  var OriginalBridge = module.AstronomicalObservationBridge;
  var MIN_LIVE_FRAMES = 3;
  var MIN_LIVE_CONFIDENCE = 0.50;
  var MIN_GRAVITY = 0.48;
  var AUTO_STABLE_MS = 1200;
  var BURST_MS = 1100;
  var MAX_AUTO_DRIFT_DEG = 0.85;

  function clamp01(v) { return Math.max(0, Math.min(1, Number(v) || 0)); }
  function angleDiff(a, b) {
    var d = Math.abs(Number(a) - Number(b));
    return d > 180 ? 360 - d : d;
  }
  function setValue(id, text, state) {
    var node = root.document.getElementById(id);
    if (!node) return;
    node.textContent = text;
    node.className = 'v' + (state ? ' ' + state : '');
  }
  function deg(v) { return Number.isFinite(v) ? v.toFixed(2) + '°' : '—'; }

  function injectUi() {
    var style = root.document.createElement('style');
    style.textContent =
      '.camera{max-height:58vh;min-height:360px;aspect-ratio:4/3!important}' +
      '.reticle{width:86px!important;height:86px!important}' +
      '.reticle:before{width:108px!important;left:-11px!important;top:42px!important}' +
      '.reticle:after{height:108px!important;top:-11px!important;left:42px!important}' +
      '#captureShutter{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);z-index:12;width:76px;height:76px;border-radius:50%;border:5px solid rgba(255,255,255,.92);background:#65d69a;box-shadow:0 5px 24px rgba(0,0,0,.55);padding:0}' +
      '#captureShutter:after{content:"";display:block;width:52px;height:52px;border-radius:50%;border:2px solid rgba(0,0,0,.18);margin:auto}' +
      '#captureShutter.capturing{animation:qCapturePulse .55s infinite alternate;background:#d7b55b}' +
      '#captureHint{position:absolute;left:50%;bottom:102px;transform:translateX(-50%);z-index:12;background:rgba(3,9,14,.78);padding:6px 12px;border-radius:16px;font-size:.74rem;white-space:nowrap}' +
      '#celestialMagnifier{position:absolute;top:12px;right:12px;width:132px;height:132px;border:2px solid #65d69a;border-radius:18px;background:#02070b;box-shadow:0 6px 24px rgba(0,0,0,.45);z-index:10;display:none;pointer-events:none}' +
      '@keyframes qCapturePulse{from{transform:translateX(-50%) scale(.94)}to{transform:translateX(-50%) scale(1.05)}}' +
      '@media(max-width:700px){.camera{height:54vh;min-height:390px;max-height:620px}}';
    root.document.head.appendChild(style);

    var controls = root.document.querySelector('.controls');
    if (controls && !root.document.getElementById('measurement-lock-panel')) {
      var panel = root.document.createElement('div');
      panel.id = 'measurement-lock-panel';
      panel.className = 'control';
      panel.innerHTML = '<label for="captureMode">طريقة الالتقاط</label>' +
        '<select id="captureMode"><option value="auto">تلقائي — عند الثبات</option><option value="manual">يدوي — بزر التصوير</option></select>';
      controls.insertBefore(panel, controls.querySelector('#start'));
    }

    var cards = root.document.querySelector('.cards');
    if (cards && !root.document.getElementById('stability')) {
      var card = root.document.createElement('div');
      card.className = 'card';
      card.innerHTML = '<div class="k">ثبات الهاتف</div><div class="v" id="stability">0% · في انتظار الرصد</div>' +
        '<div style="height:6px;background:#07111a;border-radius:9px;margin-top:8px;overflow:hidden"><div id="stabilityBar" style="height:100%;width:0%;background:#65d69a;transition:width .15s linear"></div></div>';
      cards.appendChild(card);
    }

    var camera = root.document.querySelector('.camera');
    if (camera) {
      if (!root.document.getElementById('celestialMagnifier')) {
        var mag = root.document.createElement('canvas');
        mag.id = 'celestialMagnifier';
        mag.width = 220;
        mag.height = 220;
        camera.appendChild(mag);
      }
      if (!root.document.getElementById('captureHint')) {
        var hint = root.document.createElement('div');
        hint.id = 'captureHint';
        hint.textContent = 'وجّه القمر داخل الدائرة';
        camera.appendChild(hint);
      }
      if (!root.document.getElementById('captureShutter')) {
        var shutter = root.document.createElement('button');
        shutter.id = 'captureShutter';
        shutter.type = 'button';
        shutter.setAttribute('aria-label', 'التقاط القراءة');
        camera.appendChild(shutter);
      }
    }
  }

  injectUi();

  function mode() {
    var node = root.document.getElementById('captureMode');
    return node ? node.value : 'auto';
  }
  function updateStability(score, text, good) {
    var pct = Math.round(clamp01(score) * 100);
    setValue('stability', pct + '% · ' + text, good ? 'ok' : (pct >= 45 ? '' : 'bad'));
    var bar = root.document.getElementById('stabilityBar');
    if (bar) bar.style.width = pct + '%';
  }
  function setHint(text, good) {
    var hint = root.document.getElementById('captureHint');
    if (!hint) return;
    hint.textContent = text;
    hint.style.color = good ? '#65d69a' : '#fff';
  }

  function WrappedBridge(options) {
    var opts = Object.assign({}, options || {});
    var originalProgress = typeof opts.onProgress === 'function' ? opts.onProgress : function () {};
    var originalResult = typeof opts.onResult === 'function' ? opts.onResult : function () {};
    var originalError = typeof opts.onError === 'function' ? opts.onError : function () {};

    var instance = null;
    var terminal = false;
    var latestResult = null;
    var bestResult = null;
    var liveFrames = 0;
    var liveConfidence = 0;
    var liveGravity = 0;
    var lastObservation = null;
    var lastHeading = null;
    var stableSince = 0;
    var burstUntil = 0;
    var burstSource = null;
    var raf = 0;

    function scoreResult(result) {
      if (!result) return -1;
      var q = clamp01(result.quality && result.quality.overallScore);
      var g = clamp01(result.gravity && result.gravity.quality);
      var d = clamp01(result.detection && result.detection.confidence || liveConfidence);
      return q * 0.50 + g * 0.25 + d * 0.25;
    }
    function basicReady() {
      return liveFrames >= MIN_LIVE_FRAMES && liveConfidence >= MIN_LIVE_CONFIDENCE && liveGravity >= MIN_GRAVITY;
    }
    function beginBurst(source) {
      if (terminal || burstUntil) return;
      burstSource = source;
      burstUntil = Date.now() + BURST_MS;
      bestResult = latestResult;
      var button = root.document.getElementById('captureShutter');
      if (button) button.classList.add('capturing');
      setHint(source === 'manual' ? 'جارٍ التقاط أفضل قراءة…' : 'ثبات جيد — التقاط تلقائي…', true);
      setValue('status', 'جارٍ التقاط دفعة قياسات', 'ok');
    }
    function finishBurst() {
      if (!burstUntil) return;
      burstUntil = 0;
      var button = root.document.getElementById('captureShutter');
      if (button) button.classList.remove('capturing');
      var chosen = bestResult || latestResult;
      if (!chosen) {
        setHint('لم تتوفر قراءة؛ أعد المحاولة', false);
        return;
      }
      terminal = true;
      originalResult(Object.assign({}, chosen, {
        accepted: true,
        lockSource: burstSource || 'manual',
        capturedAt: Date.now()
      }));
      setValue('status', burstSource === 'auto' ? 'تم التقاط القراءة تلقائيًا' : 'تم التقاط القراءة يدويًا', 'ok');
      updateStability(1, 'تم تثبيت النتيجة', true);
      setHint('تم تثبيت النتيجة', true);
    }

    function liveMagnifierLoop() {
      var canvas = root.document.getElementById('celestialMagnifier');
      var video = root.document.getElementById('video');
      if (canvas && video && lastObservation && lastObservation.found && video.readyState >= 2 && instance && instance.canvas) {
        var sourceW = instance.canvas.width || 1;
        var sourceH = instance.canvas.height || 1;
        var vx = lastObservation.x / sourceW * video.videoWidth;
        var vy = lastObservation.y / sourceH * video.videoHeight;
        var crop = Math.max(90, Math.min(video.videoWidth, video.videoHeight) * 0.18);
        var sx = Math.max(0, Math.min(video.videoWidth - crop, vx - crop / 2));
        var sy = Math.max(0, Math.min(video.videoHeight - crop, vy - crop / 2));
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(video, sx, sy, crop, crop, 0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#65d69a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 42, 0, Math.PI * 2);
        ctx.moveTo(55, canvas.height / 2); ctx.lineTo(canvas.width - 55, canvas.height / 2);
        ctx.moveTo(canvas.width / 2, 55); ctx.lineTo(canvas.width / 2, canvas.height - 55);
        ctx.stroke();
        canvas.style.display = 'block';
      } else if (canvas) {
        canvas.style.display = 'none';
      }
      raf = root.requestAnimationFrame(liveMagnifierLoop);
    }
    raf = root.requestAnimationFrame(liveMagnifierLoop);

    opts.onProgress = function (progress) {
      if (terminal) return;
      var tracked = progress && progress.trackedDetection || {};
      lastObservation = progress && progress.frameObservation || lastObservation;
      liveFrames = Number(tracked.frameCount || tracked.stableFrames || 0);
      liveConfidence = clamp01(tracked.confidence);
      if (progress && progress.gravity && Number.isFinite(progress.gravity.quality)) liveGravity = clamp01(progress.gravity.quality);

      originalProgress(progress);

      if (!liveFrames) {
        stableSince = 0;
        updateStability(0, 'ابحث عن الجرم', false);
        setHint('وجّه القمر داخل الدائرة', false);
      } else {
        var visual = clamp01((liveFrames / 8) * 0.45 + liveConfidence * 0.35 + liveGravity * 0.20);
        updateStability(visual, basicReady() ? 'الجرم ظاهر — ثبّت الهاتف' : 'جارٍ تثبيت الجرم', basicReady());
        setHint(mode() === 'manual' ? 'اضغط زر التصوير عند ثبات الهاتف' : 'سيتم الالتقاط تلقائيًا عند الثبات', basicReady());
      }
    };

    opts.onResult = function (result) {
      if (terminal || !result) return;
      latestResult = result;
      liveGravity = clamp01(result.gravity && result.gravity.quality || liveGravity);
      if (!bestResult || scoreResult(result) > scoreResult(bestResult)) bestResult = result;

      var heading = Number(result.trueCameraHeadingDeg);
      var drift = lastHeading === null || !Number.isFinite(heading) ? 0 : angleDiff(heading, lastHeading);
      lastHeading = heading;
      var stable = basicReady() && drift <= MAX_AUTO_DRIFT_DEG;

      if (stable) {
        if (!stableSince) stableSince = Date.now();
      } else {
        // Hysteresis: do not erase all progress for one weak sample.
        if (stableSince && drift > MAX_AUTO_DRIFT_DEG * 2.2) stableSince = 0;
      }

      var elapsed = stableSince ? Date.now() - stableSince : 0;
      var stability = clamp01((elapsed / AUTO_STABLE_MS) * 0.45 + liveConfidence * 0.25 + liveGravity * 0.20 + clamp01(result.quality && result.quality.overallScore) * 0.10);
      updateStability(stability, stableSince ? 'ثابت منذ ' + (elapsed / 1000).toFixed(1) + ' ثانية' : 'ثبّت الهاتف', stability >= 0.75);

      if (burstUntil) {
        if (Date.now() >= burstUntil) finishBurst();
        return;
      }
      if (mode() === 'auto' && elapsed >= AUTO_STABLE_MS && basicReady()) beginBurst('auto');
    };

    opts.onError = function (error) {
      if (terminal) return;
      originalError(error);
    };

    instance = new OriginalBridge(opts);

    var shutter = root.document.getElementById('captureShutter');
    if (shutter) {
      shutter.onclick = function () {
        if (terminal) return;
        if (!latestResult && !basicReady()) {
          setHint('ضع القمر داخل الدائرة أولًا', false);
          return;
        }
        beginBurst('manual');
      };
    }

    var select = root.document.getElementById('captureMode');
    if (select) {
      select.onchange = function () {
        stableSince = 0;
        setHint(select.value === 'manual' ? 'اضغط زر التصوير عند ثبات الهاتف' : 'سيتم الالتقاط تلقائيًا عند الثبات', false);
      };
    }

    instance.isTerminalStateLatched = function () { return terminal; };
    instance.getLatestMeasurement = function () { return latestResult; };
    instance.resetTerminalState = function () {
      terminal = false;
      latestResult = null;
      bestResult = null;
      liveFrames = 0;
      liveConfidence = 0;
      liveGravity = 0;
      lastHeading = null;
      stableSince = 0;
      burstUntil = 0;
      burstSource = null;
      updateStability(0, 'في انتظار الرصد', false);
      setHint('وجّه القمر داخل الدائرة', false);
      if (instance.tracker && typeof instance.tracker.reset === 'function') instance.tracker.reset();
      instance.lastSolveAt = 0;
    };
    instance.stop = (function (originalStop) {
      return function () {
        if (raf) root.cancelAnimationFrame(raf);
        return originalStop.apply(instance, arguments);
      };
    })(instance.stop);

    return instance;
  }

  WrappedBridge.prototype = OriginalBridge.prototype;
  WrappedBridge.isCameraSupported = OriginalBridge.isCameraSupported;

  root.QiblaAstronomicalObservationBridge = Object.freeze({
    DEFAULTS: module.DEFAULTS,
    cameraConstraints: module.cameraConstraints,
    AstronomicalObservationBridge: WrappedBridge
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
