'use strict';

const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

const source = fs.readFileSync('js/qibla-card-runtime.js', 'utf8');

for (const forbidden of [
  'calculateQiblaBearing',
  'QT +',
  'deviceHeading',
  'webkitCompassHeading',
  'magneticDeclination',
  'qiblaBearingDeg',
  'rawAstronomicalQiblaDeg',
  'relativeQiblaAngleDeg',
  'rawRelativeQiblaAngleDeg',
  'ConfidenceFusionEngine',
  'QiblaAstronomicalVerificationStore'
]) {
  assert(!source.includes(forbidden), `Card runtime must not contain calculation or legacy token: ${forbidden}`);
}
assert(source.includes('CompassCards.getAllCards') || source.includes('Cards.getAllCards'),
  'Card runtime must read the canonical CompassCards view model.');
assert(source.includes("root._qiblaUpdateNewCards = updateCards"),
  'Legacy UI entry point must delegate to the standalone runtime temporarily.');

const nodes = new Map();
function node(id) {
  if (!nodes.has(id)) {
    nodes.set(id, {
      id,
      textContent: '',
      innerHTML: '',
      style: {},
      setAttribute() {}
    });
  }
  return nodes.get(id);
}

let intervalCallback = null;
const appendedScripts = [];
const cardModel = {
  loading: false,
  liveCompass: { state: 'active', label: 'نشطة' },
  astroBody: { body: 'moon', cardLabel: 'البوصلة القمرية', value: '135.72°', label: 'مرصودة' },
  astroQibla: { value: '135.72°', captureAge: 'الآن', label: 'القبلة الفلكية' },
  astroDeviation: { value: '0.32°', label: 'فرق التحقق' }
};
const context = {
  globalThis: null,
  document: {
    readyState: 'complete',
    getElementById: node,
    querySelector() { return null; },
    createElement(tag) {
      return { tagName: String(tag).toUpperCase(), src: '', async: true, onload: null, setAttribute() {} };
    },
    head: { appendChild(el) { appendedScripts.push(el); return el; } },
    documentElement: { appendChild(el) { appendedScripts.push(el); return el; } },
    addEventListener() {}
  },
  CompassCards: {
    getAllCards() { return cardModel; }
  },
  setInterval(fn) { intervalCallback = fn; return 7; },
  clearInterval() {},
  setTimeout(fn) { fn(); return 1; },
  Date,
  Object,
  Number,
  Math
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source, context);

assert(context.QiblaCardRuntime, 'Standalone runtime API must be exported.');
context.QiblaCardRuntime.update(true);
assert.strictEqual(node('astro-qibla-value').textContent, '135.72°');
assert.strictEqual(node('astro-deviation-value').textContent, '0.32°');
assert.strictEqual(cardModel.astroBody.cardLabel, 'البوصلة القمرية',
  'Astro body identity remains owned by the canonical CompassCards model.');
assert.strictEqual(cardModel.astroBody.value, '135.72°',
  'Astro body heading remains owned by the canonical CompassCards model.');
assert.strictEqual(typeof intervalCallback, 'function', 'Runtime must schedule lightweight periodic UI refresh.');
assert(appendedScripts.some(s => /post-verification-live-compass\.js/.test(s.src)),
  'Authoritative runtime must request the original post-verification live compass module.');

console.log('Standalone Qibla card runtime contract tests passed.');
