'use strict';

const fs = require('fs');
const assert = require('assert');

const index = fs.readFileSync('index.html', 'utf8');
const sw = fs.readFileSync('service-worker.js', 'utf8');

assert.strictEqual(fs.existsSync('js/tracking-lock.js'), false, 'tracking-lock.js must be deleted.');
assert(!index.includes('js/tracking-lock.js'), 'index.html must not load tracking-lock.js.');
assert(!index.includes('_qiblaToggleTracking'), 'Tracking toggle glue must be deleted.');
assert(!index.includes('_qiblaToggleLock'), 'Lock toggle glue must be deleted.');
assert(!index.includes('tracking-toggle-btn'), 'Tracking button must be absent.');
assert(!index.includes('lock-toggle-btn'), 'Lock button must be absent.');
assert(!index.includes('window.TrackingLock'), 'index.html must not depend on TrackingLock.');
assert(!sw.includes('tracking-lock.js'), 'Service Worker must not cache tracking-lock.js.');

console.log('Tracking and lock are fully removed from runtime.');
