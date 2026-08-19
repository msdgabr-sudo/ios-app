'use strict';
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync('js/post-verification-live-compass.js', 'utf8');

assert(!source.includes('AstronomicalSolver'), 'Live module must not call the astronomical solver.');
assert(!source.includes('AstroQiblaEngine'), 'Live module must not call the Qibla engine.');
assert(!source.includes('.record('), 'Live module must never write to the verification store.');
assert(!source.includes('observedQiblaBearingDeg ='), 'Live module must never mutate raw Qibla bearing.');
assert(!source.includes('verificationOffsetDeg ='), 'Live module must never mutate raw deviation.');

const listeners = {};
let storeRecordCalls = 0;
const rawRecord = Object.freeze({
  schemaVersion: 4,
  source: 'astronomical-qibla-solved-bearing',
  alignmentMode: 'astronomical-solved-bearing',
  body: 'moon',
  trueCameraHeadingDeg: 102.29,
  observedQiblaBearingDeg: 136.04,
  referenceQiblaBearingDeg: 136.04,
  verificationOffsetDeg: 0,
  timestamp: 1785895000000
});

const context = {
  console,
  Math,
  Number,
  Object,
  Array,
  CustomEvent: function (type, init) { this.type = type; this.detail = init && init.detail; },
  addEventListener: (type, fn) => { (listeners[type] ||= []).push(fn); },
  dispatchEvent: event => { (listeners[event.type] || []).forEach(fn => fn(event)); return true; },
  document: {
    readyState: 'complete',
    querySelectorAll: () => [],
    addEventListener: () => {}
  },
  QiblaAstronomicalVerificationStore: {
    getLast: () => rawRecord,
    record: () => { storeRecordCalls++; throw new Error('record must not be called'); }
  }
};
context.globalThis = context;
context.window = context;
vm.createContext(context);
vm.runInContext(source, context, { filename: 'post-verification-live-compass.js' });

const api = context.QiblaPostVerificationLiveCompass;
assert(api, 'Live compass API must be exposed.');

const orientation = alpha => (listeners.deviceorientation || []).forEach(fn => fn({ alpha }));
orientation(10);
assert(Math.abs(api.getDisplayHeading() - 102.29) < 1e-9, 'First orientation must anchor to captured celestial heading.');
orientation(25);
assert(Math.abs(api.getDisplayHeading() - 117.29) < 1e-9, 'Relative +15° rotation must update only the isolated live heading.');

api.lock();
const locked = api.getDisplayHeading();
orientation(60);
assert(Math.abs(api.getDisplayHeading() - locked) < 1e-9, 'Lock must freeze the isolated live celestial heading.');

api.unlock();
orientation(60);
orientation(70);
assert(Math.abs(api.getDisplayHeading() - 112.29) < 1e-9, 'Unlock must re-anchor without changing raw record.');

assert.strictEqual(storeRecordCalls, 0, 'Verification store must remain read-only.');
assert.strictEqual(rawRecord.observedQiblaBearingDeg, 136.04, 'Raw astronomical Qibla must remain unchanged.');
assert.strictEqual(rawRecord.verificationOffsetDeg, 0, 'Raw astronomical deviation must remain unchanged.');
assert.strictEqual(rawRecord.trueCameraHeadingDeg, 102.29, 'Captured celestial heading must remain unchanged.');

const runtime = fs.readFileSync('js/qibla-card-runtime.js', 'utf8');
assert(runtime.includes('post-verification-live-compass.js'), 'Card runtime must load the isolated module.');
assert(runtime.includes("byId('astro-qibla-value')"), 'Canonical astronomical Qibla card must remain a separate target.');
assert(runtime.includes("byId('astro-deviation-value')"), 'Canonical astronomical deviation card must remain a separate target.');
assert(runtime.includes('QiblaPostVerificationLiveCompass'), 'Runtime must consume the isolated post-verification live heading.');
assert(runtime.includes('angleDiff(qibla,heading)'), 'Runtime must derive live astronomical deviation from Qibla minus live heading.');
assert(!runtime.includes("astroValue.textContent = liveHeading"), 'Live heading must never overwrite astronomical Qibla card.');
assert(!runtime.includes("astro-qibla-value').textContent = liveHeading"), 'Live heading must never overwrite astronomical Qibla card directly.');
assert(!runtime.includes('verificationOffsetDeg ='), 'UI runtime must never mutate stored raw deviation.');
assert(!runtime.includes('.record('), 'UI runtime must never write a new astronomical record.');

