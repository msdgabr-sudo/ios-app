'use strict';

const fs=require('fs');
const crypto=require('crypto');

const html=fs.readFileSync('index.html','utf8');
const scripts=[];
const re=/<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
let m;
while((m=re.exec(html))){
  if(!/\bsrc\s*=/.test(m[1]||'')) scripts.push(m[2]||'');
}

if(scripts.length<1) throw new Error('No inline runtime found; contract cannot be verified.');
function sha(s){return crypto.createHash('sha256').update(s).digest('hex');}

const SENSITIVE='7fb224ee49d39decc877f0785871a29d4c7306310de0045a2915c3f1e9de80f2';
const sensitive=scripts.find(body=>sha(body)===SENSITIVE);
if(!sensitive){
  throw new Error('Sensitive 185KB inline runtime changed or moved without contract migration. Expected SHA '+SENSITIVE);
}

const forbiddenMutations=[
  /trueCameraHeadingDeg\s*=/,
  /verificationOffsetDeg\s*=/,
  /targetAzDeg\s*=/,
  /targetAltDeg\s*=/
];
// This guard does not assert that those tokens are absent from the legacy block; it prevents future
// extraction tooling from silently replacing the known block with a different body before dedicated tests exist.
console.log('PASS: sensitive inline runtime hash is unchanged:',SENSITIVE);
console.log('INFO: sensitive inline runtime bytes:',Buffer.byteLength(sensitive));
