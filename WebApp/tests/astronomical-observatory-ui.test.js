'use strict';

const fs = require('fs');
const assert = require('assert');

const jsPath = 'js/astronomical-observatory-ui.js';
const cssPath = 'css/28-astronomical-observatory.css';
const js = fs.readFileSync(jsPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');

const requiredJsContracts = [
  'QiblaAstronomicalObservatoryUI',
  'ObservatoryUI.prototype.open',
  'ObservatoryUI.prototype.close',
  'ObservatoryUI.prototype.update',
  'ObservatoryUI.prototype.setMode',
  'ObservatoryUI.prototype.requestManualCapture',
  'ObservatoryUI.prototype.requestAutoCapture',
  'ObservatoryUI.prototype._beginCapture',
  'ObservatoryUI.prototype.showResult',
  'ObservatoryUI.prototype.retry',
  'qa-observatory__back',
  'qa-observatory__shutter',
  'qa-observatory__lens',
  'qa-observatory__countdown',
  'qa-observatory__result'
];

for (const contract of requiredJsContracts) {
  assert(js.includes(contract), `Missing observatory UI contract: ${contract}`);
}

const requiredCssContracts = [
  '.qa-observatory',
  '.qa-observatory__grid',
  '.qa-observatory__astro-ring',
  '.qa-observatory__target',
  '.qa-observatory__lens',
  '.qa-observatory__shutter',
  '.qa-observatory__boot',
  '.qa-observatory__result',
  '@media(prefers-reduced-motion:reduce)'
];

for (const contract of requiredCssContracts) {
  assert(css.includes(contract), `Missing observatory CSS contract: ${contract}`);
}

assert(!js.includes('DeviceOrientationEvent'), 'UI layer must not read compass/orientation sensors.');
assert(!js.includes('webkitCompassHeading'), 'UI layer must remain compass-free.');
assert(js.includes('this.onManualCapture'), 'Manual capture callback is missing.');
assert(js.includes('this.onAutoCapture'), 'Automatic capture callback is missing.');
assert(js.includes('this.onBack'), 'Back action callback is missing.');
assert(js.includes('_freezeFrame'), 'Frame freeze contract is missing.');
assert(js.includes("await this._beginCapture('manual')"), 'Manual capture must freeze the frame before notifying the session.');
assert(js.includes("await this._beginCapture('auto')"), 'Automatic capture must freeze the frame before notifying the session.');
assert(js.includes("this.state=frozen?'CAPTURED':'TRACKING'"), 'A successfully frozen camera frame must enter CAPTURED state.');
assert(js.includes('if(frozen)this.onManualCapture'), 'Manual callback must run only after a real frozen frame exists.');
assert(js.includes('if(frozen)this.onAutoCapture'), 'Automatic callback must run only after a real frozen frame exists.');

console.log('Astronomical observatory UI capture-order contract tests passed.');
