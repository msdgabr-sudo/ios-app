'use strict';

const fs = require('fs');
const assert = require('assert');
const Store = require('../js/astronomical-verification-store.js');
const SessionModule = require('../js/astronomical-verification-session.js');

function near(actual, expected, tolerance = 1e-9) {
  return Math.abs(actual - expected) <= tolerance;
}

function createMockUi() {
  const classes = new Set();
  return {
    state: 'SEARCHING',
    captureInProgress: false,
    root: {
      classList: {
        contains(name) { return classes.has(name); },
        add(name) { classes.add(name); },
        remove(name) { classes.delete(name); }
      }
    }
  };
}

async function simulateCapture(mode) {
  const ui = createMockUi();
  const waiting = SessionModule.waitForFrozenCapture(ui, 1000);
  setTimeout(() => {
    ui.state = 'CAPTURING';
    ui.captureInProgress = true;
  }, 20);
  setTimeout(() => {
    ui.root.classList.add('is-frozen');
    ui.captureInProgress = false;
    ui.state = 'CAPTURED';
  }, mode === 'manual' ? 90 : 120);
  const completed = await waiting;
  assert.strictEqual(completed, true, `${mode} capture must wait until the frame is frozen.`);
  assert.strictEqual(ui.root.classList.contains('is-frozen'), true,
    `${mode} capture must finish with a frozen frame.`);
}