// Execute only the UI adapter with a frozen astronomical record and a live heading.
const nodes = {};
function node(id) { return nodes[id] ||= { id, textContent: '', style: {}, innerHTML: '' }; }
[
  'box-heading','live-compass-hint','astro-qibla-value','astro-qibla-hint',
  'astro-body-value','astro-body-label','astro-body-hint','astro-body-icon',
  'astro-deviation-value','astro-deviation-hint','qa-home'
].forEach(node);

const runtimeListeners = {};
const runtimeRecord = Object.freeze({
  schemaVersion: 4,
  source: 'astronomical-qibla-solved-bearing',
  alignmentMode: 'astronomical-solved-bearing',
  body: 'sun',
  trueCameraHeadingDeg: 135.72,
  observedQiblaBearingDeg: 136.04,
  referenceQiblaBearingDeg: 136.04,
  verificationOffsetDeg: 0.32,
  timestamp: 1785895000000
});
const runtimeContext = {
  console, Math, Number, Object, Array,
  setTimeout: () => 0,
  clearTimeout: () => {},
  setInterval: () => 1,
  clearInterval: () => {},
  addEventListener: (type, fn) => { (runtimeListeners[type] ||= []).push(fn); },
  dispatchEvent: () => true,
  document: {
    readyState: 'loading',
    getElementById: id => nodes[id] || null,
    addEventListener: () => {},
    querySelector: () => null,
    head: { appendChild: () => {} },
    documentElement: { appendChild: () => {} },
    createElement: () => ({ setAttribute: () => {} })
  },
  QiblaAstronomicalVerificationStore: { getLast: () => runtimeRecord },
  QiblaPostVerificationLiveCompass: { getDisplayHeading: () => 142.50 },
  CompassCards: {
    getAllCards: () => ({
      loading: false,
      liveCompass: { value: null, label: 'اضغط للتفعيل' },
      astroBody: { value: '135.7°', label: 'البوصلة الشمسية', cardLabel: 'البوصلة الشمسية' },
      astroQibla: { value: '136.04°', captureAge: 'الآن', label: 'القبلة الفلكية' },
      astroDeviation: { value: '0.32°', hint: 'المرجع يمين القياس', label: 'انحراف التحقق الفلكي' }
    })
  }
};
runtimeContext.globalThis = runtimeContext;
runtimeContext.window = runtimeContext;
vm.createContext(runtimeContext);
vm.runInContext(runtime, runtimeContext, { filename: 'qibla-card-runtime.js' });
runtimeContext.QiblaCardRuntime.update();

assert.strictEqual(nodes['astro-body-label'].textContent, 'البوصلة الشمسية', 'Verified Sun card must become the solar live compass.');
assert.strictEqual(nodes['astro-body-value'].textContent, '142.50°', 'Astronomical compass card must show the live post-verification heading.');
assert.strictEqual(nodes['astro-qibla-value'].textContent, '136.04°', 'Astronomical Qibla must remain the fixed verified bearing.');
assert.strictEqual(nodes['astro-deviation-value'].textContent, '6.46°', 'Live astronomical deviation must equal the shortest live-heading/Qibla difference.');
assert.strictEqual(runtimeRecord.observedQiblaBearingDeg, 136.04, 'Runtime must not mutate the verified astronomical Qibla.');
assert.strictEqual(runtimeRecord.verificationOffsetDeg, 0.32, 'Runtime must not mutate the original verification offset.');

const liveDeviation = ((142.5 - 136.04 + 540) % 360) - 180;
assert(Math.abs(liveDeviation - 6.46) < 1e-9, 'Reference relative-heading arithmetic must remain 6.46° for this fixture.');

const sw = fs.readFileSync('service-worker.js', 'utf8');
assert(/const VERSION='qiblaastro-v5\.[^']+';/.test(sw), 'Service worker must use a QiblaAstro v5 cache generation.');
assert(sw.includes("'./js/post-verification-live-compass.js'"), 'Isolated live module must be cached for offline use.');

console.log('POST-VERIFICATION LIVE COMPASS ISOLATION: PASS');
