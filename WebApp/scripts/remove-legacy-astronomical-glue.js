'use strict';

const fs = require('fs');
const path = require('path');

const indexPath = path.resolve(process.cwd(), 'index.html');
let source = fs.readFileSync(indexPath, 'utf8');
const original = source;

function removeExactScript(src, file) {
  const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return src.replace(new RegExp('\\n?<script\\s+src=["\\\']' + escaped + '["\\\']><\\/script>\\s*', 'g'), '\n');
}

source = removeExactScript(source, 'js/celestial-solver.js');
source = removeExactScript(source, 'js/camera-engine.js');

source = source.replace(
  /\n  \/\/ ── 2\) بدء\/متابعة تدفّق التحقق الفلكي[\s\S]*?(?=\n  \/\/ ── 3\) التتبّع)/,
  '\n  // ── 2) التحقق الفلكي تديره المنظومة الإنتاجية المستقلة فقط ──\n'
);

source = source.replace(
  /(id=["']astro-body-card["'])\s+onclick=["']_qiblaStartAstroVerification\(\)["']/g,
  '$1'
);

const forbidden = [
  'js/celestial-solver.js',
  'js/camera-engine.js',
  'window.CameraEngine',
  'window.CelestialSolver',
  'function _qiblaShowInstructionsOverlay',
  'window._qiblaStartAstroVerification = function'
];

for (const token of forbidden) {
  if (source.includes(token)) {
    throw new Error('Legacy astronomical token remains in index.html: ' + token);
  }
}

if (!source.includes('id="astro-body-card"') && !source.includes("id='astro-body-card'")) {
  throw new Error('Astronomical card was accidentally removed.');
}

if (source === original) {
  console.log('index.html is already clean; no changes required.');
  process.exit(0);
}

fs.writeFileSync(indexPath, source, 'utf8');
console.log('Removed legacy astronomical camera/solver glue from index.html.');
