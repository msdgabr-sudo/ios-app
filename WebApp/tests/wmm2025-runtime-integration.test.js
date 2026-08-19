'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const runtime = require('../js/geomag/wmm2025-runtime.js');

const root = path.resolve(__dirname, '..');
const date = new Date('2026-08-14T12:00:00.000Z');

function evaluate(latitude, longitude, altitudeMeters) {
  return runtime.evaluateTrustedFix({
    trusted: true,
    source: 'gps',
    latitude,
    longitude,
    altitudeMeters: altitudeMeters || 0,
    date
  });
}

const locations = [
  ['Makkah, Saudi Arabia', 21.42250833, 39.82616667, 3.503246],
  ['Cairo, Egypt', 30.0444, 31.2357, 4.766930],
  ['Jakarta, Indonesia', -6.2088, 106.8456, 0.645924],
  ['New York, USA', 40.7128, -74.0060, -12.469711],
  ['London, Europe', 51.5074, -0.1278, 1.182200]
];

for (const [name, lat, lon, expectedDeclination] of locations) {
  const result = evaluate(lat, lon);
  assert.strictEqual(result.ok, true, `${name}: result must be valid`);
  assert.strictEqual(result.publish, true, `${name}: result must be publishable`);
  assert.strictEqual(result.status, 'normal', `${name}: expected normal field`);
  assert.ok(Math.abs(result.declinationDeg - expectedDeclination) < 0.000001,
    `${name}: unexpected declination ${result.declinationDeg}`);
}

assert.ok(Math.abs(evaluate(30.0444, 31.2357).declinationDeg -
  evaluate(-6.2088, 106.8456).declinationDeg) > 4,
  'Egypt and Indonesia must not receive the same regional correction');
assert.ok(evaluate(40.7128, -74.0060).declinationDeg < 0,
  'New York declination should have the expected opposite sign');

assert.deepStrictEqual(
  runtime.evaluateTrustedFix({
    trusted: false, source: 'unresolved', latitude: 30, longitude: 31, date
  }),
  { ok: false, publish: false, status: 'unavailable', reason: 'trusted-device-gnss-required' }
);
assert.strictEqual(runtime.evaluateTrustedFix({
  trusted: true, source: 'ip', latitude: 30, longitude: 31, date
}).publish, false, 'IP must never publish MDECL');
assert.strictEqual(runtime.evaluateTrustedFix({
  trusted: true, source: 'gps', latitude: NaN, longitude: 31, date
}).status, 'invalid', 'NaN coordinates must be rejected');
assert.strictEqual(runtime.evaluateTrustedFix({
  trusted: true, source: 'gps', latitude: 91, longitude: 31, date
}).status, 'invalid', 'out-of-range coordinates must be rejected');

const syntheticNonFinite = {
  field() {
    return {
      declinationDeg: NaN, inclinationDeg: 0, northNt: 1, eastNt: 1,
      downNt: 1, horizontalNt: 2, totalNt: 3, decimalYear: 2026
    };
  }
};
assert.strictEqual(runtime.evaluateTrustedFix({
  trusted: true, source: 'gps', latitude: 0, longitude: 0, date
}, syntheticNonFinite).reason, 'non-finite-wmm2025-output');

const blackout = evaluate(86, 140);
assert.strictEqual(blackout.status, 'blackout');
assert.strictEqual(blackout.publish, false, 'H < 2000 nT must block publication');

const caution = evaluate(83, 54);
assert.strictEqual(caution.status, 'caution');
assert.strictEqual(caution.publish, true, '2000 <= H < 6000 nT must retain caution state');
assert.ok(caution.horizontalNt >= 2000 && caution.horizontalNt < 6000);

