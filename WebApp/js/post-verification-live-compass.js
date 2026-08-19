/*
 * QiblaAstro — Post-verification live celestial compass
 *
 * UI-only relative-motion layer. It reads a completed astronomical record and
 * deviceorientation alpha, then animates only the Sun/Moon compass card.
 * It never calls the astronomical solver, never writes to the verification
 * store, and never changes the raw Qibla result or its deviation.
 *
 * © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
 */
(function (root) {
  'use strict';

  var state = {
    enabled: true,
    locked: false,
    recordTimestamp: 0,
    anchorAlphaDeg: NaN,
    anchorHeadingDeg: NaN,
    liveHeadingDeg: NaN,
    lockedHeadingDeg: NaN
  };

  function finite(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }

  function normalize360(value) {
    return ((Number(value) % 360) + 360) % 360;
  }

  function signedDelta(current, anchor) {
    return ((Number(current) - Number(anchor) + 540) % 360) - 180;
  }

  function getRecord() {
    var store = root.QiblaAstronomicalVerificationStore;
    if (store && typeof store.getLast === 'function') {
      var stored = store.getLast();
      if (stored) return stored;
    }
    return root.__qiblaIndependentAstroRecord || null;
  }

  function isUsableRecord(record) {
    return !!record && record.schemaVersion === 4 &&
      record.source === 'astronomical-qibla-solved-bearing' &&
      finite(Number(record.trueCameraHeadingDeg)) &&
      finite(Number(record.timestamp));
  }

  function resetAnchorFor(record) {
    state.recordTimestamp = Number(record.timestamp);
    state.anchorAlphaDeg = NaN;
    state.anchorHeadingDeg = normalize360(Number(record.trueCameraHeadingDeg));
    state.liveHeadingDeg = state.anchorHeadingDeg;
    state.lockedHeadingDeg = NaN;
    state.locked = false;
  }

  function ensureRecord() {
    var record = getRecord();
    if (!isUsableRecord(record)) return null;
    if (Number(record.timestamp) !== state.recordTimestamp) resetAnchorFor(record);
    return record;
  }

  function readAlpha(event) {
    var alpha = Number(event && event.alpha);
    return finite(alpha) ? normalize360(alpha) : NaN;
  }

  function onOrientation(event) {
    if (!state.enabled || state.locked) return;
    var record = ensureRecord();
    if (!record) return;
    var alpha = readAlpha(event);
    if (!finite(alpha)) return;

    if (!finite(state.anchorAlphaDeg)) {
      state.anchorAlphaDeg = alpha;
      state.liveHeadingDeg = state.anchorHeadingDeg;
    } else {
      state.liveHeadingDeg = normalize360(
        state.anchorHeadingDeg + signedDelta(alpha, state.anchorAlphaDeg)
      );
    }

    if (typeof root.dispatchEvent === 'function' && typeof root.CustomEvent === 'function') {
      root.dispatchEvent(new root.CustomEvent('qiblaastro:live-celestial-heading', {
        detail: getState()
      }));
    }
  }

  function setTracking(enabled) {
    state.enabled = enabled !== false;
    if (state.enabled && state.locked) {
      state.locked = false;
      state.lockedHeadingDeg = NaN;
    }
    return getState();
  }

  function lock() {
    if (!finite(state.liveHeadingDeg)) ensureRecord();
    state.locked = true;
    state.lockedHeadingDeg = finite(state.liveHeadingDeg)
      ? state.liveHeadingDeg : state.anchorHeadingDeg;
    return getState();
  }

  function unlock() {
    state.locked = false;
    state.lockedHeadingDeg = NaN;
    state.anchorAlphaDeg = NaN;
    return getState();
  }

  function toggleLock() {
    return state.locked ? unlock() : lock();
  }

  function getDisplayHeading() {
    var record = ensureRecord();
    if (!record) return NaN;
    if (state.locked && finite(state.lockedHeadingDeg)) return state.lockedHeadingDeg;
    if (state.enabled && finite(state.liveHeadingDeg)) return state.liveHeadingDeg;
    return normalize360(Number(record.trueCameraHeadingDeg));
  }

  function getState() {
    return Object.freeze({
      enabled: state.enabled,
      locked: state.locked,
      recordTimestamp: state.recordTimestamp,
      headingDeg: getDisplayHeading(),
      source: 'post-verification-relative-orientation'
    });
  }

  function bindLegacyControls() {
    if (!root.document || !root.document.querySelectorAll) return;
    var nodes = root.document.querySelectorAll('button,[role="button"],.action-btn,.control-btn');
    Array.prototype.forEach.call(nodes, function (node) {
      var text = String(node.textContent || '').replace(/\s+/g, ' ').trim();
      var isTracking = text.indexOf('تتبّع') >= 0 || text.indexOf('تتبع') >= 0;
      var isLock = text.indexOf('قفل') >= 0;
      if (isTracking && !node.__qiblaLiveBound) {
        node.__qiblaLiveBound = true;
        node.addEventListener('click', function () {
          setTracking(true);
          unlock();
        });
      }
      if (isLock && !node.__qiblaLockBound) {
        node.__qiblaLockBound = true;
        node.addEventListener('click', toggleLock);
      }
    });
  }

  root.QiblaPostVerificationLiveCompass = Object.freeze({
    getDisplayHeading: getDisplayHeading,
    getState: getState,
    setTracking: setTracking,
    lock: lock,
    unlock: unlock,
    toggleLock: toggleLock,
    resetFromRecord: function () {
      state.recordTimestamp = 0;
      ensureRecord();
      return getState();
    }
  });

  root._qiblaEnableTracking = function () { return setTracking(true); };
  root._qiblaToggleLiveLock = toggleLock;

  if (typeof root.addEventListener === 'function') {
    root.addEventListener('deviceorientation', onOrientation, true);
    root.addEventListener('deviceorientationabsolute', onOrientation, true);
    root.addEventListener('qiblaastro:astronomical-record', function () {
      state.recordTimestamp = 0;
      ensureRecord();
      bindLegacyControls();
    });
  }

  if (root.document) {
    if (root.document.readyState === 'loading') {
      root.document.addEventListener('DOMContentLoaded', bindLegacyControls, { once: true });
    } else {
      bindLegacyControls();
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
