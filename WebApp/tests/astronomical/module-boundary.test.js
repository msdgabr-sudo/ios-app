'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const manifest = require('../../js/astronomical/module-manifest.js');

const repoRoot = path.resolve(__dirname, '../..');
const ids = new Set();
const paths = new Set();

assert.strictEqual(manifest.LOCKED_CONTRACT.horizontalFovDeg, 65, 'FOV contract changed');
assert.strictEqual(manifest.LOCKED_CONTRACT.alignmentToleranceDeg, 1, 'alignment tolerance changed');
assert.strictEqual(manifest.LOCKED_CONTRACT.solverCompassFree, true, 'solver compass-free contract changed');
assert.ok(manifest.MODULES.length >= 16, 'protected stack is incomplete');

for (const mod of manifest.MODULES) {
  assert.ok(mod.id && mod.path && mod.role, 'module descriptor is incomplete');
  assert.ok(!ids.has(mod.id), `duplicate module id: ${mod.id}`);
  assert.ok(!paths.has(mod.path), `duplicate module path: ${mod.path}`);
  ids.add(mod.id);
  paths.add(mod.path);
  const absolute = path.join(repoRoot, mod.path);
  assert.ok(fs.existsSync(absolute), `missing protected module: ${mod.path}`);
}

const solverText = fs.readFileSync(path.join(repoRoot, 'js/astronomical-solver.js'), 'utf8');
assert.match(solverText, /Uses no compass, magnetometer, device heading, QT or magnetic declination\./,
  'solver compass-free declaration is missing');

const bridgeText = fs.readFileSync(path.join(repoRoot, 'js/astronomical-observation-bridge.js'), 'utf8');
assert.match(bridgeText, /horizontalFovDeg:\s*65/, 'bridge default FOV is no longer 65 degrees');
assert.match(bridgeText, /alignmentToleranceDeg:\s*1/, 'bridge alignment tolerance is no longer 1 degree');

console.log(`ASTRONOMICAL MODULE BOUNDARY: PASS (${manifest.MODULES.length} modules)`);