(async () => {
  const sessionSource = fs.readFileSync('js/astronomical-verification-session.js', 'utf8');
  const storeSource = fs.readFileSync('js/astronomical-verification-store.js', 'utf8');
  const gatewaySource = fs.readFileSync('js/astro-verification.js', 'utf8');
  const bridgeSource = fs.readFileSync('js/astronomical-observation-bridge.js', 'utf8');
  const serviceWorkerSource = fs.readFileSync('service-worker.js', 'utf8');
  const indexSource = fs.readFileSync('index.html', 'utf8');

  assert(!sessionSource.includes('webkitCompassHeading'),
    'Session must not use a hidden platform compass path.');
  assert(!sessionSource.includes('magneticDeclination'),
    'Session must not use magnetic declination.');
  assert(!sessionSource.includes('QT +'),
    'Session must not derive astronomical observation from QT.');
  assert(sessionSource.includes('observedQiblaBearingDeg'),
    'Session must map the aligned observed Qibla bearing.');
  assert(sessionSource.includes("alignmentMode:'astronomical-solved-bearing'"),
    'Session must record the solved Qibla bearing separately from camera heading.');
  assert(sessionSource.includes('observedQiblaBearingDeg:normalize360(reference)'),
    'Session must map the Qibla engine bearing into the astronomical Qibla field.');

  assert(bridgeSource.includes('QiblaAlignmentReticle'),
    'Observation bridge must use the Qibla alignment-reticle engine.');
  assert(bridgeSource.includes('astronomicalQiblaObservation'),
    'Bridge must publish the aligned astronomical observation.');
  assert(bridgeSource.includes('QIBLA_AXIS_NOT_ALIGNED'),
    'Bridge must reject captures outside the Qibla-axis target.');

  assert(storeSource.includes("rawFieldPath: 'result.qibla.qiblaBearingDeg'"),
    'Store must identify the Qibla engine bearing field.');
  assert(storeSource.includes("source: 'astronomical-qibla-solved-bearing'"),
    'Store provenance must identify the solved Qibla bearing.');
  assert(!storeSource.includes('Observed Qibla is exactly the solved heading'),
    'Store must not force camera heading to equal Qibla bearing.');
  assert(!storeSource.includes('sensorBiasDeg'),
    'Store must not construct Qibla from sensor bias.');

  assert(gatewaySource.includes("'js/qibla-alignment-reticle.js'"),
    'Production gateway must load the alignment engine before the bridge.');
  assert(gatewaySource.includes('record.observedQiblaBearingDeg'),
    'Application card update must use the observed Qibla bearing.');
  assert(!gatewaySource.includes('Number(record.qiblaBearingDeg).toFixed'),
    'Gateway must not display the old geodesic field.');

  assert(/const VERSION='qiblaastro-v5\.[^']+'/.test(serviceWorkerSource),
    'Service worker must identify a QiblaAstro cache generation.');
  assert(serviceWorkerSource.includes("'./js/astronomical-verification-session.js'"),
    'Service worker must cache the production verification session.');
  assert(serviceWorkerSource.includes("'./js/astronomical-verification-store.js'"),
    'Service worker must cache the production verification store.');
  assert(serviceWorkerSource.includes('isNavigation'),
    'Service worker must provide a dedicated navigation strategy.');
  assert(/networkFirst\(request,\s*APP_CACHE/.test(serviceWorkerSource),
    'Application JavaScript and CSS must remain network-first.');
  assert(!serviceWorkerSource.includes("'./js/camera-engine.js'"),
    'Retired camera engine must never be pre-cached.');
  assert(!serviceWorkerSource.includes("'./js/celestial-solver.js'"),
    'Retired celestial solver must never be pre-cached.');
  assert(!serviceWorkerSource.includes("'./js/tracking-lock.js'"),
    'Retired tracking-lock compatibility boundary must never be pre-cached.');

  assert(!indexSource.includes('<script src="js/camera-engine.js"></script>'),
    'Application HTML must not load the retired camera engine.');
  assert(!indexSource.includes('<script src="js/celestial-solver.js"></script>'),
    'Application HTML must not load the retired celestial solver.');

  await simulateCapture('manual');
  await simulateCapture('auto');

  const mapped = SessionModule.mapResult({
    accepted: true,
    trueCameraHeadingDeg: 135.72,
    qibla: { qiblaBearingDeg: 136.04 },
    astronomicalQiblaObservation: {
      source: 'astronomical-qibla-alignment-observation',
      observedQiblaBearingDeg: 135.72,
      referenceQiblaBearingDeg: 136.04,
      verificationOffsetDeg: 0.32,
      reticleResidualDeg: -0.08
    },
    quality: { overallScore: 0.82 },
    detection: { confidence: 0.88 },
    gravity: { quality: 0.91 },
    celestial: { azimuthDeg: 146.04, altitudeDeg: 32.55 }
  }, 'moon', { latitude: 30.12517, longitude: 31.13009 }, 'auto');

  assert(mapped, 'An aligned astronomical observation must map to production.');
  assert(near(mapped.headingDeg, 135.72), 'Solved camera heading must remain unchanged.');
  assert(near(mapped.observedQiblaBearingDeg, 135.72),
    'Observed astronomical Qibla must remain unchanged.');
  assert(near(mapped.referenceQiblaBearingDeg, 136.04),
    'Geodesic reference must remain separate.');
  assert(near(mapped.verificationOffsetDeg, 0.32),
    'Verification offset must remain separate.');

  const rawCameraObservation = SessionModule.mapResult({
    accepted: true,
    trueCameraHeadingDeg: 101.20,
    qibla: { qiblaBearingDeg: 136.04, relativeQiblaAngleDeg: 34.84 },
    quality: { overallScore: 0.78 },
    detection: { confidence: 0.81 },
    gravity: { quality: 0.86 },
    celestial: { azimuthDeg: 101.20, altitudeDeg: 30.0 }
  }, 'moon', { latitude: 30.12517, longitude: 31.13009 }, 'auto');
  assert.strictEqual(rawCameraObservation, null,
    'A camera heading or celestial azimuth without legal Qibla-axis alignment must be rejected.');

  const timestamp = Date.now();
  const record = Store.record({
    body: mapped.body,
    trueCameraHeadingDeg: mapped.headingDeg,
    observedQiblaBearingDeg: mapped.referenceQiblaBearingDeg,
    referenceQiblaBearingDeg: mapped.referenceQiblaBearingDeg,
    verificationOffsetDeg: mapped.verificationOffsetDeg,
    reticleResidualDeg: mapped.reticleResidualDeg,
    quality: mapped.quality,
    detectionConfidence: mapped.detectionConfidence,
    gravityQuality: mapped.gravityQuality,
    latitude: mapped.latitude,
    longitude: mapped.longitude,
    timestamp,
    captureMode: mapped.captureMode,
    alignmentMode: 'astronomical-solved-bearing'
  });

  assert(record, 'Aligned observation record must be created.');
  assert(near(record.observedQiblaBearingDeg, mapped.referenceQiblaBearingDeg),
    'Stored astronomical Qibla must be the solved Qibla bearing, not camera heading.');
  assert(near(record.referenceQiblaBearingDeg, 136.04),
    'Stored reference must remain independent.');
  assert(near(record.verificationOffsetDeg, 0.32),
    'Stored verification offset must remain independent.');
  assert.strictEqual(Object.prototype.hasOwnProperty.call(record, 'rawAstronomicalQiblaDeg'), false,
    'Canonical record must not expose the retired rawAstronomicalQiblaDeg alias.');
  assert.strictEqual(Object.prototype.hasOwnProperty.call(record, 'qiblaBearingDeg'), false,
    'Canonical record must not expose the retired qiblaBearingDeg alias.');
  assert.strictEqual(Object.prototype.hasOwnProperty.call(record, 'rawRelativeQiblaAngleDeg'), false,
    'Canonical record must not expose the retired rawRelativeQiblaAngleDeg alias.');
  assert.strictEqual(Object.prototype.hasOwnProperty.call(record, 'relativeQiblaAngleDeg'), false,
    'Canonical record must not expose the retired relativeQiblaAngleDeg alias.');

  const compatibility = Store.compatibilityVerification(record);
  assert(compatibility, 'Explicit compatibility adapter must remain available temporarily.');
  assert(near(compatibility.astroQibla, record.observedQiblaBearingDeg),
    'Compatibility adapter must point to the observed value without recalculation.');
  assert(near(compatibility.relativeQiblaAngleDeg, record.verificationOffsetDeg),
    'Compatibility adapter must point to the canonical verification offset.');

  const invalidLegacy = Store.createRecord({
    body: 'sun',
    trueCameraHeadingDeg: 121.11,
    qiblaDeg: 135.72,
    timestamp: timestamp + 1
  });
  assert.strictEqual(invalidLegacy, null,
    'Legacy qiblaDeg input must not create an astronomical observation.');

  const distinctSolvedBearing = Store.createRecord({
    body: 'sun',
    trueCameraHeadingDeg: 135.50,
    observedQiblaBearingDeg: 135.72,
    referenceQiblaBearingDeg: 136.04,
    verificationOffsetDeg: 0.32,
    alignmentMode: 'astronomical-solved-bearing'
  });
  assert(distinctSolvedBearing,
    'Solved Qibla bearing must remain valid when distinct from camera heading.');
  assert(near(distinctSolvedBearing.observedQiblaBearingDeg, 135.72),
    'Store must preserve the solved Qibla bearing independently.');
  assert(near(distinctSolvedBearing.trueCameraHeadingDeg, 135.50),
    'Store must preserve camera heading independently.');

  const valid = Store.getStatus({
    latitude: 30.12517,
    longitude: 31.13009,
    now: timestamp + 1000
  }, record);
  assert.strictEqual(valid.valid, true, 'Fresh nearby observation must remain valid.');

  Store.reset();
  assert.strictEqual(Store.getLast(), null, 'Reset must clear the record.');
  console.log('Canonical astronomical observation, capture and isolation tests passed.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
