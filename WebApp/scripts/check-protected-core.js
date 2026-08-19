'use strict';
const fs = require('fs');
const crypto = require('crypto');

const protectedFiles = [
  'js/astro-verification.js',
  'js/astronomical-observation-bridge.js',
  'js/astronomical-solver.js',
  'js/astronomical-verification-session.js',
  'js/astronomical-verification-store.js',
  'js/celestial-detector.js',
  'js/camera-projection.js',
  'js/camera-pose.js',
  'js/gravity-reference.js',
  'js/astro-qibla-engine.js'
];

const expected = {
  // Authoritative PR #3 / feature/astronomical-solver-foundation baseline.
  // Gateway includes the reviewed Sun-first observable-body restoration.
  // These hashes freeze the restored scientific engine on branch `one`.
  'js/astro-verification.js': '692c1f628aa524c3f0d58530bed3c4618841da24',
  'js/astronomical-observation-bridge.js': '1db4f3e4e3b79ae552ee7eaef77272bbfe20c2e5',
  'js/astronomical-solver.js': 'b17a4ac09c1a84e640e5007c2d69aaf8b542a65b',
  'js/astronomical-verification-session.js': '3f144a46c0488a8de2f1cb007d400b35fe44ba40',
  'js/astronomical-verification-store.js': '29b7ac0dee7259a25a4a51bea00eb1bcb66d20e7',
  'js/celestial-detector.js': 'd0b77e77b4398b88fa8a3771a04d97fdaed0d7a4',
  'js/camera-projection.js': '0ccdd9de84bb11ab41afe01b8b7eca91c1c62384',
  'js/camera-pose.js': '519e4773582ddc4bd6d0b4c3c2ffd79073bb1890',
  'js/gravity-reference.js': 'b4aa8dffd7ba3f0e11a0dba54ad67032bff0b2b7',
  'js/astro-qibla-engine.js': '48266717b968adaa0e98ca33219ab85d96d48b00'
};

function gitBlobSha(buffer) {
  const header = Buffer.from(`blob ${buffer.length}\0`, 'utf8');
  return crypto.createHash('sha1').update(header).update(buffer).digest('hex');
}

let failed = false;
for (const file of protectedFiles) {
  if (!fs.existsSync(file)) {
    console.error(`PROTECTED CORE MISSING: ${file}`);
    failed = true;
    continue;
  }
  const actual = gitBlobSha(fs.readFileSync(file));
  if (actual !== expected[file]) {
    console.error(`PROTECTED CORE CHANGED: ${file}`);
    console.error(` expected ${expected[file]}`);
    console.error(` actual   ${actual}`);
    failed = true;
  } else {
    console.log(`PASS ${file}`);
  }
}

if (failed) {
  console.error('Protected scientific core integrity check FAILED. Structural/UI migration must not change these files.');
  process.exit(1);
}
console.log('Protected scientific core integrity check PASSED.');
