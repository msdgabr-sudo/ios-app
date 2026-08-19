/*
 * QiblaAstro — Astronomical Verification Gateway
 * Single production entry point for the compass-free Qibla-axis observatory.
 * © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
 */
(function (root) {
  'use strict';

  var FLOW_STATES = Object.freeze({
    IDLE: 'idle', LOADING: 'loading', OBSERVING: 'observing',
    SUCCESS: 'success', FAILED: 'failed'
  });

  var STACK_SCRIPTS = Object.freeze([
    'js/astronomical-trace.js',
    'js/position-provider.js',
    'js/coordinate-frames.js',
    'js/world-orientation.js',
    'js/camera-projection.js',
    'js/camera-pose.js',
    'js/gravity-reference.js',
    'js/astro-qibla-engine.js',
    'js/verification-quality.js',
    'js/celestial-detector.js',
    'js/astronomical-solver.js',
    'js/qibla-alignment-reticle.js',
    'js/astronomical-observation-bridge.js',
    'js/astronomical-observatory-ui.js',
    'js/astronomical-verification-store.js',
    'js/astronomical-verification-session.js'
  ]);

  var STACK_CSS = 'css/28-astronomical-observatory.css';
  var _state = FLOW_STATES.IDLE;
  var _selectedBody = null;
  var _lastResult = null;
  var _session = null;
  var _loadPromise = null;
  var _launcherInstalled = false;
  var _liveCompassTimer = null;

  function finite(value) { return typeof value === 'number' && Number.isFinite(value); }
  function trace() { return root.QiblaAstronomicalTrace || null; }
  function traceAdd(stage, payload) {
    var value = trace();
    if (value && typeof value.add === 'function') {
      try { value.add(stage, payload || {}); } catch (_) {}
    }
  }
  function traceReject(code, payload) {
    var value = trace();
    if (value && typeof value.rejection === 'function') {
      try { value.rejection(code, payload || {}); } catch (_) {}
    }
  }

  function setStatus(text, color) {
    var node = root.document && root.document.getElementById('compass-status-msg');
    if (!node) return;
    node.textContent = text || '';
    if (color) node.style.color = color;
  }

  function refreshCards() {
    try { if (typeof root._qiblaUpdateNewCards === 'function') root._qiblaUpdateNewCards(true); }
    catch (_) {}
  }

  function stopLiveCompassRefresh() {
    if (_liveCompassTimer) {
      root.clearInterval(_liveCompassTimer);
      _liveCompassTimer = null;
    }
  }

  function startLiveCompassRefresh() {
    stopLiveCompassRefresh();
    refreshCards();
    _liveCompassTimer = root.setInterval(function () {
      if (_state !== FLOW_STATES.SUCCESS) {
        stopLiveCompassRefresh();
        return;
      }
      refreshCards();
    }, 120);
  }

  function getFlowState() {
    return {
      state: _state,
      selectedBody: _selectedBody,
      lastResult: _lastResult,
      canRetry: _state !== FLOW_STATES.LOADING && _state !== FLOW_STATES.OBSERVING
    };
  }

  function notifyState() {
    if (typeof root.onAstroFlowStateChange === 'function') {
      try { root.onAstroFlowStateChange(getFlowState()); } catch (_) {}
    }
    refreshCards();
  }

  function position(body, date) {
    var p;
    if (body === 'sun') {
      if (typeof root.sunPos !== 'function') throw new Error('sunPos is unavailable.');
      p = root.sunPos(date);
    } else {
      if (typeof root.moonPos !== 'function') throw new Error('moonPos is unavailable.');
      p = root.moonPos(date);
    }
    var alt = Number(finite(Number(p.alt)) ? p.alt : p.altApp);
    var az = Number(finite(Number(p.az)) ? p.az : p.azApp);
    return { az: az, alt: alt };
  }

  function canStartVerification() {
    var now = new Date();
    var sun = { alt: -90, az: NaN };
    var moon = { alt: -90, az: NaN };
    try { sun = position('sun', now); } catch (_) {}
    try { moon = position('moon', now); } catch (_) {}
    var alternatives = [];
    /* Production rule restored from the proven verification branch:
       daylight observation prefers the Sun whenever it is safely above the
       horizon. The Moon is the fallback when the Sun is unavailable. */
    if (sun.alt > 5) alternatives.push('sun');
    if (moon.alt > 5) alternatives.push('moon');
    return {
      possible: alternatives.length > 0,
      primary: alternatives.length ? alternatives[0] : null,
      alternatives: alternatives,
      sunAltitudeDeg: sun.alt,
      moonAltitudeDeg: moon.alt
    };
  }

  function ensureCss() {
    if (!root.document || root.document.querySelector('link[data-qibla-observatory-css]')) return;
    var link = root.document.createElement('link');
    link.rel = 'stylesheet';
    link.href = STACK_CSS;
    link.setAttribute('data-qibla-observatory-css', 'true');
    root.document.head.appendChild(link);
  }

  function isScriptLoaded(src) {
    if (!root.document) return false;
    var scripts = root.document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var current = scripts[i].getAttribute('src') || '';
      if (current === src || current.endsWith('/' + src)) return true;
    }
    return false;
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (!root.document) return reject(new Error('Document is unavailable.'));
      if (isScriptLoaded(src)) return resolve();
      var script = root.document.createElement('script');
      script.src = src;
      script.async = false;
      script.setAttribute('data-qibla-observatory-module', 'true');
      script.onload = resolve;
      script.onerror = function () { reject(new Error('Failed to load ' + src)); };
      root.document.body.appendChild(script);
    });
  }

  function stackReady() {
    return !!(
      root.QiblaAstronomicalTrace &&
      root.QiblaPositionProvider &&
      root.QiblaAlignmentReticle &&
      root.QiblaAstronomicalObservationBridge &&
      root.QiblaAstronomicalObservatoryUI &&
      root.QiblaAstronomicalVerificationStore &&
      root.QiblaAstronomicalVerificationSession
    );
  }

  function loadProductionStack() {
    if (stackReady()) return Promise.resolve(true);
    if (_loadPromise) return _loadPromise;
    ensureCss();
    _loadPromise = STACK_SCRIPTS.reduce(function (chain, src) {
      return chain.then(function () { return loadScript(src); });
    }, Promise.resolve()).then(function () {
      if (!stackReady()) throw new Error('Astronomical production stack did not initialize.');
      return true;
    }).catch(function (error) {
      _loadPromise = null;
      throw error;
    });
    return _loadPromise;
  }

  function requestRawPosition() {
    if (!root.QiblaPositionProvider) return Promise.reject(new Error('DEVICE_GNSS_UNAVAILABLE'));
    setStatus('⏳ جاري الحصول على إصلاح GNSS للرصد الفلكي...', '#67efff');
    return root.QiblaPositionProvider.request({
      enableHighAccuracy: true, timeout: 18000, maximumAge: 15000, maxAccuracyM: 100
    }).then(function (fix) {
      if (!fix || !finite(Number(fix.latitude)) || !finite(Number(fix.longitude))) {
        throw new Error('INVALID_GNSS_FIX');
      }
      var result = {
        latitude: Number(fix.latitude),
        longitude: Number(fix.longitude),
        altitude: finite(Number(fix.altitude)) ? Number(fix.altitude) : null,
        accuracyM: finite(Number(fix.accuracyM)) ? Number(fix.accuracyM) : null,
        timestamp: Number(fix.timestamp || Date.now()),
        source: fix.source || 'device-gnss'
      };
      traceAdd('location.acquired', result);
      return result;
    });
  }

  function updateAppCards(record) {
    if (!record || !root.document) return;
    root.__qiblaIndependentAstroRecord = record;
    var qibla = root.document.getElementById('astro-qibla-value');
    var qHint = root.document.getElementById('astro-qibla-hint');
    var deviation = root.document.getElementById('astro-deviation-value');
    var dHint = root.document.getElementById('astro-deviation-hint');
    var bodyValue = root.document.getElementById('astro-body-value');
    var bodyHint = root.document.getElementById('astro-body-hint');
    if (qibla) qibla.textContent = Number(record.observedQiblaBearingDeg).toFixed(2) + '°';
    if (qHint) qHint.textContent = 'قياس رصد فلكي خام بواسطة ' +
      (record.body === 'sun' ? 'الشمس' : 'القمر');
    if (deviation) deviation.textContent = Math.abs(Number(record.verificationOffsetDeg)).toFixed(2) + '°';
    if (dHint) dHint.textContent = Number(record.verificationOffsetDeg) >= 0
      ? 'المرجع يمين القياس' : 'المرجع يسار القياس';
    if (bodyValue) bodyValue.style.display = 'block';
    if (bodyHint) bodyHint.textContent = 'حية';
    traceAdd('display.cards-written', {
      observedQiblaBearingDeg: Number(record.observedQiblaBearingDeg),
      verificationOffsetDeg: Number(record.verificationOffsetDeg),
      source: record.source
    });
    refreshCards();
  }

  function errorMessage(error) {
    var text = error && error.message ? error.message : String(error || 'unknown');
    if (/No observable/i.test(text)) return 'لا يوجد قمر أو شمس بارتفاع مناسب الآن';
    if (/OUTSIDE_QIBLA_CAMERA_FOV/i.test(text)) return 'الجرم خارج مجال رؤية محور القبلة الآن';
    if (/محاذاة|QIBLA_AXIS_NOT_ALIGNED/i.test(text)) return 'حرّك الهاتف حتى يدخل الجرم داخل هدف محور القبلة';
    if (/GNSS_PERMISSION_DENIED/i.test(text)) return 'اسمح للموقع من إعدادات المتصفح ثم أعد المحاولة';
    if (/GNSS_TIMEOUT/i.test(text)) return 'تأخر تحديد الموقع — انتقل لمكان مكشوف وأعد المحاولة';
    if (/GNSS|POSITION|location/i.test(text)) return 'تعذّر الحصول على إصلاح GNSS صالح للرصد الفلكي';
    if (/permission|granted/i.test(text)) return 'فعّل إذن الكاميرا والحركة من إعدادات المتصفح';
    if (/Camera API|camera/i.test(text)) return 'الكاميرا غير متاحة على هذا الجهاز أو الرابط غير آمن';
    return 'تعذّر بدء الرصد الفلكي — أعد المحاولة';
  }

  function stopCurrent(reason) {
    if (_session) {
      try { _session.destroy(); } catch (_) {}
      _session = null;
    }
    traceAdd('session.closed', { reason: reason || 'unknown' });
    if (reason !== 'accepted') {
      stopLiveCompassRefresh();
      _state = FLOW_STATES.IDLE;
      _selectedBody = null;
    }
    notifyState();
  }

  async function startProductionVerification(options) {
    options = options || {};
    if (_state === FLOW_STATES.SUCCESS) return true;
    if (_state === FLOW_STATES.LOADING || _state === FLOW_STATES.OBSERVING) return false;
    var pick = canStartVerification();
    if (!pick.possible) {
      _state = FLOW_STATES.FAILED;
      _lastResult = { reason: 'no-body-available', timestamp: Date.now() };
      setStatus('⚠️ لا يوجد قمر أو شمس بارتفاع مناسب فوق الأفق الآن', '#ef8080');
      notifyState();
      return false;
    }

    _state = FLOW_STATES.LOADING;
    var requestedBody = options.body === 'sun' || options.body === 'moon' ? options.body : null;
    if (requestedBody && pick.alternatives.indexOf(requestedBody) === -1) {
      _state = FLOW_STATES.FAILED;
      _selectedBody = null;
      _lastResult = { reason: 'requested-body-not-observable', body: requestedBody, timestamp: Date.now() };
      setStatus('⚠️ الجرم المطلوب غير متاح للرصد الآن', '#ef8080');
      notifyState();
      return false;
    }
    _selectedBody = requestedBody || pick.primary;
    _lastResult = null;
    setStatus('⏳ جاري تهيئة مرصد محور القبلة...', '#67efff');
    notifyState();

    try {
      await loadProductionStack();
      var traceApi = trace();
      if (traceApi && typeof traceApi.begin === 'function') {
        traceApi.begin({
          body: _selectedBody,
          autoCapture: options.autoCapture !== false,
          horizontalFovDeg: finite(Number(options.horizontalFovDeg)) ? Number(options.horizontalFovDeg) : 65,
          alignmentToleranceDeg: finite(Number(options.alignmentToleranceDeg))
            ? Math.abs(Number(options.alignmentToleranceDeg)) : 1
        });
      }
      traceAdd('availability.body-selected', pick);
      var rawFix = await requestRawPosition();
      if (_session) _session.destroy();
      var Session = root.QiblaAstronomicalVerificationSession.VerificationSession;
      _session = new Session({
        body: _selectedBody,
        autoCapture: options.autoCapture !== false,
        horizontalFovDeg: finite(Number(options.horizontalFovDeg)) ? Number(options.horizontalFovDeg) : 65,
        alignmentToleranceDeg: finite(Number(options.alignmentToleranceDeg))
          ? Math.abs(Number(options.alignmentToleranceDeg)) : 1,
        locationProvider: function () {
          return {
            latitude: rawFix.latitude, longitude: rawFix.longitude,
            altitude: rawFix.altitude, accuracyM: rawFix.accuracyM,
            timestamp: rawFix.timestamp, source: rawFix.source
          };
        },
        celestialProvider: function (body, now) {
          var p = position(body, new Date(now));
          var result = { azimuthDeg: p.az, altitudeDeg: p.alt, body: body, timestamp: now };
          traceAdd('celestial.position', result);
          return result;
        },
        onAccepted: function (record) {
          _lastResult = record;
          _state = FLOW_STATES.SUCCESS;
          var value = trace();
          if (value && typeof value.accepted === 'function') {
            try { value.accepted(record); } catch (_) {}
          }
          updateAppCards(record);
          setStatus('✅ تم تسجيل القياس الفلكي الخام لاتجاه القبلة', '#65d69a');
          startLiveCompassRefresh();
          notifyState();
        },
        onClosed: function (reason) {
          traceAdd('observatory.closed', { reason: reason || 'unknown' });
          if (reason !== 'accepted' && _state !== FLOW_STATES.SUCCESS) {
            _state = FLOW_STATES.IDLE;
            _selectedBody = null;
            setStatus('', '');
            notifyState();
          }
        },
        onError: function (error) {
          console.error('Astronomical verification session:', error);
          traceReject(error && error.message ? error.message : 'SESSION_ERROR', {
            stack: error && error.stack ? error.stack : null
          });
          setStatus('⚠️ ' + errorMessage(error), '#ef8080');
        }
      });

      traceAdd('observatory.starting', { body: _selectedBody });
      await _session.start();
      _state = FLOW_STATES.OBSERVING;
      traceAdd('observatory.started', { body: _selectedBody });
      setStatus('', '');
      notifyState();
      return true;
    } catch (error) {
      console.error('Production astronomical verification failed:', error);
      traceReject('PRODUCTION_START_FAILED', {
        message: error && error.message ? error.message : String(error),
        stack: error && error.stack ? error.stack : null
      });
      stopCurrent('failed');
      _state = FLOW_STATES.FAILED;
      _lastResult = { reason: 'production-start-failed', error: String(error), timestamp: Date.now() };
      setStatus('⚠️ ' + errorMessage(error), '#ef8080');
      notifyState();
      return false;
    }
  }

  function applicationLauncher() {
    if (_state === FLOW_STATES.SUCCESS) {
      refreshCards();
      return Promise.resolve(true);
    }
    return startProductionVerification();
  }

  function resetFlow() {
    stopLiveCompassRefresh();
    stopCurrent('reset');
    _state = FLOW_STATES.IDLE;
    _selectedBody = null;
    _lastResult = null;
    notifyState();
  }

  function installApplicationLauncher() {
    if (_launcherInstalled || !root.document) return;
    _launcherInstalled = true;
    root._qiblaStartAstroVerification = applicationLauncher;
    root.startVerification = applicationLauncher;
    root.document.addEventListener('click', function (event) {
      var target = event.target && event.target.closest
        ? event.target.closest('#astro-body-card') : null;
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
      if (_state === FLOW_STATES.SUCCESS) { refreshCards(); return; }
      applicationLauncher();
    }, true);
  }

  root.AstroVerification = Object.freeze({
    FLOW_STATES: FLOW_STATES,
    getFlowState: getFlowState,
    canStartVerification: canStartVerification,
    startFlow: function () {
      applicationLauncher();
      return { ok: true, managedByProductionSession: true };
    },
    confirmInstructionsSeen: function () { return { ok: true, managedByProductionSession: true }; },
    completeCapture: function () { return { ok: true, managedByProductionSession: true }; },
    resetFlow: resetFlow,
    cancelFlow: function () { stopCurrent('cancelled'); },
    startProductionVerification: startProductionVerification,
    loadProductionStack: loadProductionStack,
    getLastVerification: function () {
      return root.QiblaAstronomicalVerificationStore
        ? root.QiblaAstronomicalVerificationStore.getLast() : _lastResult;
    },
    getTrace: function () {
      var value = trace();
      return value && typeof value.snapshot === 'function' ? value.snapshot() : null;
    },
    exportTraceJson: function () {
      var value = trace();
      return value && typeof value.exportJson === 'function' ? value.exportJson(2) : null;
    }
  });

  if (root.document) {
    if (root.document.readyState === 'loading') {
      root.document.addEventListener('DOMContentLoaded', installApplicationLauncher, { once: true });
    } else {
      installApplicationLauncher();
    }
    root.addEventListener('load', function () {
      root._qiblaStartAstroVerification = applicationLauncher;
      root.startVerification = applicationLauncher;
    }, { once: true });
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);