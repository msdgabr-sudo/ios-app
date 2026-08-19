#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const cases = [
  {
    name: 'quran', path: 'pages/quran.html', root: 'page-quran',
    ids: ['page-quran','qr-list-view','qr-reader-view','qr-surah-list','qr-search','qr-surah-title','qr-ayahs','qr-font-size','qr-bookmark-btn']
  },
  {
    name: 'azkar', path: 'pages/azkar.html', root: 'page-azkar',
    ids: ['page-azkar','az-categories-screen','az-reading-screen','az-reading-title','zk-pf','zk-pt','zs-sabah','zs-masa','zs-nawm','zs-fajr','zs-salah','zs-duaa']
  },
  {
    name: 'serenity', path: 'pages/serenity.html', root: 'page-serenity',
    ids: ['page-serenity','sk-canvas','sk-track-list','sk-now-title','sk-now-sub','sk-progress','sk-current','sk-duration','sk-play-btn']
  }
];

const forbidden = [
  'astronomical-solver','astro-verification','astronomical-verification-session',
  'astronomical-verification-store','astronomical-observation-bridge',
  'camera-pose','camera-projection','celestial-detector','gravity-reference',
  'getUserMedia','MediaStream','trueCameraHeadingDeg','verificationOffsetDeg',
  'observedQiblaBearingDeg','targetAzDeg','targetAltDeg','QiblaAstronomicalSolver'
];

let failed = 0;
function assert(ok, message) {
  if (ok) console.log('PASS:', message);
  else { console.error('FAIL:', message); failed++; }
}

for (const item of cases) {
  const html = fs.readFileSync(path.join(ROOT, item.path), 'utf8');
  assert(new RegExp('id=["\\\']' + item.root + '["\\\']').test(html), item.name + ' root exists');
  for (const id of item.ids) {
    assert(new RegExp('id=["\\\']' + id + '["\\\']').test(html), item.name + ' preserves #' + id);
  }
  for (const token of forbidden) {
    assert(!html.includes(token), item.name + ' excludes protected token ' + token);
  }
}

if (failed) {
  console.error('\nSAFE PAGE CONTRACTS: FAIL (' + failed + ')');
  process.exit(1);
}
console.log('\nSAFE PAGE CONTRACTS: PASS');
