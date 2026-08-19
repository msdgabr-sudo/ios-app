'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const normalizeLocal = (p) => String(p || '').replace(/^\.\//, '').split(/[?#]/)[0];
const isLocalRef = (p) => {
  const value = String(p || '').trim();
  return value && !/^(?:https?:|data:|blob:|mailto:|tel:|#|\/\/)/i.test(value);
};

const requiredFiles = [
  'index.html',
  'manifest.json',
  'site.webmanifest',
  'service-worker.js',
  'offline.html',
  '.nojekyll',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
  'icons/maskable/icon-maskable-192x192.png',
  'icons/maskable/icon-maskable-512x512.png'
];

const missingRequired = requiredFiles.filter((file) => !exists(file));
assert.deepStrictEqual(missingRequired, [],
  `Required production files are missing: ${missingRequired.join(', ')}`);

const manifest = JSON.parse(read('manifest.json'));
const webmanifest = JSON.parse(read('site.webmanifest'));
const index = read('index.html');
const sw = read('service-worker.js');

assert.deepStrictEqual(webmanifest, manifest,
  'manifest.json and site.webmanifest must remain identical while both are shipped.');
assert.strictEqual(manifest.start_url, './index.html',
  'PWA start_url must remain repository/domain portable.');
assert.strictEqual(manifest.scope, './',
  'PWA scope must remain relative to this standalone deployment.');
assert.strictEqual(manifest.display, 'standalone',
  'PWA display mode must be standalone.');
assert(typeof manifest.id === 'string' && manifest.id.startsWith('./'),
  'PWA id must remain relative to the standalone deployment.');
assert(Array.isArray(manifest.icons) && manifest.icons.length >= 2,
  'PWA manifest must declare icons.');

const missingManifestAssets = [];
for (const icon of manifest.icons) {
  assert(icon && typeof icon.src === 'string' && !icon.src.startsWith('/'),
    `Manifest icon must use a relative URL: ${icon && icon.src}`);
  const local = normalizeLocal(icon.src);
  if (!exists(local)) missingManifestAssets.push(local);
}
for (const shot of manifest.screenshots || []) {
  assert(shot && typeof shot.src === 'string' && !shot.src.startsWith('/'),
    `Manifest screenshot must use a relative URL: ${shot && shot.src}`);
  const local = normalizeLocal(shot.src);
  if (!exists(local)) missingManifestAssets.push(local);
}
for (const shortcut of manifest.shortcuts || []) {
  assert(shortcut && typeof shortcut.url === 'string' && shortcut.url.startsWith('./'),
    `Shortcut URL must be relative to this deployment: ${shortcut && shortcut.url}`);
  for (const icon of shortcut.icons || []) {
    const local = normalizeLocal(icon.src);
    if (!exists(local)) missingManifestAssets.push(local);
  }
}
assert.deepStrictEqual([...new Set(missingManifestAssets)], [],
  `Manifest references missing local assets: ${[...new Set(missingManifestAssets)].join(', ')}`);

assert(/<link\s+rel=["']manifest["'][^>]+href=["']manifest\.json["']/i.test(index),
  'index.html must link the primary manifest.json.');
assert(index.includes("navigator.serviceWorker.register('service-worker.js'"),
  'index.html must register the local service worker.');
assert(index.includes("scope: './'"),
  'Service worker registration scope must remain relative.');
assert(sw.includes("const OFFLINE_URL='./offline.html'"),
  'Service worker offline fallback must remain local and relative.');

/* Validate local resources directly referenced by the HTML entrypoint. This
   catches broken icons, splash screens, stylesheets and scripts before an APK
   package is generated. */
const entrypointRefs = [];
const attrPattern = /<(?:link|script)\b[^>]*?\b(?:href|src)=["']([^"']+)["'][^>]*>/gi;
let entryMatch;
while ((entryMatch = attrPattern.exec(index)) !== null) {
  if (!isLocalRef(entryMatch[1])) continue;
  const local = normalizeLocal(entryMatch[1]);
  if (local) entrypointRefs.push(local);
}
const missingEntrypointAssets = [...new Set(entrypointRefs.filter((file) => !exists(file)))];
assert.deepStrictEqual(missingEntrypointAssets, [],
  `index.html references missing local assets: ${missingEntrypointAssets.join(', ')}`);

/* A single missing file in the offline shell creates an incomplete first-run
   cache. Validate every literal local asset declared in APP_SHELL. */
const shellMatch = sw.match(/const\s+APP_SHELL\s*=\s*\[([\s\S]*?)\];/);
assert(shellMatch, 'Service worker must declare APP_SHELL.');
const shellLiteralPattern = /(['"])(\.\/[^'"\n]+)\1/g;
const shellAssets = [];
let match;
while ((match = shellLiteralPattern.exec(shellMatch[1])) !== null) {
  const local = normalizeLocal(match[2]);
  if (local) shellAssets.push(local);
}
const missingShellAssets = [...new Set(shellAssets.filter((file) => !exists(file)))];
assert.deepStrictEqual(missingShellAssets, [],
  `Service-worker APP_SHELL references missing files: ${missingShellAssets.join(', ')}`);

const runtimeCritical = [
  ['manifest.json', read('manifest.json')],
  ['site.webmanifest', read('site.webmanifest')],
  ['index.html', index],
  ['service-worker.js', sw],
  ['offline.html', read('offline.html')]
];
const forbiddenLegacyRefs = [
  '/qibla-astro/',
  'msdgabr-sudo/qibla-astro',
  'qiblaastro.github.io'
];
for (const [file, source] of runtimeCritical) {
  for (const legacy of forbiddenLegacyRefs) {
    assert(!source.toLowerCase().includes(legacy.toLowerCase()),
      `Legacy deployment reference found in ${file}: ${legacy}`);
  }
}

console.log('PWA STANDALONE READINESS: PASS');
console.log(`Required files: ${requiredFiles.length}`);
console.log(`Manifest icons: ${manifest.icons.length}`);
console.log(`Manifest screenshots: ${(manifest.screenshots || []).length}`);
console.log(`Manifest shortcuts: ${(manifest.shortcuts || []).length}`);
console.log(`Entrypoint local assets verified: ${new Set(entrypointRefs).size}`);
console.log(`Service-worker literal APP_SHELL assets verified: ${new Set(shellAssets).size}`);
