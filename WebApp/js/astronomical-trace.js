// QiblaAstro — Astronomical Measurement Trace
// Diagnostic-only immutable trace. It never calculates or modifies a result.
// © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }
  root.QiblaAstronomicalTrace = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var VERSION = '1.0.0';
  var MAX_EVENTS = 300;
  var events = [];
  var sessionId = null;
  var sequence = 0;

  function finite(v) { return typeof v === 'number' && Number.isFinite(v); }
  function clone(value) {
    if (value === undefined) return null;
    try { return JSON.parse(JSON.stringify(value)); }
    catch (_) { return { unserializable: true, valueType: typeof value }; }
  }
  function freezeDeep(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { freezeDeep(value[key]); });
    return Object.freeze(value);
  }
  function makeSessionId() {
    return 'astro-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }
  function begin(meta) {
    events = [];
    sequence = 0;
    sessionId = makeSessionId();
    add('session.begin', meta || {});
    return sessionId;
  }
  function add(stage, payload) {
    if (!sessionId) begin({ autoStarted: true });
    var event = freezeDeep({
      traceVersion: VERSION,
      sessionId: sessionId,
      sequence: ++sequence,
      stage: String(stage || 'unknown'),
      timestamp: Date.now(),
      payload: clone(payload)
    });
    events.push(event);
    if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
    return event;
  }
  function rejection(code, payload) {
    return add('decision.rejected', {
      code: String(code || 'UNKNOWN_REJECTION'),
      details: clone(payload)
    });
  }
  function accepted(record) {
    var observed = Number(record && record.observedQiblaBearingDeg);
    var reference = Number(record && record.referenceQiblaBearingDeg);
    var offset = Number(record && record.verificationOffsetDeg);
    if (!finite(observed) || !finite(reference) || !finite(offset)) {
      return rejection('INVALID_ACCEPTED_RECORD', record);
    }
    return add('decision.accepted', {
      source: record.source,
      observedQiblaBearingDeg: observed,
      referenceQiblaBearingDeg: reference,
      verificationOffsetDeg: offset,
      reticleResidualDeg: finite(Number(record.reticleResidualDeg)) ? Number(record.reticleResidualDeg) : null,
      body: record.body || null
    });
  }
  function snapshot() {
    return freezeDeep({
      traceVersion: VERSION,
      sessionId: sessionId,
      eventCount: events.length,
      events: events.slice()
    });
  }
  function exportJson(space) {
    return JSON.stringify(snapshot(), null, space === undefined ? 2 : space);
  }
  function clear() {
    events = [];
    sessionId = null;
    sequence = 0;
  }
  function runSelfTests() {
    clear();
    begin({ body: 'sun' });
    add('reticle.target', { targetX: 600, visible: true });
    rejection('NOT_ALIGNED', { residualDeg: 2.4 });
    accepted({
      source: 'astronomical-qibla-alignment-observation',
      observedQiblaBearingDeg: 135.72,
      referenceQiblaBearingDeg: 136.04,
      verificationOffsetDeg: 0.32,
      reticleResidualDeg: 0.18,
      body: 'sun'
    });
    var value = snapshot();
    var pass = value.eventCount === 4 &&
      value.events[3].stage === 'decision.accepted' &&
      value.events[3].payload.observedQiblaBearingDeg === 135.72;
    clear();
    return Object.freeze({ passed: pass ? 1 : 0, failed: pass ? 0 : 1, success: pass });
  }

  return Object.freeze({
    VERSION: VERSION,
    begin: begin,
    add: add,
    rejection: rejection,
    accepted: accepted,
    snapshot: snapshot,
    exportJson: exportJson,
    clear: clear,
    runSelfTests: runSelfTests
  });
});
