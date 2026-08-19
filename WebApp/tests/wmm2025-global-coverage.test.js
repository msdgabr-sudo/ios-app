'use strict';

const assert = require('assert');
const wmm = require('../js/geomag/wmm2025.js');

// Geographic smoke coverage required before runtime integration.
// This is deliberately NOT a golden-reference test: NOAA official golden vectors
// remain in tests/wmm2025-official-gate.js. These points verify global numerical
// stability and internal field-component consistency without deriving fake
// "reference" values from this implementation itself.
const LOCATIONS = [
  {name: 'Makkah', lat: 21.422487, lon: 39.826206},
  {name: 'Cairo', lat: 30.0444, lon: 31.2357},
  {name: 'London', lat: 51.5074, lon: -0.1278},
  {name: 'New York', lat: 40.7128, lon: -74.0060},
  {name: 'Jakarta', lat: -6.2088, lon: 106.8456},
  {name: 'Sydney', lat: -33.8688, lon: 151.2093},
  {name: 'High North', lat: 80, lon: 0},
  {name: 'High South', lat: -80, lon: 0},
  {name: 'Equator', lat: 0, lon: 0}
];

const YEARS = [2025.0, 2027.5, 2029.99];
const EPS_NT = 1e-6;
const EPS_DEG = 1e-10;
let assertions = 0;
let minimumHorizontal = {value: Infinity};

function angularDifference(a, b) {
  let d = ((a - b + 540) % 360) - 180;
  return Math.abs(d);
}

for (const location of LOCATIONS) {
  for (const decimalYear of YEARS) {
    const result = wmm.field(location.lat, location.lon, {
      altitudeKm: 0,
      decimalYear
    });

    for (const key of [
      'declinationDeg', 'inclinationDeg', 'northNt', 'eastNt', 'downNt',
      'horizontalNt', 'totalNt', 'decimalYear'
    ]) {
      assert.ok(Number.isFinite(result[key]), `${location.name}/${decimalYear}: ${key} must be finite`);
      assertions += 1;
    }

    assert.ok(result.horizontalNt >= 0, `${location.name}/${decimalYear}: H must be non-negative`);
    assert.ok(result.totalNt >= result.horizontalNt, `${location.name}/${decimalYear}: F must be >= H`);
    assertions += 2;

    const hFromXY = Math.hypot(result.northNt, result.eastNt);
    const fFromHZ = Math.hypot(result.horizontalNt, result.downNt);
    assert.ok(Math.abs(hFromXY - result.horizontalNt) <= EPS_NT,
      `${location.name}/${decimalYear}: H inconsistent with X/Y`);
    assert.ok(Math.abs(fFromHZ - result.totalNt) <= EPS_NT,
      `${location.name}/${decimalYear}: F inconsistent with H/Z`);
    assertions += 2;

    const dFromXY = Math.atan2(result.eastNt, result.northNt) * 180 / Math.PI;
    const iFromZH = Math.atan2(result.downNt, result.horizontalNt) * 180 / Math.PI;
    assert.ok(angularDifference(dFromXY, result.declinationDeg) <= EPS_DEG,
      `${location.name}/${decimalYear}: D inconsistent with X/Y`);
    assert.ok(Math.abs(iFromZH - result.inclinationDeg) <= EPS_DEG,
      `${location.name}/${decimalYear}: I inconsistent with Z/H`);
    assertions += 2;

    assert.ok(['normal', 'caution', 'blackout'].includes(result.status),
      `${location.name}/${decimalYear}: invalid magnetic reliability status`);
    assertions += 1;

    if (result.horizontalNt < minimumHorizontal.value) {
      minimumHorizontal = {
        value: result.horizontalNt,
        name: location.name,
        year: decimalYear,
        status: result.status
      };
    }
  }
}

assert.strictEqual(wmm.runtimeIntegrated, false, 'isolated engine must remain disconnected from runtime');
assert.strictEqual(wmm.model, 'WMM2025');
assert.strictEqual(wmm.epoch, 2025);
assert.strictEqual(wmm.degree, 12);
assert.strictEqual(wmm.order, 12);
assertions += 5;

console.log(`WMM2025 GLOBAL COVERAGE PASSED: ${LOCATIONS.length} locations x ${YEARS.length} dates; ${assertions} assertions`);
console.log(`Minimum H in coverage set: ${minimumHorizontal.value.toFixed(3)} nT at ${minimumHorizontal.name}/${minimumHorizontal.year} (${minimumHorizontal.status})`);
