'use strict';

// Permanent pre-field-test contract for feature/astronomical-solver-foundation.
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const index = fs.readFileSync('index.html', 'utf8');
const sw = fs.readFileSync('service-worker.js', 'utf8');
const gateway = fs.readFileSync('js/astro-verification.js', 'utf8');
const store = fs.readFileSync('js/astronomical-verification-store.js', 'utf8');
const cards = fs.readFileSync('js/compass-cards.js', 'utf8');
const runtime = fs.readFileSync('js/qibla-card-runtime.js', 'utf8');
const phonePage = fs.readFileSync('tests/qibla-axis-phone-test.html', 'utf8');
const phoneScript = fs.readFileSync('tests/qibla-axis-phone-test.js', 'utf8');
const provenanceGuard = fs.readFileSync('tests/qibla-axis-provenance-guard.js', 'utf8');

const retired = [
  'js/camera-engine.js',
  'js/celestial-solver.js',
  'js/tracking-lock.js',
  'js/confidence-engine.js',
  'js/celestial-overlay.js'
];

for (const file of retired) {
  if (file === 'js/camera-engine.js' || file === 'js/celestial-solver.js') {
    assert(!index.includes(file), `index.html must not load retired ${file}`);
    assert(!sw.includes(`'./${file}'`), `Service Worker must not cache retired ${file}`);
  } else {
    assert.strictEqual(fs.existsSync(file), false, `${file} must be deleted before field testing`);
    assert(!index.includes(file), `index.html must not reference ${file}`);
    assert(!sw.includes(path.basename(file)), `Service Worker must not reference ${file}`);
  }
}

const requiredRuntimeFiles = [
  'js/astro-verification.js',
  'js/compass-cards.js',
  'js/qibla-card-runtime.js',
  'js/astronomical-trace.js',
  'js/position-provider.js',
  'js/qibla-alignment-reticle.js',
  'js/astronomical-observation-bridge.js',
  'js/astronomical-observatory-ui.js',
  'js/astronomical-verification-store.js',
  'js/astronomical-verification-session.js'
];

for (const file of requiredRuntimeFiles) {
  assert(fs.existsSync(file), `Required field-test runtime is missing: ${file}`);
  assert(sw.includes(`'./${file}'`), `Service Worker must cache field-test runtime: ${file}`);
}

assert(index.includes('<script src="js/astro-verification.js"></script>'),
  'Application must load the astronomical verification gateway.');
assert(index.includes('<script src="js/compass-cards.js"></script>'),
  'Application must load canonical compass cards.');
assert(index.includes('<script src="js/qibla-card-runtime.js"></script>'),
  'Application must load the standalone card runtime.');
assert(!index.includes('function _qiblaUpdateNewCards('),
  'Card glue must not return to inline index.html code.');

assert(gateway.includes('observedQiblaBearingDeg'),
  'Gateway must propagate the observed astronomical Qibla bearing.');
assert(gateway.includes('exportTraceJson'),
  'Gateway must expose the field trace report.');
assert(store.includes("source: 'astronomical-qibla-solved-bearing'"),
  'Store must preserve solved-bearing provenance.');
assert(cards.includes('record.observedQiblaBearingDeg'),
  'Astronomical Qibla card must read the observed bearing.');
assert(cards.includes('record.verificationOffsetDeg'),
  'Astronomical deviation card must read the verification offset.');
assert(!runtime.includes('qiblaBearingDeg'),
  'UI runtime must not know the retired geodesic field.');
assert(!runtime.includes('rawAstronomicalQiblaDeg'),
  'UI runtime must not know the retired raw alias.');

assert(phonePage.includes('qibla-axis-phone-test.js'),
  'Final phone test page must load its controller.');
assert(phonePage.includes('qibla-axis-provenance-guard.js'),
  'Final phone test page must load its provenance guard.');
assert(phoneScript.includes('observedQiblaBearingDeg'),
  'Phone test must display the observed astronomical bearing.');
assert(phoneScript.includes('verificationOffsetDeg'),
  'Phone test must display the independent verification offset.');
assert(provenanceGuard.includes("astronomical-qibla-alignment-observation"),
  'Phone test must enforce canonical provenance.');
assert(provenanceGuard.includes("data-provenance-valid"),
  'Phone test must expose provenance validation state.');
assert(provenanceGuard.includes("رفض السجل"),
  'Phone test must visibly reject a non-canonical result.');

// Cache generations advance as presentation/PWA assets evolve. The field contract
// requires a QiblaAstro v5 generation and the runtime files above, not one historic version string.
assert(/const VERSION\s*=\s*'qiblaastro-v5\.[^']+';/.test(sw),
  'Field test must run against a QiblaAstro v5 cache generation.');

console.log('FIELD TEST READINESS: PASS');
console.log('Canonical observation -> store -> cards -> phone trace path is ready.');
