/*
 * QiblaAstro — Celestial Solver Runtime
 *
 * Immutable display contract:
 *   astronomical Qibla = record.rawAstronomicalQiblaDeg
 *
 * rawAstronomicalQiblaDeg is copied at capture time from the solver field
 * result.qibla.qiblaBearingDeg. This runtime never rebuilds it from a live
 * heading, sensor bias, QT, GNSS card text, or a later correction.
 *
 * © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
 */
(function (root) {
  'use strict';
  if (!root || !root.document) return;

  function finite(value) { return typeof value === 'number' && Number.isFinite(value); }
  function normalize360(value) { return ((Number(value) % 360) + 360) % 360; }
  function angleDiff(target, reference) {
    return ((Number(target) - Number(reference)) % 360 + 540) % 360 - 180;
  }
  function parseAngle(text) {
    if (typeof text !== 'string') return NaN;
    var match = text.replace(',', '.').match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : NaN;
  }
  function readLiveHeading() {
    var candidates = [root.deviceHeading, root._deviceHeading, root.currentHeading, root.compassHeading];
    for (var i = 0; i < candidates.length; i++) {
      var candidate = Number(candidates[i]);
      if (finite(candidate)) return normalize360(candidate);
    }
    var element = root.document.getElementById('box-heading');
    var parsed = element ? parseAngle(element.textContent || '') : NaN;
    return finite(parsed) ? normalize360(parsed) : NaN;
  }

  var state = {
    recordTimestamp: null,
    rawAstronomicalQiblaDeg: NaN,
    trueCameraHeadingDeg: NaN,
    rawRelativeQiblaAngleDeg: NaN,
    baseCards: null
  };

  function getStore() { return root.QiblaAstronomicalVerificationStore || null; }
  function getRecord() {
    var store = getStore();
    return store && typeof store.getLast === 'function' ? store.getLast() : null;
  }
  function acceptRecord(record) {
    var raw = record ? Number(record.rawAstronomicalQiblaDeg) : NaN;
    var heading = record ? Number(record.trueCameraHeadingDeg) : NaN;
    var relative = record ? Number(record.rawRelativeQiblaAngleDeg) : NaN;
    if (!finite(raw) || !finite(heading)) return false;
    state.recordTimestamp = Number(record.timestamp);
    state.rawAstronomicalQiblaDeg = normalize360(raw);
    state.trueCameraHeadingDeg = normalize360(heading);
    state.rawRelativeQiblaAngleDeg = finite(relative)
      ? relative : angleDiff(state.rawAstronomicalQiblaDeg, state.trueCameraHeadingDeg);
    return true;
  }

  function bodyCard(record) {
    var heading = readLiveHeading();
    var solar = record && record.body === 'sun';
    return {
      key: 'astro-body', state: finite(heading) ? 'verified' : 'idle',
      label: solar ? 'البوصلة الشمسية' : 'البوصلة القمرية',
      value: finite(heading) ? heading.toFixed(1) + '°' : '---',
      hint: finite(heading) ? 'حية' : 'فعّل البوصلة الحية',
      body: solar ? 'sun' : 'moon', bodyLabel: solar ? 'الشمس' : 'القمر', canRetry: true
    };
  }
  function astronomicalQiblaCard() {
    var raw = Number(state.rawAstronomicalQiblaDeg);
    return {
      key: 'astro-qibla', state: finite(raw) ? 'verified' : 'idle',
      label: 'القبلة الفلكية', value: finite(raw) ? normalize360(raw).toFixed(2) + '°' : '---',
      captureAge: finite(raw) ? 'القراءة الخام من الـ Solver وقت الالتقاط' : '',
      hint: finite(raw) ? 'result.qibla.qiblaBearingDeg' : 'بانتظار نتيجة الرصد',
      source: 'solver-raw-qibla-bearing', rawObservationValue: true
    };
  }
  function deviationCard() {
    var liveHeading = readLiveHeading();
    var target = Number(state.rawAstronomicalQiblaDeg);
    if (!finite(liveHeading) || !finite(target)) {
      return { key: 'astro-deviation', state: 'idle', label: 'الانحراف الفلكي', value: '---', hint: 'بانتظار نتيجة الرصد', icon: 'warning' };
    }
    var signed = angleDiff(target, liveHeading);
    var absolute = Math.abs(signed);
    return {
      key: 'astro-deviation', state: 'verified', label: 'الانحراف الفلكي',
      value: absolute.toFixed(1) + '°',
      hint: absolute <= 1 ? 'أنت على اتجاه القبلة الفلكية' : signed > 0 ? 'اتجه يمينًا' : 'اتجه يسارًا',
      icon: absolute <= 1 ? 'ok' : absolute <= 3 ? 'caution' : 'warning'
    };
  }
  function installCardAdapter(record) {
    if (!root.CompassCards || !record) return;
    var current = root.CompassCards;
    var wrapper = {};
    Object.keys(current).forEach(function (key) { wrapper[key] = current[key]; });
    wrapper.getAstroBodyCard = function () { return bodyCard(record); };
    wrapper.getAstroQiblaCard = astronomicalQiblaCard;
    wrapper.getAstroDeviationCard = deviationCard;
    wrapper.getAllCards = function () {
      var cards = typeof current.getAllCards === 'function' ? current.getAllCards() : {};
      cards = cards || {}; cards.loading = false;
      cards.astroBody = bodyCard(record);
      cards.astroQibla = astronomicalQiblaCard();
      cards.astroDeviation = deviationCard();
      return cards;
    };
    state.baseCards = current;
    root.CompassCards = Object.freeze(wrapper);
  }
  function updateSemanticDom(record) {
    if (!record || !finite(state.rawAstronomicalQiblaDeg)) return;
    var body = bodyCard(record), astronomicalQibla = astronomicalQiblaCard(), deviation = deviationCard();
    var bodyLabel = root.document.getElementById('astro-body-label');
    var bodyValue = root.document.getElementById('astro-body-value');
    var bodyHint = root.document.getElementById('astro-body-hint');
    if (bodyLabel) bodyLabel.textContent = body.label;
    if (bodyValue) bodyValue.textContent = body.value;
    if (bodyHint) bodyHint.textContent = body.hint;
    var qiblaValue = root.document.getElementById('astro-qibla-value');
    var qiblaHint = root.document.getElementById('astro-qibla-hint');
    if (qiblaValue) qiblaValue.textContent = astronomicalQibla.value;
    if (qiblaHint) qiblaHint.textContent = astronomicalQibla.hint;
    var deviationValue = root.document.getElementById('astro-deviation-value');
    var deviationHint = root.document.getElementById('astro-deviation-hint');
    if (deviationValue) deviationValue.textContent = deviation.value;
    if (deviationHint) deviationHint.textContent = deviation.hint;
  }
  function tick() {
    var record = getRecord();
    if (record) {
      var timestamp = Number(record.timestamp);
      if (state.recordTimestamp !== timestamp && acceptRecord(record)) installCardAdapter(record);
      updateSemanticDom(record);
    }
    root.requestAnimationFrame(tick);
  }

  root.QiblaCelestialLiveCalibration = Object.freeze({
    getState: function () {
      return {
        recordTimestamp: state.recordTimestamp,
        rawAstronomicalQiblaDeg: state.rawAstronomicalQiblaDeg,
        trueCameraHeadingDeg: state.trueCameraHeadingDeg,
        rawRelativeQiblaAngleDeg: state.rawRelativeQiblaAngleDeg
      };
    },
    readLiveHeading: readLiveHeading,
    getRawAstronomicalQibla: function () {
      return finite(state.rawAstronomicalQiblaDeg) ? normalize360(state.rawAstronomicalQiblaDeg) : NaN;
    }
  });
  root.requestAnimationFrame(tick);
})(typeof globalThis !== 'undefined' ? globalThis : this);
