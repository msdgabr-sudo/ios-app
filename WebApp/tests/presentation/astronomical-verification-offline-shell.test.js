/* QiblaAstro — Astronomical verification offline-shell contract
 * Ensures every dynamically loaded production verification module and HUD CSS
 * is precached by the Service Worker. Presentation/PWA guard only.
 * © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
 */
'use strict';
const fs=require('fs');
const assert=require('assert');

const gateway=fs.readFileSync('js/astro-verification.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

const stackBlock=gateway.match(/var STACK_SCRIPTS = Object\.freeze\(\[([\s\S]*?)\]\);/);
assert(stackBlock,'STACK_SCRIPTS not found in astro-verification.js');
const scripts=[...stackBlock[1].matchAll(/'([^']+\.js)'/g)].map(m=>m[1]);
assert(scripts.length>=10,'Unexpectedly small astronomical verification stack');

for(const script of scripts){
  assert(sw.includes("'./"+script+"'"),`Service Worker APP_SHELL missing ${script}`);
}

const cssMatch=gateway.match(/var STACK_CSS = '([^']+)'/);
assert(cssMatch,'STACK_CSS not found in astro-verification.js');
assert(sw.includes("'./"+cssMatch[1]+"'"),`Service Worker APP_SHELL missing ${cssMatch[1]}`);

assert(sw.includes("qiblaastro-v5.55-astronomical-verification-offline"),'Astronomical verification cache version not active');
console.log(`PASS: ${scripts.length} astronomical verification modules + HUD CSS are precached.`);
