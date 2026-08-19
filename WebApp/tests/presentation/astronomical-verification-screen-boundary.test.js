'use strict';
const fs = require('fs');
const assert = require('assert');

const index = fs.readFileSync('index.html','utf8');
const compass = fs.readFileSync('pages/compass.html','utf8');
const gateway = fs.readFileSync('js/astro-verification.js','utf8');
const ui = fs.readFileSync('js/astronomical-observatory-ui.js','utf8');
const css = fs.readFileSync('css/28-astronomical-observatory.css','utf8');

// The verification screen must never return as inline application HTML.
['camera-overlay','astro-verify-modal','verify-instructions','camera-video','camera-canvas'].forEach(id => {
  assert(!index.includes(`id="${id}"`), `legacy verification DOM leaked into index.html: ${id}`);
});
assert(!index.includes('qa-observatory__video'), 'Observatory presentation must not be embedded in index.html.');

// The compass page exposes one launcher card only. It must not calculate or own the camera flow.
assert(compass.includes('id="astro-body-card"'), 'Astronomical verification launcher card is missing.');
assert(!/id="astro-body-card"[^>]*onclick=/i.test(compass), 'Launcher card must not contain inline verification logic.');
['getUserMedia','AstronomicalSolver','VerificationSession','recordVerification','startProductionVerification'].forEach(token => {
  assert(!compass.includes(token), `compass presentation crossed verification boundary: ${token}`);
});

// Gateway is the single production entry point and delegates to the protected stack.
assert(gateway.includes("closest('#astro-body-card')"), 'Gateway must own launcher-card click binding.');
assert(gateway.includes('applicationLauncher'), 'Gateway launcher is missing.');
assert(gateway.includes('startProductionVerification'), 'Production verification entry is missing.');
assert(gateway.includes("var STACK_CSS = 'css/28-astronomical-observatory.css'"), 'Gateway must own observatory CSS loading.');
[
  'astronomical-observation-bridge.js',
  'astronomical-observatory-ui.js',
  'astronomical-verification-store.js',
  'astronomical-verification-session.js'
].forEach(file => assert(gateway.includes(file), `Gateway stack missing ${file}`));
assert(gateway.includes('horizontalFovDeg') && gateway.includes(': 65'), 'Canonical 65° horizontal FOV default must remain in gateway.');
assert(gateway.includes('alignmentToleranceDeg') && gateway.includes(': 1'), 'Canonical 1° alignment tolerance must remain in gateway.');

// Observatory controller is presentation: it receives measurements and emits callbacks.
assert(ui.includes('Pure production UI layer. It does not calculate astronomical direction.'), 'Observatory UI presentation declaration is missing.');
assert(ui.includes('ObservatoryUI.prototype.update=function(data)'), 'Observatory UI must consume externally produced measurements.');
assert(ui.includes('this.onManualCapture') && ui.includes('this.onAutoCapture') && ui.includes('this.onAccept'), 'Observatory UI callback contract is incomplete.');
['AstronomicalSolver','AstroQiblaEngine','.record(','observedQiblaBearingDeg =','verificationOffsetDeg ='].forEach(token => {
  assert(!ui.includes(token), `Observatory UI must not calculate/write scientific state: ${token}`);
});

assert(css.includes('.qa-observatory'), 'Astronomical observatory stylesheet is missing.');
assert(css.includes('.qa-observatory__video'), 'Camera presentation selector is missing.');
assert(css.includes('.qa-observatory__result'), 'Verification result presentation selector is missing.');

console.log('PASS astronomical verification screen / scientific engine boundary');
