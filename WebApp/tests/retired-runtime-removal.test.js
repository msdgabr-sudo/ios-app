'use strict';
const fs = require('fs');
const assert = require('assert');
const index = fs.readFileSync('index.html','utf8');
const sw = fs.readFileSync('service-worker.js','utf8');
for (const file of ['js/confidence-engine.js','js/celestial-overlay.js']) {
  assert.strictEqual(fs.existsSync(file), false, file + ' must be deleted');
  assert(!index.includes(file), 'index must not load ' + file);
  assert(!sw.includes(file.split('/').pop()), 'Service Worker must not cache ' + file);
}
const cards = fs.readFileSync('js/compass-cards.js','utf8');
const gateway = fs.readFileSync('js/astro-verification.js','utf8');
assert(!cards.includes('ConfidenceFusionEngine'), 'CompassCards must stay independent from legacy confidence');
assert(!gateway.includes('ConfidenceFusionEngine'), 'Gateway must stay independent from legacy confidence');
console.log('Retired confidence and overlay runtimes are fully removed.');
