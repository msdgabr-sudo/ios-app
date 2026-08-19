/*
 * QiblaAstro — Raw Position Provider
 * Supplies raw geodetic observations only. It does not calculate Qibla,
 * read compass data, or exchange results between computational and
 * astronomical systems.
 * © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(null);
    return;
  }
  root.QiblaPositionProvider = factory(root);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  var lastFix = null;
  var pendingRequest = null;
  var listeners = [];

  function finite(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }

  function clone(fix) {
    if (!fix) return null;
    return {
      latitude: fix.latitude,
      longitude: fix.longitude,
      altitude: fix.altitude,
      accuracyM: fix.accuracyM,
      altitudeAccuracyM: fix.altitudeAccuracyM,
      headingDeg: fix.headingDeg,
      speedMps: fix.speedMps,
      timestamp: fix.timestamp,
      source: fix.source
    };
  }

  function normalize(input, source) {
    input = input || {};
    var coords = input.coords || input;
    var latitude = Number(coords.latitude !== undefined ? coords.latitude : coords.lat);
    var longitude = Number(coords.longitude !== undefined ? coords.longitude : coords.lon);
    if (!finite(latitude) || !finite(longitude)) return null;
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

    return Object.freeze({
      latitude: latitude,
      longitude: longitude,
      altitude: finite(Number(coords.altitude)) ? Number(coords.altitude) : null,
      accuracyM: finite(Number(coords.accuracy !== undefined ? coords.accuracy : coords.accuracyM))
        ? Math.max(0, Number(coords.accuracy !== undefined ? coords.accuracy : coords.accuracyM))
        : null,
      altitudeAccuracyM: finite(Number(coords.altitudeAccuracy)) ? Math.max(0, Number(coords.altitudeAccuracy)) : null,
      headingDeg: finite(Number(coords.heading)) ? Number(coords.heading) : null,
      speedMps: finite(Number(coords.speed)) ? Number(coords.speed) : null,
      timestamp: finite(Number(input.timestamp)) ? Number(input.timestamp) : Date.now(),
      source: source || input.source || 'device-gnss'
    });
  }

  function publish(input, source) {
    var fix = normalize(input, source);
    if (!fix) return null;
    lastFix = fix;
    listeners.slice().forEach(function (listener) {
      try { listener(clone(fix)); } catch (_) {}
    });
    return clone(fix);
  }

  function getLatest(options) {
    options = options || {};
    if (!lastFix) return null;
    var maxAgeMs = finite(Number(options.maxAgeMs)) ? Number(options.maxAgeMs) : Infinity;
    var maxAccuracyM = finite(Number(options.maxAccuracyM)) ? Number(options.maxAccuracyM) : Infinity;
    var ageMs = Math.max(0, Date.now() - lastFix.timestamp);
    if (ageMs > maxAgeMs) return null;
    if (finite(lastFix.accuracyM) && lastFix.accuracyM > maxAccuracyM) return null;
    return clone(lastFix);
  }

  function request(options) {
    options = options || {};
    var cached = getLatest({
      maxAgeMs: finite(Number(options.maximumAge)) ? Number(options.maximumAge) : 15000,
      maxAccuracyM: finite(Number(options.maxAccuracyM)) ? Number(options.maxAccuracyM) : Infinity
    });
    if (cached) return Promise.resolve(cached);
    if (pendingRequest) return pendingRequest;

    pendingRequest = new Promise(function (resolve, reject) {
      if (!root || !root.navigator || !root.navigator.geolocation) {
        reject(new Error('DEVICE_GNSS_UNAVAILABLE'));
        return;
      }
      root.navigator.geolocation.getCurrentPosition(function (position) {
        var fix = publish(position, 'device-gnss');
        if (!fix) reject(new Error('INVALID_GNSS_FIX'));
        else resolve(fix);
      }, function (error) {
        var code = error && error.code;
        reject(new Error(code === 1 ? 'GNSS_PERMISSION_DENIED' : code === 3 ? 'GNSS_TIMEOUT' : 'GNSS_POSITION_UNAVAILABLE'));
      }, {
        enableHighAccuracy: options.enableHighAccuracy !== false,
        timeout: finite(Number(options.timeout)) ? Number(options.timeout) : 15000,
        maximumAge: finite(Number(options.maximumAge)) ? Number(options.maximumAge) : 15000
      });
    }).finally(function () {
      pendingRequest = null;
    });

    return pendingRequest;
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') return function () {};
    listeners.push(listener);
    return function () {
      var index = listeners.indexOf(listener);
      if (index >= 0) listeners.splice(index, 1);
    };
  }

  function reset() {
    lastFix = null;
    pendingRequest = null;
  }

  return Object.freeze({
    publish: publish,
    getLatest: getLatest,
    request: request,
    subscribe: subscribe,
    reset: reset
  });
});