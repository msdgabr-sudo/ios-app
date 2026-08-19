'use strict';

// One-shot structural refactor for branch new. Extracts code byte-for-byte; no algorithm changes.
// Triggered intentionally after protected-core freeze; this comment has no runtime effect.
const fs = require('fs');

const indexPath = 'index.html';
const swPath = 'service-worker.js';
const appRuntimePath = 'js/app-runtime.js';
const pwaRuntimePath = 'js/pwa-runtime.js';

let html = fs.readFileSync(indexPath, 'utf8');

function extractScriptBetween(markerStart, markerEnd, outputPath, replacementSrc) {
  const markerIndex = html.indexOf(markerStart);
  if (markerIndex < 0) throw new Error(`Missing marker: ${markerStart}`);
  const endMarkerIndex = html.indexOf(markerEnd, markerIndex);
  if (endMarkerIndex < 0) throw new Error(`Missing end marker: ${markerEnd}`);

  const openIndex = html.indexOf('<script', markerIndex);
  if (openIndex < 0 || openIndex > endMarkerIndex) throw new Error(`No script found after ${markerStart}`);
  const openEnd = html.indexOf('>', openIndex);
  if (openEnd < 0 || openEnd > endMarkerIndex) throw new Error('Malformed script opening tag');
  const closeIndex = html.indexOf('</script>', openEnd);
  if (closeIndex < 0 || closeIndex > endMarkerIndex) throw new Error(`No closing script before ${markerEnd}`);

  const openingTag = html.slice(openIndex, openEnd + 1);
  if (/\bsrc\s*=/.test(openingTag)) throw new Error(`Expected inline script after ${markerStart}, found src script`);

  const body = html.slice(openEnd + 1, closeIndex).replace(/^\s*\n?/, '').replace(/\s*$/, '') + '\n';
  if (body.length < 100) throw new Error(`Refusing to extract suspiciously small script from ${markerStart}`);
  fs.writeFileSync(outputPath, body, 'utf8');

  const replacement = `<script src="${replacementSrc}"></script>`;
  html = html.slice(0, openIndex) + replacement + html.slice(closeIndex + '</script>'.length);
}

extractScriptBetween(
  '<!-- SECTION R-ZZ: ALL JAVASCRIPT',
  '<!-- QIBLA MULTI-REFERENCE VERIFICATION SYSTEM',
  appRuntimePath,
  'js/app-runtime.js'
);

extractScriptBetween(
  '<!-- SERVICE WORKER REGISTRATION',
  '<!-- END SERVICE WORKER REGISTRATION',
  pwaRuntimePath,
  'js/pwa-runtime.js'
);

fs.writeFileSync(indexPath, html, 'utf8');

let sw = fs.readFileSync(swPath, 'utf8');
const assets = ["'./js/app-runtime.js'", "'./js/pwa-runtime.js'"];
for (const asset of assets) {
  if (!sw.includes(asset)) {
    const anchor = "  './js/qibla-card-runtime.js', './js/home-final.js', './js/compass-cards.js',";
    if (!sw.includes(anchor)) throw new Error('Service worker APP_SHELL anchor not found');
    sw = sw.replace(anchor, `${anchor}\n  ${asset},`);
  }
}

sw = sw.replace(/QiblaAstro Service Worker v[^\n]*/, 'QiblaAstro Service Worker v5.38');
sw = sw.replace(/const VERSION = '[^']+';/, "const VERSION = 'qiblaastro-v5.38-modular-index';");
fs.writeFileSync(swPath, sw, 'utf8');

const reduced = fs.statSync(indexPath).size;
const appSize = fs.statSync(appRuntimePath).size;
const pwaSize = fs.statSync(pwaRuntimePath).size;
console.log(JSON.stringify({ reducedIndexBytes: reduced, appRuntimeBytes: appSize, pwaRuntimeBytes: pwaSize }, null, 2));
