'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');

const read = file => fs.readFileSync(file, 'utf8');
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

const canonical = {
  'js/geomag/wmm2025.js': '374ed4125f46cf6f6da0b27e0435f9bdb23f20bd00aa860e16a9e35da7accd72',
  'data/WMM2025.COF': '94448f40d784ef616eef0098a96b69a0944bcba88b6f573e6dce9aac3a0f8bfb'
};
for (const [file, expected] of Object.entries(canonical)) {
  assert.strictEqual(sha256(file), expected, `${file}: canonical scientific artifact changed`);
}

const historical = [
  'js/22-wmm2025-engine.js',
  'js/engines/wmm2025-isolated.js',
  'js/wmm2025-standalone.js'
];
const runtimeSurfaces = [read('index.html'), read('service-worker.js'), read('pages/wmm2025-test.html')];
for (const file of historical) {
  assert.ok(fs.existsSync(file), `${file}: historical audit artifact missing`);
  const rootPath = file;
  const pagePath = `../${file}`;
  for (const surface of runtimeSurfaces) {
    assert.ok(!surface.includes(rootPath), `${file}: experimental engine entered runtime surface`);
    assert.ok(!surface.includes(pagePath), `${file}: experimental engine entered test page`);
  }
}

const index = read('index.html');
assert.ok(index.includes('js/geomag/wmm2025.js'));
assert.ok(index.includes('js/geomag/wmm2025-runtime.js'));
assert.ok(index.indexOf('js/geomag/wmm2025.js') < index.indexOf('js/geomag/wmm2025-runtime.js'));
assert.ok(!/let\s+LAT\s*=\s*30\.0342065/.test(index), 'legacy Giza startup latitude remains');
assert.ok(!/let\s+LON\s*=\s*30\.9606385/.test(index), 'legacy Giza startup longitude remains');

console.log('WMM2025 canonical/experimental/startup audit gate: PASS');
