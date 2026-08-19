#!/usr/bin/env node
'use strict';

// Shadow extraction only: this script NEVER rewrites index.html or protected runtime.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');
const OUT = path.join(ROOT, 'pages');

const TARGETS = [
  { id: 'page-quran', file: 'quran.html' },
  { id: 'page-azkar', file: 'azkar.html' },
  { id: 'page-serenity', file: 'serenity.html' }
];

// Absolute safety barrier: extracted presentation pages must never contain
// the astronomical verification/camera core or its protected contracts.
const FORBIDDEN = [
  'QiblaAstronomicalSolver',
  'QiblaAstronomicalVerificationSession',
  'QiblaAstronomicalVerificationStore',
  'QiblaAstronomicalObservationBridge',
  'QiblaCameraProjection',
  'QiblaCameraPose',
  'QiblaGravityReference',
  'QiblaCelestialDetector',
  'getUserMedia',
  'MediaStream',
  'trueCameraHeadingDeg',
  'observedQiblaBearingDeg',
  'verificationOffsetDeg',
  'targetAzDeg',
  'targetAltDeg',
  'rawEquationLocked',
  'startVerification'
];

function sha256(s){
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

function findMatchingDiv(html, startIndex){
  const tagRe = /<\/?div\b[^>]*>/gi;
  tagRe.lastIndex = startIndex;
  let depth = 0;
  let first = true;
  let m;
  while ((m = tagRe.exec(html))) {
    const token = m[0];
    const closing = /^<\/div/i.test(token);
    if (first) {
      if (closing) throw new Error('Expected opening div at extraction start');
      first = false;
      depth = 1;
      continue;
    }
    depth += closing ? -1 : 1;
    if (depth === 0) return tagRe.lastIndex;
  }
  throw new Error('Unbalanced div tree');
}

function extractPage(html, id){
  const marker = new RegExp('<div\\b[^>]*\\bid=["\\\']' + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '["\\\'][^>]*>', 'i');
  const match = marker.exec(html);
  if (!match) throw new Error('Page not found: ' + id);
  const start = match.index;
  const end = findMatchingDiv(html, start);
  return html.slice(start, end);
}

function listIds(s){
  return [...s.matchAll(/\bid=["']([^"']+)["']/gi)].map(m => m[1]).sort();
}

function listHandlers(s){
  return [...s.matchAll(/\bon[a-z]+=["']([^"']*)["']/gi)].map(m => m[0]).sort();
}

const index = fs.readFileSync(INDEX, 'utf8');
fs.mkdirSync(OUT, { recursive: true });

const report = {
  generatedAt: new Date().toISOString(),
  indexSha256: sha256(index),
  runtimeModified: false,
  pages: []
};

for (const target of TARGETS) {
  const page = extractPage(index, target.id);
  const hit = FORBIDDEN.find(token => page.includes(token));
  if (hit) throw new Error(target.id + ' contains protected token: ' + hit);

  const ids = listIds(page);
  if (!ids.includes(target.id)) throw new Error('Root page ID missing: ' + target.id);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate IDs inside extracted page: ' + target.id);

  const outputPath = path.join(OUT, target.file);
  fs.writeFileSync(outputPath, page + '\n', 'utf8');

  // Byte-for-byte verification against the source slice (apart from the final newline).
  const written = fs.readFileSync(outputPath, 'utf8').replace(/\n$/, '');
  if (written !== page) throw new Error('Byte verification failed: ' + target.file);

  report.pages.push({
    id: target.id,
    file: 'pages/' + target.file,
    bytes: Buffer.byteLength(page, 'utf8'),
    lines: page.split(/\r?\n/).length,
    sha256: sha256(page),
    ids: ids.length,
    inlineHandlers: listHandlers(page).length,
    protectedTokenHit: null
  });
}

const reportDir = path.join(ROOT, 'reports');
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'safe-page-shadow-extraction.json'), JSON.stringify(report, null, 2) + '\n');

let md = '# Safe Page Shadow Extraction\n\n';
md += `Generated: ${report.generatedAt}\n\n`;
md += `- index.html SHA-256 before extraction: \`${report.indexSha256}\`\n`;
md += '- Runtime modified: **NO**\n';
md += '- Protected astronomical/camera core modified: **NO**\n\n';
md += '| Page | File | Size | Lines | IDs | Inline handlers | SHA-256 |\n';
md += '|---|---|---:|---:|---:|---:|---|\n';
for (const p of report.pages) {
  md += `| ${p.id} | ${p.file} | ${p.bytes} B | ${p.lines} | ${p.ids} | ${p.inlineHandlers} | \`${p.sha256}\` |\n`;
}
fs.writeFileSync(path.join(reportDir, 'safe-page-shadow-extraction.md'), md);
console.log(md);
