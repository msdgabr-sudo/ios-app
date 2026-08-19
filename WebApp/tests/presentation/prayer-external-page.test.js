'use strict';
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
function assert(ok,msg){if(!ok){console.error('FAIL:',msg);process.exitCode=1;}else console.log('PASS:',msg);}
const index=read('index.html');
const page=read('pages/prayer.html');
const registry=read('js/presentation/page-registry.js');
const forbidden=['astronomical-solver','astro-verification','astronomical-verification-session','astronomical-verification-store','camera-pose','camera-projection','celestial-detector','gravity-reference','getUserMedia','trueCameraHeadingDeg','verificationOffsetDeg','QiblaAstronomicalSolver'];
assert(/id=["']page-prayer["'][^>]*data-page-src=["']pages\/prayer\.html["']/.test(index),'index contains only prayer external-page mount point');
assert(!index.includes('qa-prayer-hero'),'prayer visual body is not embedded in index.html');
assert(page.includes('id="qa-next-name"')&&page.includes('id="qa-prayer-table"')&&page.includes('id="qa-adhan-card"'),'external prayer page keeps required presentation contract');
assert(registry.includes("fragment: 'pages/prayer.html'"),'page registry points to external prayer fragment');
assert(registry.includes("css/presentation/prayer/refinement.css"),'approved visual refinement layer is registered');
for(const token of forbidden)assert(!page.includes(token),'prayer fragment excludes protected scientific token: '+token);
const ids=[...page.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);
assert(new Set(ids).size===ids.length,'external prayer page has no duplicate IDs');
if(process.exitCode)process.exit(process.exitCode);
