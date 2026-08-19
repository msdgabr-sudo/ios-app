'use strict';

const fs=require('fs');
const crypto=require('crypto');
const INDEX='index.html';
const OUT='js/runtime/pwa-registration.js';
const SW='service-worker.js';
const EXPECTED_BODY_SHA='aed129e3fa9bb381bf2dec4ce89f159ffa7c0e133ba6c37d0f481f298ca869b6';
const MARKER='<!-- SERVICE WORKER REGISTRATION';

function hash(s){return crypto.createHash('sha256').update(s).digest('hex');}
function fail(msg){throw new Error('[PWA extraction refused] '+msg);}

let html=fs.readFileSync(INDEX,'utf8');
if(html.includes('src="js/runtime/pwa-registration.js"')){
  console.log('Already extracted; no-op.');
  process.exit(0);
}
const mi=html.indexOf(MARKER);
if(mi<0) fail('marker missing');
const open=html.indexOf('<script',mi);
if(open<0) fail('script opening missing');
const openEnd=html.indexOf('>',open);
const close=html.indexOf('</script>',openEnd);
if(openEnd<0||close<0) fail('script bounds malformed');
const opening=html.slice(open,openEnd+1);
if(/\bsrc\s*=/.test(opening)) fail('target script is already external');
const body=html.slice(openEnd+1,close);
const bodySha=hash(body);
if(bodySha!==EXPECTED_BODY_SHA) fail('body hash mismatch: '+bodySha);
if(/QiblaAstronomical|trueCameraHeading|verificationOffset|targetAz|targetAlt|astronomical-solver|camera-pose|gravity-reference/i.test(body)) fail('protected scientific token detected');

fs.mkdirSync('js/runtime',{recursive:true});
fs.writeFileSync(OUT,body,'utf8');
html=html.slice(0,open)+'<script src="js/runtime/pwa-registration.js"></script>'+html.slice(close+'</script>'.length);
fs.writeFileSync(INDEX,html,'utf8');

let sw=fs.readFileSync(SW,'utf8');
const asset="'./js/runtime/pwa-registration.js'";
if(!sw.includes(asset)){
  const appShellMatch=sw.match(/(const\s+APP_SHELL\s*=\s*\[)([\s\S]*?)(\]\s*;)/);
  if(!appShellMatch) fail('APP_SHELL array not found in service-worker.js');
  const replacement=appShellMatch[1]+appShellMatch[2].replace(/\s*$/,'')+',\n  '+asset+'\n'+appShellMatch[3];
  sw=sw.slice(0,appShellMatch.index)+replacement+sw.slice(appShellMatch.index+appShellMatch[0].length);
  fs.writeFileSync(SW,sw,'utf8');
}

const out=fs.readFileSync(OUT,'utf8');
if(hash(out)!==EXPECTED_BODY_SHA) fail('written runtime hash mismatch');
console.log(JSON.stringify({
  extracted:OUT,
  bodySha,
  indexBytes:fs.statSync(INDEX).size,
  runtimeBytes:fs.statSync(OUT).size,
  serviceWorkerUpdated:sw.includes(asset)
},null,2));