const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const gnss = fs.readFileSync(path.join(root, 'js/05-gnss.js'), 'utf8');
const astronomy = fs.readFileSync(path.join(root, 'js/10-astronomy.js'), 'utf8');
assert.ok(index.indexOf('js/geomag/wmm2025.js') < index.indexOf('js/geomag/wmm2025-runtime.js'));
assert.ok(index.indexOf('js/geomag/wmm2025-runtime.js') < index.indexOf('window.dataLayer='));
for (const source of [index, astronomy]) {
  assert.ok(!source.includes('function magDecl('), 'legacy MDECL producer must be removed');
  assert.ok(!source.includes('return d+0.30'), 'Egypt regional correction must be removed');
}
for (const source of [index, gnss]) {
  assert.ok(!source.includes('get.geojs.io'));
  assert.ok(!source.includes('freeipapi.com'));
  assert.ok(!source.includes('ipwhois.app'));
  const compatibilityAlias = source.match(/function tryIPGeo\(\)\{([\s\S]*?)\n\}/);
  assert.ok(compatibilityAlias, 'legacy UI compatibility alias is missing');
  assert.ok(compatibilityAlias[1].includes('showGnssUnavailable'), 'IP alias must keep location unavailable');
  assert.ok(!/fetch\s*\(|XMLHttpRequest|navigator\.geolocation/.test(compatibilityAlias[1]), 'IP alias must not resolve a location');
}
for (const source of [index, astronomy]) {
  assert.ok(source.includes("source:gnssSource"), 'WMM source must use the GNSS trust state');
}
assert.ok(index.includes('if(!gnssHasTrustedFix||gnssSource!==\'gps\')'));
assert.ok(index.includes('if(MDECL_READY)QM=((QT-MDECL)+360)%360;'));
for (const source of [index, gnss]) {
  assert.ok(source.includes('let LAT = Number.NaN;'), 'startup latitude must fail closed');
  assert.ok(source.includes('let LON = Number.NaN;'), 'startup longitude must fail closed');
  assert.ok(!source.includes('let LAT = 30.0342065'), 'legacy Giza startup latitude remains');
  assert.ok(!source.includes('let LON = 30.9606385'), 'legacy Giza startup longitude remains');
}
for (const source of [index, astronomy]) {
  assert.ok(source.includes('let QT=0;'), 'QT must remain unpublished until trusted GNSS');
  assert.ok(!source.includes('let QT=calcQibla();'), 'startup must not calculate QT from placeholder coordinates');
}
for (const source of [index, gnss]) {
  const unavailable = source.match(/function showGnssUnavailable\(message\)\{([\s\S]*?)\n\}/);
  assert.ok(unavailable, 'GNSS unavailable handler is missing');
  const body = unavailable[1];
  assert.ok(body.includes("gnssSource='unresolved'"), 'denial must revoke the trusted source');
  assert.ok(body.includes('gnssHasTrustedFix=false'), 'denial must revoke the trusted fix');
  assert.ok(body.includes('MDECL_READY=false'), 'denial must revoke published MDECL');
  assert.ok(body.includes("MDECL_STATUS='unavailable'"), 'denial must reset WMM status');
  assert.ok(body.includes('MDECL_FIELD=null'), 'denial must discard the previous WMM field');
  assert.ok(body.includes("set('cfg-md','---')"), 'denial must clear the displayed declination');
}
assert.ok(index.includes('const y=Math.sin(dL)*Math.cos(f2),x=Math.cos(f1)*Math.sin(f2)-Math.sin(f1)*Math.cos(f2)*Math.cos(dL);'),
  'QT equation changed unexpectedly');

const protectedHashes = {
  'js/01-inertia.js': '5627ee185bd43723455991e3fa34fb20b7c5c5f3d52b62f6b1bdbc384a2524d6',
  'js/12-compass-canvas.js': '6dce23759389bef02dfcd460168d0c4885d096588a6da7894967fedcacc5f4d1',
  'js/18-sky-bg.js': '92ebbe4647089cf64f00ec8588c3570daf0e87bb42f62bdd6a9db39694e5c202',
  'js/20-device-compass.js': '72b83379d66b0a7803be40c63911f6d27145011e3dd4cb41e08982f885e2413c',
  'js/camera-engine.js': 'e1f98204ab7d2957b48cb5c32a566eaaefa419d19611c7b2dde18ce5320582ee',
  'js/camera-pose.js': 'f702bfbadacb1378ec947039542db80eb1c816bc6e6fce359b2630d5dbe73b39',
  'js/camera-projection.js': 'ec7c4fc28a113a63873c9ab44354aa1591733bf5df108049a9fa86efd359ca5e',
  'js/astro-verification.js': '4081fca687b0f032aac05e681062a89533e2ff3ee3cbd6e53fffebef4a6f84f2',
  'js/astronomical-observation-bridge.js': '5b55d0da0412667d972384a4eddf71b355b6643786bc25e2f0f5ec05f924b784',
  'js/astronomical-solver.js': '7e599ea4687ef171198c34f46c35ac2b68aa1bf117221b94c5491ccfff6d6f2d',
  'js/astronomical-verification-session.js': '009b9a74211fc6fa2f14ad8cf7a1b26efcfb3548d5d6124d814c99c33f991dcd',
  'js/astronomical-verification-store.js': 'e56d1f1eb076c5f9eb02e63d97a8da756b856658c9feb4796dfa38b47a94529d',
  'js/celestial-detector.js': 'f4af10317f121f42f25de602b7cccd0b8a033fb65bd64d71b7767718d8fa1b38',
  'js/gravity-reference.js': '36b3235ef70417eaf81b071f3527fba12324a27f64694049aab0d75e00034e0c',
  'js/astro-qibla-engine.js': '8f7b60c21c6733554d274656c6ecdee8931198be92c466102e9601212032a5a8'
};

for (const [file, expected] of Object.entries(protectedHashes)) {
  const actual = crypto.createHash('sha256')
    .update(fs.readFileSync(path.join(root, file))).digest('hex');
  assert.strictEqual(actual, expected, `${file}: protected boundary changed`);
}

console.log('WMM2025 runtime integration gate: PASS');
for (const [name, lat, lon] of locations) {
  const result = evaluate(lat, lon);
  console.log(`${name}: D=${result.declinationDeg.toFixed(6)}°, H=${result.horizontalNt.toFixed(2)} nT, ${result.status}`);
}
console.log(`Blackout vector: H=${blackout.reason} (publication blocked)`);
console.log(`Caution vector: H=${caution.horizontalNt.toFixed(2)} nT (${caution.status})`);
