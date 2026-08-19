/*
 * QiblaAstro — Astronomical Qibla Observation Store
 * © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(null);
    return;
  }
  root.QiblaAstronomicalVerificationStore = factory(root);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  var MAX_AGE_MS = 20 * 60 * 1000;
  var MAX_DISTANCE_M = 50;
  var STORAGE_KEY = 'qiblaastro:last-astronomical-verification:v1';
  var lastRecord = null;

  function finite(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }

  function normalize360(value) {
    return ((Number(value) % 360) + 360) % 360;
  }

  function signedDifference(target, reference) {
    return ((Number(target) - Number(reference)) % 360 + 540) % 360 - 180;
  }

  function clamp01(value) {
    return Math.max(0, Math.min(1, Number(value)));
  }

  function haversineMeters(lat1, lon1, lat2, lon2) {
    var radius = 6371000;
    var rad = Math.PI / 180;
    var dLat = (lat2 - lat1) * rad;
    var dLon = (lon2 - lon1) * rad;
    var p1 = lat1 * rad;
    var p2 = lat2 * rad;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(p1) * Math.cos(p2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
  }

  function createRecord(input) {
    input = input || {};
    var body = input.body === 'sun' ? 'sun' : input.body === 'moon' ? 'moon' : null;
    var observed = Number(input.observedQiblaBearingDeg);
    var reference = Number(input.referenceQiblaBearingDeg);
    var heading = Number(input.trueCameraHeadingDeg);
    var offset = Number(input.verificationOffsetDeg);
    var residual = Number(input.reticleResidualDeg);
    var acceptedMode = input.alignmentMode === 'astronomical-solved-bearing' || input.alignmentMode === 'qibla-axis';

    if (!body || !acceptedMode || !finite(observed) || !finite(reference) || !finite(heading)) {
      return null;
    }

    observed = normalize360(observed);
    reference = normalize360(reference);
    heading = normalize360(heading);
    if (!finite(offset)) offset = signedDifference(reference, observed);
    if (!finite(residual)) residual = 0;

    return Object.freeze({
      schemaVersion: 4,
      source: 'astronomical-qibla-solved-bearing',
      alignmentMode: 'astronomical-solved-bearing',
      body: body,
      observedQiblaBearingDeg: observed,
      referenceQiblaBearingDeg: reference,
      verificationOffsetDeg: offset,
      reticleResidualDeg: residual,
      trueCameraHeadingDeg: heading,
      targetAzDeg: finite(Number(input.targetAzDeg)) ? normalize360(input.targetAzDeg) : null,
      targetAltDeg: finite(Number(input.targetAltDeg)) ? Number(input.targetAltDeg) : null,
      quality: finite(Number(input.quality)) ? clamp01(input.quality) : 0,
      detectionConfidence: finite(Number(input.detectionConfidence)) ? clamp01(input.detectionConfidence) : null,
      gravityQuality: finite(Number(input.gravityQuality)) ? clamp01(input.gravityQuality) : null,
      latitude: finite(Number(input.latitude)) ? Number(input.latitude) : null,
      longitude: finite(Number(input.longitude)) ? Number(input.longitude) : null,
      timestamp: finite(Number(input.timestamp)) ? Number(input.timestamp) : Date.now(),
      captureMode: input.captureMode === 'manual' ? 'manual' : 'auto',
      rawEquationLocked: true,
      rawFieldPath: 'result.qibla.qiblaBearingDeg'
    });
  }

  function compatibilityVerification(value) {
    if (!value) return null;
    return {
      source: value.source,
      body: value.body,
      type: value.body === 'sun' ? 'solar' : 'celestial',
      trueCameraHeading: value.trueCameraHeadingDeg,
      trueCameraHeadingDeg: value.trueCameraHeadingDeg,
      observedQiblaBearingDeg: value.observedQiblaBearingDeg,
      referenceQiblaBearingDeg: value.referenceQiblaBearingDeg,
      verificationOffsetDeg: value.verificationOffsetDeg,
      astroQibla: value.observedQiblaBearingDeg,
      relativeQiblaAngleDeg: value.verificationOffsetDeg,
      targetAz: value.targetAzDeg,
      targetAlt: value.targetAltDeg,
      diff: Math.abs(value.verificationOffsetDeg),
      solverConfidence: value.quality,
      quality: value.quality,
      timestamp: value.timestamp,
      lat: value.latitude,
      lon: value.longitude,
      captureMode: value.captureMode
    };
  }

  function storageAvailable() {
    try {
      return !!(root && root.localStorage);
    } catch (_) {
      return false;
    }
  }

  function persistAcceptedRecord(value) {
    if (!value || !storageAvailable()) return false;
    try {
      root.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  }

  function restorePersistedRecord() {
    if (!storageAvailable()) return null;
    try {
      var raw = root.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      var restored = createRecord(parsed);
      if (!restored || parsed.rawEquationLocked !== true || parsed.rawFieldPath !== 'result.qibla.qiblaBearingDeg') {
        return null;
      }
      return restored;
    } catch (_) {
      return null;
    }
  }

  function clearPersistedRecord() {
    if (!storageAvailable()) return false;
    try {
      root.localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (_) {
      return false;
    }
  }

  function publishCompatibility() {
    if (!root) return;
    root.__qiblaIndependentAstroRecord = lastRecord;
    try {
      if (typeof root.dispatchEvent === 'function' && typeof root.CustomEvent === 'function') {
        root.dispatchEvent(new root.CustomEvent('qiblaastro:astronomical-record', { detail: lastRecord }));
      }
    } catch (_) {}
  }

  function record(input) {
    var value = createRecord(input);
    if (!value) return null;
    lastRecord = value;
    persistAcceptedRecord(value);
    publishCompatibility();
    return value;
  }

  function attachEquationResult(timestamp) {
    return lastRecord && Number(lastRecord.timestamp) === Number(timestamp) ? lastRecord : null;
  }

  function getLast() {
    return lastRecord;
  }

  function getStatus(context, recordOverride) {
    context = context || {};
    var value = recordOverride || lastRecord;
    if (!value) return { available: false, valid: false, reason: 'none' };

    var now = finite(Number(context.now)) ? Number(context.now) : Date.now();
    var ageMs = Math.max(0, now - value.timestamp);
    if (ageMs > MAX_AGE_MS) {
      return { available: true, valid: false, stale: true, reason: 'time', ageMs: ageMs, record: value };
    }

    var lat = Number(context.latitude);
    var lon = Number(context.longitude);
    if (finite(lat) && finite(lon) && finite(value.latitude) && finite(value.longitude)) {
      var movedMeters = haversineMeters(lat, lon, value.latitude, value.longitude);
      if (movedMeters > MAX_DISTANCE_M) {
        return { available: true, valid: false, stale: true, reason: 'location', movedMeters: movedMeters, record: value };
      }
    }

    return { available: true, valid: true, stale: false, reason: null, ageMs: ageMs, record: value };
  }

  function reset() {
    /* Session/UI reset must not erase the user's last accepted verification.
       Persistent removal is intentionally separate and explicit. */
    lastRecord = null;
    if (root) root.__qiblaIndependentAstroRecord = null;
  }

  lastRecord = restorePersistedRecord();
  if (lastRecord) publishCompatibility();

  return Object.freeze({
    MAX_AGE_MS: MAX_AGE_MS,
    MAX_DISTANCE_M: MAX_DISTANCE_M,
    STORAGE_KEY: STORAGE_KEY,
    createRecord: createRecord,
    compatibilityVerification: compatibilityVerification,
    record: record,
    attachEquationResult: attachEquationResult,
    getLast: getLast,
    getStatus: getStatus,
    reset: reset,
    clearPersistedRecord: clearPersistedRecord
  });
});