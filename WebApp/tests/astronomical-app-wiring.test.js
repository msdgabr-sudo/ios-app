'use strict';

const fs = require('fs');
const assert = require('assert');

const source = fs.readFileSync('js/astro-verification.js', 'utf8');
const providerSource = fs.readFileSync('js/position-provider.js', 'utf8');
const traceSource = fs.readFileSync('js/astronomical-trace.js', 'utf8');
const serviceWorkerSource = fs.readFileSync('service-worker.js', 'utf8');
const legacyCameraSource = fs.readFileSync('js/camera-engine.js', 'utf8');
const legacySolverSource = fs.readFileSync('js/celestial-solver.js', 'utf8');
const cardsSource = fs.readFileSync('js/compass-cards.js', 'utf8');

const requiredAssets = [
  'css/28-astronomical-observatory.css',
  'js/astronomical-trace.js',
  'js/position-provider.js',
  'js/coordinate-frames.js',
  'js/world-orientation.js',
  'js/camera-projection.js',
  'js/camera-pose.js',
  'js/gravity-reference.js',
  'js/astro-qibla-engine.js',
  'js/verification-quality.js',
  'js/celestial-detector.js',
  'js/astronomical-solver.js',
  'js/qibla-alignment-reticle.js',
  'js/astronomical-observation-bridge.js',
  'js/astronomical-observatory-ui.js',
  'js/astronomical-verification-store.js',
  'js/astronomical-verification-session.js'
];

for (const asset of requiredAssets) {
  assert(source.includes(asset), `Missing production asset loader entry: ${asset}`);
}

assert(source.indexOf('js/astronomical-trace.js') < source.indexOf('js/position-provider.js'), 'Trace must initialize before production observations begin.');
assert(source.indexOf('js/position-provider.js') < source.indexOf('js/astronomical-verification-session.js'), 'Raw position provider must load before the verification session.');
assert(source.includes('QiblaPositionProvider.request'), 'Astronomical verification must request a raw GNSS fix from the independent provider.');
assert(source.includes('requestRawPosition'), 'Raw GNSS acquisition stage is missing.');
assert(source.includes('startProductionVerification'), 'Production session launcher is missing.');
assert(source.includes('installApplicationLauncher'), 'Application button override is missing.');
assert(source.includes("root.addEventListener('load'"), 'Launcher must be restored after all inline glue loads.');
assert(source.includes("addEventListener('click'"), 'Capture-phase application card interceptor is missing.');
assert(source.includes("closest('#astro-body-card')"), 'Astronomical card interceptor is not targeted correctly.');
assert(source.includes('stopImmediatePropagation'), 'Legacy click handlers are not blocked.');
assert(!source.includes('_legacyLauncher'), 'Legacy astronomical fallback must not remain active.');
assert(!source.includes('production-session-managed'), 'Internal production-session code must not be user-visible.');
assert(source.includes('QiblaAstronomicalVerificationSession.VerificationSession'), 'Production session constructor is not wired.');
assert(source.includes('QiblaAstronomicalVerificationStore.getLast'), 'Independent verification store is not exposed.');
assert(source.includes("onClosed: function (reason)"), 'Back/close session handling is missing.');
assert(source.includes("reason !== 'accepted'"), 'Accepted result close handling is missing.');
assert(source.includes('updateAppCards(record)'), 'Application cards are not updated after acceptance.');

assert(source.includes("traceApi.begin"), 'A fresh immutable trace must start for every production observation.');
assert(source.includes("traceAdd('location.acquired'"), 'Raw location stage must be traced.');
assert(source.includes("traceAdd('celestial.position'"), 'Celestial position stage must be traced.');
assert(source.includes("value.accepted(record)"), 'Accepted measurement record must be traced.');
assert(source.includes("traceAdd('display.cards-written'"), 'Final displayed values must be traced.');
assert(source.includes('exportTraceJson'), 'Production API must expose trace JSON export.');
assert(traceSource.includes('observedQiblaBearingDeg'), 'Trace must preserve the observed astronomical bearing.');
assert(traceSource.includes('referenceQiblaBearingDeg'), 'Trace must preserve the separate geographical reference.');
assert(traceSource.includes('verificationOffsetDeg'), 'Trace must preserve the verification offset.');
assert(serviceWorkerSource.includes("'./js/astronomical-trace.js'"), 'Trace must be available offline with the production pipeline.');

const productionSection = source.slice(source.indexOf('async function startProductionVerification'));
assert(!productionSection.includes('root.LAT'), 'Astronomical verification must not read computational-system LAT globals.');
assert(!productionSection.includes('root.LON'), 'Astronomical verification must not read computational-system LON globals.');
assert(!productionSection.includes('deviceHeading'), 'Production launcher must not use device heading.');
assert(!productionSection.includes('webkitCompassHeading'), 'Production launcher must not use compass heading.');
assert(!productionSection.includes('magneticDeclination'), 'Production launcher must not use magnetic declination.');
assert(!productionSection.includes('QT +'), 'Production launcher must not derive Qibla from QT.');

assert(providerSource.includes('navigator.geolocation.getCurrentPosition'), 'Raw position provider must acquire device geolocation directly.');
assert(!providerSource.includes('calcQibla'), 'Raw position provider must not calculate Qibla.');
assert(!providerSource.includes('deviceHeading'), 'Raw position provider must not read compass heading.');
assert(!providerSource.includes('QT'), 'Raw position provider must not know the computational Qibla result.');

assert(legacyCameraSource.includes('legacy-camera-engine-retired'), 'Legacy CameraEngine must be retired.');
assert(legacyCameraSource.includes('QiblaAstronomicalVerificationSession'), 'Legacy CameraEngine must identify the production owner.');
assert(!legacyCameraSource.includes('getUserMedia'), 'Legacy CameraEngine must not access the camera.');
assert(!legacyCameraSource.includes('findBrightestRegion'), 'Legacy CameraEngine must not detect celestial bodies.');
assert(!legacyCameraSource.includes('trueCameraHeading'), 'Legacy CameraEngine must not calculate a heading.');

assert(legacySolverSource.includes('legacy-celestial-solver-retired'), 'Legacy CelestialSolver must be retired.');
assert(legacySolverSource.includes('QiblaAstronomicalSolver'), 'Legacy CelestialSolver must identify the production owner.');
assert(!legacySolverSource.includes('findCentroid'), 'Legacy CelestialSolver must not detect centroids.');
assert(!legacySolverSource.includes('cameraRayFromCentroid'), 'Legacy CelestialSolver must not project camera rays.');
assert(!legacySolverSource.includes('qiblaVector'), 'Legacy CelestialSolver must not contain a Qibla equation.');
assert(!legacySolverSource.includes('trueCameraHeading'), 'Legacy CelestialSolver must not calculate camera heading.');

assert.strictEqual(fs.existsSync('js/confidence-engine.js'), false, 'Retired confidence engine must be deleted.');
assert(cardsSource.includes('QiblaAstronomicalVerificationStore'), 'Compass cards must read the independent store.');
assert(!cardsSource.includes('verification.astroQibla'), 'Compass cards must not read legacy astroQibla.');

console.log('Astronomical application wiring and trace tests passed.');
