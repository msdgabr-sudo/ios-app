'use strict';

const fs = require('fs');
const assert = require('assert');
const Detector = require('../js/celestial-detector.js');

const sessionSource = fs.readFileSync('js/astronomical-verification-session.js', 'utf8');

const sunProfile = {
  sampleStep: 2,
  minimumLuminance: 205,
  relativeThreshold: 0.88,
  minimumAreaRatio: 0.0000005,
  maximumAreaRatio: 0.18,
  minimumCircularity: 0.03,
  maximumEccentricity: 0.995,
  edgeMarginRatio: 0.015,
  minimumStableFrames: 3,
  historySize: 10,
  maximumFrameAgeMs: 2200,
  maximumCentroidSpreadPx: 24
};

const moonProfile = {
  sampleStep: 2,
  minimumLuminance: 185,
  relativeThreshold: 0.72,
  minimumAreaRatio: 0.000001,
  maximumAreaRatio: 0.04,
  minimumCircularity: 0.12,
  maximumEccentricity: 0.97,
  edgeMarginRatio: 0.025,
  minimumStableFrames: 5,
  historySize: 12,
  maximumFrameAgeMs: 1800,
  maximumCentroidSpreadPx: 14
};

function frame(width, height, background) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = background;
    data[i * 4 + 1] = background;
    data[i * 4 + 2] = background;
    data[i * 4 + 3] = 255;
  }
  return data;
}

function brightEllipse(data, width, height, cx, cy, rx, ry, value) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) {
        const i = (y * width + x) * 4;
        data[i] = data[i + 1] = data[i + 2] = value;
      }
    }
  }
}

const width = 320;
const height = 240;
const data = frame(width, height, 22);
// A deliberately large saturated solar core/flare (~10% of frame area),
// representative of a phone camera pointed toward the Sun.
brightEllipse(data, width, height, 160, 120, 70, 35, 255);

const sun = Detector.analyzeFrame(data, width, height, Object.assign({ timestamp: 1000 }, sunProfile));
const moon = Detector.analyzeFrame(data, width, height, Object.assign({ timestamp: 1000 }, moonProfile));

assert.strictEqual(sun.found, true,
  'Sun profile must accept a large saturated solar core/flare that is centered in the frame.');
assert(sun.areaRatio > 0.04 && sun.areaRatio < 0.18,
  'Synthetic solar flare must exercise the Sun-only area window.');
assert.strictEqual(moon.found, false,
  'Moon profile must not classify the same large solar flare as the Moon.');
assert.strictEqual(moon.reason, 'candidate-too-large',
  'Moon rejection must occur at the intended compact-disc area boundary.');

for (const token of [
  'maximumAreaRatio: 0.18',
  'minimumCircularity: 0.03',
  'maximumEccentricity: 0.995',
  'minimumStableFrames: 3',
  "var isSun = this.body === 'sun'"
]) {
  assert(sessionSource.includes(token), 'Production Session must retain Sun profile token: ' + token);
}

console.log('ASTRONOMICAL SUN DETECTOR PROFILE: PASS');
