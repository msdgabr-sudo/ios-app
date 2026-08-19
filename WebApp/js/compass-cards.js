// ══════════════════════════════════════════════════════════════════════════════
// QiblaAstro — Compass Cards (pure read-only views)
// Astronomical cards consume only the schema-v4 observation contract.
// © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
// ══════════════════════════════════════════════════════════════════════════════
(function (root) {
  'use strict';

  var MESSAGES = Object.freeze({
    PRESS_TO_ACTIVATE: 'اضغط للتفعيل',
    PRESS_TO_VERIFY: 'اضغط للتحقق',
    CALCULATING: 'جاري الحساب...',
    UNAVAILABLE: 'غير متاح',
    NO_BODY_AVAILABLE: 'لا يوجد جرم مناسب الآن',
    FOLLOW_STEPS: 'اتّبع الخطوات...',
    RETRY_FAILED: 'فشل التحقق — أعد المحاولة',
    WAITING_VERIFICATION: 'بانتظار التحقق الفلكي',
    LIVE_COMPASS_LABEL: 'البوصلة الحية',
    GNSS_QIBLA_LABEL: 'القبلة الحسابية',
    ASTRO_QIBLA_LABEL: 'القبلة الفلكية',
    ASTRO_DEVIATION_LABEL: 'انحراف التحقق الفلكي',
    FINAL_DEVIATION_LABEL: 'الانحراف'
  });

  function finite(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }

  function angleDiff(a, b) {
    return ((Number(a) - Number(b)) % 360 + 540) % 360 - 180;
  }

  function errorState(key, reason, state, label) {
    return {
      key: key,
      state: state || 'error',
      reason: reason,
      label: label || MESSAGES.UNAVAILABLE,
      value: null
    };
  }

  function readSharedContext(override) {
    if (override) return override;
    return {
      compassAvailable: typeof compassAvailable !== 'undefined' ? !!compassAvailable : false,
      deviceHeading: typeof deviceHeading !== 'undefined' ? deviceHeading : NaN,
      QT: typeof QT !== 'undefined' ? QT : NaN
    };
  }

  function storeFrom(depsOverride) {
    if (depsOverride && Object.prototype.hasOwnProperty.call(depsOverride, 'AstronomicalVerificationStore')) {
      return depsOverride.AstronomicalVerificationStore;
    }
    return root.QiblaAstronomicalVerificationStore || null;
  }

  function recordFrom(depsOverride) {
    if (depsOverride && Object.prototype.hasOwnProperty.call(depsOverride, 'independentRecord')) {
      return depsOverride.independentRecord;
    }
    var store = storeFrom(depsOverride);
    if (store && typeof store.getLast === 'function') {
      var stored = store.getLast();
      if (stored) return stored;
    }
    return root.__qiblaIndependentAstroRecord || null;
  }

  function flowFrom(depsOverride) {
    var verification = depsOverride && Object.prototype.hasOwnProperty.call(depsOverride, 'AstroVerification')
      ? depsOverride.AstroVerification : root.AstroVerification;
    if (!verification || typeof verification.getFlowState !== 'function') return null;
    return { api: verification, state: verification.getFlowState() };
  }

  function formatCaptureAge(timestamp) {
    if (!finite(Number(timestamp))) return '';
    var elapsedMinutes = (Date.now() - Number(timestamp)) / 60000;
    if (elapsedMinutes < 1) return 'الآن';
    if (elapsedMinutes < 60) return 'منذ ' + Math.round(elapsedMinutes) + ' د';
    if (elapsedMinutes < 1440) return 'منذ ' + Math.round(elapsedMinutes / 60) + ' س';
    return 'قراءة قديمة';
  }

  function isCanonicalAstronomicalRecord(record) {
    return !!record &&
      record.schemaVersion === 4 &&
      record.source === 'astronomical-qibla-solved-bearing' &&
      record.alignmentMode === 'astronomical-solved-bearing' &&
      finite(Number(record.observedQiblaBearingDeg)) &&
      finite(Number(record.referenceQiblaBearingDeg)) &&
      finite(Number(record.verificationOffsetDeg));
  }

  function getLiveCompassCard(ctxOverride) {
    var ctx = readSharedContext(ctxOverride);
    if (!ctx.compassAvailable || !finite(Number(ctx.deviceHeading))) {
      return { key: 'live-compass', state: 'idle', label: MESSAGES.PRESS_TO_ACTIVATE, value: null };
    }
    return {
      key: 'live-compass', state: 'active', label: MESSAGES.LIVE_COMPASS_LABEL,
      value: Number(ctx.deviceHeading).toFixed(1) + '°'
    };
  }

  function getGnssQiblaCard(ctxOverride) {
    var ctx = readSharedContext(ctxOverride);
    if (!finite(Number(ctx.QT))) {
      return { key: 'gnss-qibla', state: 'idle', label: MESSAGES.CALCULATING, value: null };
    }
    return {
      key: 'gnss-qibla', state: 'active', label: MESSAGES.GNSS_QIBLA_LABEL,
      value: Number(ctx.QT).toFixed(2) + '°'
    };
  }

  function bodyLabels(body) {
    return body === 'sun'
      ? { bodyLabel: 'الشمس', cardLabel: 'البوصلة الشمسية' }
      : { bodyLabel: 'القمر', cardLabel: 'البوصلة القمرية' };
  }

  function getAstroBodyCard(depsOverride) {
    var record = recordFrom(depsOverride);
    if (isCanonicalAstronomicalRecord(record)) {
      var labels = bodyLabels(record.body);
      var heading = Number(record.trueCameraHeadingDeg);
      return {
        key: 'astro-body', state: 'success', label: labels.cardLabel,
        value: finite(heading) ? heading.toFixed(1) + '°' : null,
        body: record.body, bodyLabel: labels.bodyLabel,
        cardLabel: labels.cardLabel, canRetry: true
      };
    }

    var flow = flowFrom(depsOverride);
    if (!flow) return errorState('astro-body', 'astro-verification-missing', 'unavailable');
    var api = flow.api;
    var state = flow.state || {};
    var pick = typeof api.canStartVerification === 'function'
      ? api.canStartVerification() : { possible: false, primary: null };
    var body = state.selectedBody || pick.primary;
    if (!body) {
      return { key: 'astro-body', state: 'unavailable', label: MESSAGES.NO_BODY_AVAILABLE, value: null, body: null };
    }
    var labels = bodyLabels(body);
    var value = String(state.state || '').toLowerCase();
    if (value === 'loading') {
      return { key: 'astro-body', state: 'loading', label: 'جاري تهيئة المرصد...', value: null, body: body, bodyLabel: labels.bodyLabel, cardLabel: labels.cardLabel };
    }
    if (value === 'observing' || value === 'awaiting_capture') {
      return { key: 'astro-body', state: 'capturing', label: 'وجّه الهاتف نحو ' + labels.bodyLabel, value: null, body: body, bodyLabel: labels.bodyLabel, cardLabel: labels.cardLabel };
    }
    if (value === 'instructions') {
      return { key: 'astro-body', state: 'instructions', label: MESSAGES.FOLLOW_STEPS, value: null, body: body, bodyLabel: labels.bodyLabel, cardLabel: labels.cardLabel };
    }
    if (value === 'failed') {
      return { key: 'astro-body', state: 'failed', label: MESSAGES.RETRY_FAILED, value: null, body: body, bodyLabel: labels.bodyLabel, cardLabel: labels.cardLabel, canRetry: true };
    }
    return { key: 'astro-body', state: 'idle', label: MESSAGES.PRESS_TO_VERIFY, value: null, body: body, bodyLabel: labels.bodyLabel, cardLabel: labels.cardLabel };
  }

  function getAstroQiblaCard(depsOverride) {
    var record = recordFrom(depsOverride);
    if (!record) {
      return { key: 'astro-qibla', state: 'idle', label: MESSAGES.WAITING_VERIFICATION, value: null };
    }
    if (!isCanonicalAstronomicalRecord(record)) {
      return errorState('astro-qibla', 'canonical-observation-record-required', 'error', MESSAGES.ASTRO_QIBLA_LABEL);
    }
    var observed = Number(record.observedQiblaBearingDeg);
    return {
      key: 'astro-qibla', state: 'active', label: MESSAGES.ASTRO_QIBLA_LABEL,
      value: observed.toFixed(2) + '°', captureAge: formatCaptureAge(record.timestamp),
      source: 'result.qibla.qiblaBearingDeg'
    };
  }

  function getAstroDeviationCard(depsOverride) {
    var record = recordFrom(depsOverride);
    if (!record) {
      return { key: 'astro-deviation', state: 'idle', label: MESSAGES.ASTRO_DEVIATION_LABEL, value: '---', icon: 'warning' };
    }
    if (!isCanonicalAstronomicalRecord(record)) {
      return errorState('astro-deviation', 'canonical-verification-offset-required', 'error', MESSAGES.ASTRO_DEVIATION_LABEL);
    }
    var offset = Number(record.verificationOffsetDeg);
    var absolute = Math.abs(offset);
    return {
      key: 'astro-deviation', state: 'active', label: MESSAGES.ASTRO_DEVIATION_LABEL,
      value: absolute.toFixed(2) + '°',
      hint: offset >= 0 ? 'المرجع يمين القياس' : 'المرجع يسار القياس',
      icon: absolute <= 1 ? 'ok' : absolute <= 3 ? 'caution' : 'warning'
    };
  }

  function getFinalDeviationCard(ctxOverride) {
    var ctx = readSharedContext(ctxOverride);
    if (!ctx.compassAvailable || !finite(Number(ctx.deviceHeading)) || !finite(Number(ctx.QT))) {
      return { key: 'final-deviation', state: 'idle', label: MESSAGES.FINAL_DEVIATION_LABEL, value: '---' };
    }
    return {
      key: 'final-deviation', state: 'active', label: MESSAGES.FINAL_DEVIATION_LABEL,
      value: Math.abs(angleDiff(Number(ctx.QT), Number(ctx.deviceHeading))).toFixed(1) + '°'
    };
  }

  function getAllCards() {
    return {
      loading: false,
      liveCompass: getLiveCompassCard(),
      gnssQibla: getGnssQiblaCard(),
      astroBody: getAstroBodyCard(),
      astroQibla: getAstroQiblaCard(),
      astroDeviation: getAstroDeviationCard(),
      finalDeviation: getFinalDeviationCard()
    };
  }

  function runSelfTests() {
    var record = {
      schemaVersion: 4,
      source: 'astronomical-qibla-solved-bearing',
      alignmentMode: 'astronomical-solved-bearing',
      body: 'sun',
      trueCameraHeadingDeg: 135.72,
      observedQiblaBearingDeg: 135.72,
      referenceQiblaBearingDeg: 136.04,
      verificationOffsetDeg: 0.32,
      timestamp: Date.now()
    };
    var qibla = getAstroQiblaCard({ independentRecord: record });
    var deviation = getAstroDeviationCard({ independentRecord: record });
    var body = getAstroBodyCard({ independentRecord: record });
    var legacy = getAstroQiblaCard({ independentRecord: {
      rawAstronomicalQiblaDeg: 136.04,
      qiblaBearingDeg: 136.04
    }});
    var success = qibla.value === '135.72°' &&
      deviation.value === '0.32°' &&
      body.value === '135.7°' &&
      legacy.state === 'error';
    return { pass: success ? 4 : 0, fail: success ? 0 : 4, success: success };
  }

  root.CompassCards = Object.freeze({
    MESSAGES: MESSAGES,
    isCanonicalAstronomicalRecord: isCanonicalAstronomicalRecord,
    getLiveCompassCard: getLiveCompassCard,
    getGnssQiblaCard: getGnssQiblaCard,
    getAstroBodyCard: getAstroBodyCard,
    getAstroQiblaCard: getAstroQiblaCard,
    getAstroDeviationCard: getAstroDeviationCard,
    getFinalDeviationCard: getFinalDeviationCard,
    getAllCards: getAllCards,
    runSelfTests: runSelfTests
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
