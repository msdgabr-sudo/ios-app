'use strict';

const assert = require('assert');
const fs = require('fs');

const page = fs.readFileSync('pages/wmm2025-test.html', 'utf8');
const serviceWorker = fs.readFileSync('service-worker.js', 'utf8');

assert.ok(page.includes('../js/geomag/wmm2025.js'), 'canonical WMM2025 engine is not loaded');
assert.ok(page.includes('../js/geomag/wmm2025-runtime.js'), 'trusted runtime adapter is not loaded');
assert.ok(page.indexOf('../js/geomag/wmm2025.js') < page.indexOf('../js/geomag/wmm2025-runtime.js'), 'engine must load before runtime adapter');
assert.ok(!page.includes('wmm2025-standalone.js'), 'legacy standalone engine must not be used');
assert.ok(page.includes("trusted:true,source:'gps'"), 'browser test must identify a trusted device GPS fix');
assert.ok(page.includes('enableHighAccuracy:true'), 'browser test must request high-accuracy location');
assert.ok(page.includes('maximumAge:0'), 'browser test must reject a cached location fix');
assert.ok(page.includes('result.publish'), 'browser test must honor the runtime publication gate');
assert.ok(serviceWorker.includes("'./pages/wmm2025-test.html'"), 'browser test page must be available offline after installation');

console.log('WMM2025 canonical browser test page: PASS');
