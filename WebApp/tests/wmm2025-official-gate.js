'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const wmm = require('../js/geomag/wmm2025.js');
const reference = require('./wmm2025-reference-vectors.json');

const FIELD_MAP = {
  x: 'northNt',
  y: 'eastNt',
  z: 'downNt',
  h: 'horizontalNt',
  f: 'totalNt',
  inclination: 'inclinationDeg',
  declination: 'declinationDeg'
};

let assertions = 0;
let largestFieldError = { error: -1 };
let largestAngleError = { error: -1 };
for (const vector of reference.vectors) {
  const actual = wmm.field(vector.lat, vector.lon, {
    altitudeKm: vector.heightKm,
    decimalYear: vector.year
  });

  for (const [expectedKey, actualKey] of Object.entries(FIELD_MAP)) {
    const tolerance = expectedKey === 'inclination' || expectedKey === 'declination'
      ? reference.acceptance.angleDeg
      : reference.acceptance.fieldNt;
    const error = Math.abs(actual[actualKey] - vector[expectedKey]);
    const observation = {
      error, field: expectedKey, year: vector.year, heightKm: vector.heightKm,
      lat: vector.lat, lon: vector.lon, expected: vector[expectedKey], actual: actual[actualKey]
    };
    if (error > largestFieldError.error) largestFieldError = observation;
    if ((expectedKey === 'inclination' || expectedKey === 'declination') && error > largestAngleError.error) {
      largestAngleError = observation;
    }
    assert.ok(
      error <= tolerance,
      `${vector.year}/${vector.heightKm}km/${vector.lat}/${vector.lon} ${expectedKey}: ` +
      `expected ${vector[expectedKey]}, got ${actual[actualKey]}, error ${error}`
    );
    assertions += 1;
  }
}

const coefficientPath = path.join(__dirname, '..', 'data', 'WMM2025.COF');
const coefficientText = fs.readFileSync(coefficientPath, 'utf8');
assert.ok(coefficientText.endsWith('\n'), 'WMM2025.COF must end with a newline');
const coefficientLines = coefficientText.trimEnd().split(/\r?\n/);
assert.strictEqual(coefficientLines[0], '2025.0 WMM-2025 11/13/2024');
assert.strictEqual(coefficientLines.length, 93, 'header + 90 coefficients + 2 terminators required');
assert.ok(/^9{48}$/.test(coefficientLines.at(-1)), 'missing second official terminator');
assert.ok(/^9{48}$/.test(coefficientLines.at(-2)), 'missing first official terminator');

const fileRows = coefficientLines.slice(1, -2).map(line => line.trim().split(/\s+/).map(Number));
assert.deepStrictEqual(fileRows, wmm.coefficientRows, 'engine coefficients differ from WMM2025.COF');

assert.throws(() => wmm.field(91, 0, {decimalYear: 2025}), /coordinates/);
assert.throws(() => wmm.field(0, 361, {decimalYear: 2025}), /coordinates/);
assert.throws(() => wmm.field(0, 0, {altitudeKm: 851, decimalYear: 2025}), /altitude/);
assert.throws(() => wmm.field(0, 0, {decimalYear: 2030}), /date/);
assert.strictEqual(wmm.runtimeIntegrated, false);

console.log(`WMM2025 OFFICIAL GATE PASSED: ${reference.vectors.length} vectors, ${assertions} field assertions`);
console.log(`Largest field-component error: ${largestFieldError.error.toFixed(9)} (${largestFieldError.field}, ${largestFieldError.year}/${largestFieldError.heightKm}km/${largestFieldError.lat}/${largestFieldError.lon})`);
console.log(`Largest angular error: ${largestAngleError.error.toFixed(9)}° (${largestAngleError.field}, ${largestAngleError.year}/${largestAngleError.heightKm}km/${largestAngleError.lat}/${largestAngleError.lon})`);
