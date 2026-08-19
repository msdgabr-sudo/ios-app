/*
 * QiblaAstro — iOS Orientation Adapter
 *
 * iOS-only bridge from the audited native magnetic sensor boundary into the
 * EXISTING WebApp compass input contract. It deliberately does not calculate
 * Qibla, true north, magnetic declination, camera pose, or any astronomical
 * quantity. WMM2025 remains the sole magnetic -> true north authority.
 *
 * Native input:
 *   qibla-ios-orientation
 *     magneticHeading (Core Location magnetic heading)
 *     attitude/gravity (Core Motion, xMagneticNorthZVertical)
 *
 * Existing WebApp input:
 *   onDeviceOrientation({ alpha, absolute:false, ... })
 *
 * Setting absolute:false is intentional: the existing compass path must apply
 * the already-audited WMM2025 declination exactly once.
 */
(function (root) {
  'use strict';

  if (!root || !root.QiblaIOSNative || root.QiblaIOSNative.platform !== 'ios') return;

  var nativeApi = root.QiblaIOSNative;
  var active = false;
  var installed = false;
  var originalOrientationHandler = null;
  var MAX_SAMPLE_AGE_MS = 1500;

  function finite(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }

  function normalize360(value) {
    return ((value % 360) + 360) % 360;
  }

  function sampleIsTrusted(detail) {
    if (!detail || detail.source !== 'ios-native-sensors') return false;
    if (detail.referenceFrame !== 'xMagneticNorthZVertical') return false;
    if (!finite(detail.magneticHeading) || detail.magneticHeading < 0 || detail.magneticHeading >= 360) return false;
    if (!finite(detail.headingAccuracy) || detail.headingAccuracy < 0) return false;
    if (!finite(detail.headingTimestamp) || !finite(detail.motionTimestamp)) return false;
    if (Math.abs(Date.now() - detail.headingTimestamp) > MAX_SAMPLE_AGE_MS) return false;
    if (Math.abs(Date.now() - detail.motionTimestamp) > MAX_SAMPLE_AGE_MS) return false;
    if (!detail.attitude || !detail.attitude.quaternion || !detail.gravity) return false;
    return true;
  }

  function installSourceLock() {
    if (installed) return true;
    if (typeof root.onDeviceOrientation !== 'function') return false;

    originalOrientationHandler = root.onDeviceOrientation;
    root.onDeviceOrientation = function (event) {
      // Once the native iOS source is active, anonymous browser
      // DeviceOrientation listeners are not allowed to become a second compass
      // authority. Only the adapter's marked event may enter the legacy path.
      if (active && !(event && event.__qiblaNativeIOS === true)) return;
      return originalOrientationHandler.call(root, event);
    };
    installed = true;
    return true;
  }

  function publishToExistingCompass(detail) {
    if (!active || !sampleIsTrusted(detail)) return false;
    if (!installSourceLock()) return false;

    // Existing magnetic branch computes raw = (360 - alpha) % 360, therefore
    // alpha below reconstructs the native magnetic heading without changing
    // any legacy compass or WMM2025 equation.
    var syntheticEvent = {
      alpha: normalize360(360 - detail.magneticHeading),
      absolute: false,
      beta: null,
      gamma: null,
      __qiblaNativeIOS: true,
      __qiblaNativeSource: detail.source,
      __qiblaNativeReferenceFrame: detail.referenceFrame
    };

    root.onDeviceOrientation(syntheticEvent);
    return true;
  }

  function start() {
    installSourceLock();
    try {
      active = nativeApi.startOrientation() === true;
    } catch (error) {
      active = false;
    }
    if (active && typeof root.updateCompassStatus === 'function') {
      try { root.updateCompassStatus('auto'); } catch (error) {}
    }
    return active;
  }

  function stop() {
    try { nativeApi.stopOrientation(); } catch (error) {}
    active = false;
  }

  function onNativeOrientation(event) {
    publishToExistingCompass(event && event.detail);
  }

  function onVisibilityChange() {
    if (!root.document) return;
    if (root.document.visibilityState === 'hidden') stop();
    else start();
  }

  root.addEventListener('qibla-ios-orientation', onNativeOrientation, false);
  if (root.document && typeof root.document.addEventListener === 'function') {
    root.document.addEventListener('visibilitychange', onVisibilityChange, false);
  }
  root.addEventListener('pagehide', stop, false);

  // The adapter is loaded after the bundled application's legacy compass
  // declaration. Keep one short retry only for defensive load-order tolerance.
  if (!installSourceLock()) {
    root.setTimeout(function () {
      installSourceLock();
      start();
    }, 0);
  } else {
    start();
  }

  root.QiblaIOSOrientationAdapter = Object.freeze({
    start: start,
    stop: stop,
    publish: publishToExistingCompass,
    isActive: function () { return active; }
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
