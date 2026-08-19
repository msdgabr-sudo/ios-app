'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const files = [
  'js/presentation/compass/mode-view.js',
  'js/presentation/compass/astro-dashboard.js',
  'js/presentation/prayer/screen.js',
  'js/presentation/prayer/adhan-ui.js',
  'js/presentation/prayer/schedule-sync.js',
  'js/presentation/page-loader.js',
  'js/presentation/page-registry.js',
  'js/qibla-card-runtime.js'
];

const forbiddenWrites = [
  { name: 'QT assignment', re: /\bQT\s*=(?!=)/ },
  { name: 'trueCameraHeadingDeg assignment', re: /\btrueCameraHeadingDeg\s*=(?!=)/ },
  { name: 'observedQiblaBearingDeg assignment', re: /\bobservedQiblaBearingDeg\s*=(?!=)/ },
  { name: 'referenceQiblaBearingDeg assignment', re: /\breferenceQiblaBearingDeg\s*=(?!=)/ },
  { name: 'verificationOffsetDeg assignment', re: /\bverificationOffsetDeg\s*=(?!=)/ },
  { name: 'targetAzDeg assignment', re: /\btargetAzDeg\s*=(?!=)/ },
  { name: 'targetAltDeg assignment', re: /\btargetAltDeg\s*=(?!=)/ },
  { name: 'verification store record call', re: /QiblaAstronomicalVerificationStore\s*\.\s*record\s*\(/ },
  { name: 'verification store reset call', re: /QiblaAstronomicalVerificationStore\s*\.\s*reset\s*\(/ },
  { name: 'solver invocation', re: /QiblaAstronomicalSolver\s*\.\s*solveObservation\s*\(/ },
  { name: 'camera solver invocation', re: /celestialSolver\s*\(/i },
  { name: 'verification state mutation', re: /verificationState\s*=/i }
];

for (const relative of files) {
  const absolute = path.join(root, relative);
  assert.ok(fs.existsSync(absolute), `missing presentation file: ${relative}`);
  const source = fs.readFileSync(absolute, 'utf8');
  for (const rule of forbiddenWrites) {
    assert.ok(!rule.re.test(source), `${relative} violates scientific write barrier: ${rule.name}`);
  }
}

console.log(`PRESENTATION SCIENTIFIC WRITE BARRIER: PASS (${files.length} files)`);
