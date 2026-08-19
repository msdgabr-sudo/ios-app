'use strict';
const fs=require('fs');

const sessionPath='js/astronomical-verification-session.js';
let session=fs.readFileSync(sessionPath,'utf8');
const old="      alignmentMode: 'qibla-axis',";
const neu="      alignmentMode: result.alignmentMode || 'astronomical-solved-bearing',";
if(!session.includes(old)) throw new Error('accept() alignmentMode mismatch pattern not found');
session=session.replace(old,neu);
fs.writeFileSync(sessionPath,session);

const swPath='service-worker.js';
let sw=fs.readFileSync(swPath,'utf8');
sw=sw.replace(/Service Worker v[0-9.]+/,'Service Worker v5.15');
sw=sw.replace(/const VERSION = '[^']+';/,"const VERSION = 'qiblaastro-v5.15-record-contract-fix';");
fs.writeFileSync(swPath,sw);

console.log('Verification session/store recording contract repaired.');
