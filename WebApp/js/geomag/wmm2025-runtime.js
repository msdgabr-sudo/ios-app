(function (root, factory) {
  'use strict';
  const engine = root.QiblaWMM2025 ||
    (typeof module !== 'undefined' && module.exports ? require('./wmm2025.js') : null);
  const api = factory(engine);
  root.QiblaWMM2025Runtime = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function (defaultEngine) {
  'use strict';

  const BLACKOUT_H_NT = 2000;
  const CAUTION_H_NT = 6000;
  const FIELD_KEYS = [
    'declinationDeg', 'inclinationDeg', 'northNt', 'eastNt', 'downNt',
    'horizontalNt', 'totalNt', 'decimalYear'
  ];

  function unavailable(reason, status) {
    return Object.freeze({
      ok: false,
      publish: false,
      status: status || 'unavailable',
      reason: reason
    });
  }

  function finiteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }

  function evaluateTrustedFix(input, engineOverride) {
    const request = input || {};
    if (request.trusted !== true || request.source !== 'gps') {
      return unavailable('trusted-device-gnss-required');
    }

    const lat = request.latitude;
    const lon = request.longitude;
    if (!finiteNumber(lat) || lat < -90 || lat > 90 ||
        !finiteNumber(lon) || lon < -180 || lon > 180) {
      return unavailable('invalid-coordinates', 'invalid');
    }

    const altitudeMeters = request.altitudeMeters == null ? 0 : request.altitudeMeters;
    if (!finiteNumber(altitudeMeters) || altitudeMeters < -1000 || altitudeMeters > 850000) {
      return unavailable('invalid-altitude', 'invalid');
    }

    const date = request.date instanceof Date ? request.date : new Date(request.date);
    if (!Number.isFinite(date.getTime())) {
      return unavailable('invalid-date', 'invalid');
    }

    const engine = engineOverride || defaultEngine;
    if (!engine || typeof engine.field !== 'function') {
      return unavailable('wmm2025-engine-unavailable', 'error');
    }

    let field;
    try {
      field = engine.field(lat, lon, {
        altitudeKm: altitudeMeters / 1000,
        date: date
      });
    } catch (_) {
      return unavailable('wmm2025-evaluation-failed', 'invalid');
    }

    if (!field || FIELD_KEYS.some(function (key) { return !finiteNumber(field[key]); })) {
      return unavailable('non-finite-wmm2025-output', 'invalid');
    }
    if (field.declinationDeg < -180 || field.declinationDeg > 180 ||
        field.horizontalNt < 0 || field.totalNt < 0) {
      return unavailable('out-of-range-wmm2025-output', 'invalid');
    }
    if (field.horizontalNt < BLACKOUT_H_NT) {
      return unavailable('horizontal-field-blackout', 'blackout');
    }

    const status = field.horizontalNt < CAUTION_H_NT ? 'caution' : 'normal';
    return Object.freeze({
      ok: true,
      publish: true,
      status: status,
      reason: null,
      source: 'gps',
      latitude: lat,
      longitude: lon,
      altitudeMeters: altitudeMeters,
      date: new Date(date.getTime()),
      declinationDeg: field.declinationDeg,
      inclinationDeg: field.inclinationDeg,
      northNt: field.northNt,
      eastNt: field.eastNt,
      downNt: field.downNt,
      horizontalNt: field.horizontalNt,
      totalNt: field.totalNt,
      decimalYear: field.decimalYear
    });
  }

  return Object.freeze({
    model: 'WMM2025',
    blackoutHorizontalNt: BLACKOUT_H_NT,
    cautionHorizontalNt: CAUTION_H_NT,
    evaluateTrustedFix: evaluateTrustedFix
  });
});
