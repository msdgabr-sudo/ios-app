'use strict';
const fs=require('fs');
const assert=require('assert');
const s=fs.readFileSync('js/astronomical-verification-session.js','utf8');
assert(s.includes("state === 'CAPTURED' || state === 'RESULT'"),'CAPTURED/RESULT must finalize capture.');
assert(!s.includes('captureSeen && frozen && !ui.captureInProgress'),'Finalization must not wait for the later is-frozen result class.');
assert(s.includes("const VERSION = 'qiblaastro-v5.14-capture-finalization-fix'") || fs.readFileSync('service-worker.js','utf8').includes("const VERSION = 'qiblaastro-v5.14-capture-finalization-fix'"),'Service worker generation must change.');
console.log('CAPTURE FINALIZATION DEADLOCK: PASS');
