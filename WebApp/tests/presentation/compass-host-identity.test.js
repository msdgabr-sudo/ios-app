'use strict';
const fs=require('fs');
const assert=require('assert');
function read(p){return fs.readFileSync(p,'utf8');}
const index=read('index.html');
const fragment=read('pages/compass.html');
const host=read('js/presentation/compass/host.js');
const runtime=read('js/qibla-card-runtime.js');
const sw=read('service-worker.js');

function count(src,token){return src.split(token).length-1;}

// Parent document owns exactly one canonical engine node of each type before engine startup.
assert.strictEqual(count(index,'id="cvs"'),1,'index must own exactly one canonical #cvs');
assert.strictEqual(count(index,'id="dev-slider"'),1,'index must own exactly one canonical #dev-slider');
assert.strictEqual(count(index,'id="page-compass"'),1,'index must own exactly one compass host');
assert.strictEqual(count(index,'data-external-page="compass"'),1,'compass host must be external-page marked');
assert(index.includes('id="qibla-compass-engine-anchors"'),'engine anchors container missing');
['id="live-compass-card"','id="box-qibla"','id="box-diff"','id="manual-cal-section"'].forEach(t=>assert(!index.includes(t),'legacy compass presentation remains inline: '+t));

// External fragment receives the exact nodes through slots and must never duplicate their IDs.
assert(fragment.includes('data-qibla-engine-slot="cvs"'),'fragment missing canvas slot');
assert(fragment.includes('data-qibla-engine-slot="dev-slider"'),'fragment missing slider slot');
assert(!fragment.includes('id="cvs"'),'fragment must not duplicate canonical canvas');
assert(!fragment.includes('id="dev-slider"'),'fragment must not duplicate canonical slider');
assert(!fragment.includes('تتبّع')&&!fragment.includes('قفل'),'retired tracking/lock UI must remain absent');

// Host must preserve object identity, never recreate/clone scientific UI engine anchors.
assert(host.includes("var canvas=byId('cvs')"),'host must capture canonical canvas');
assert(host.includes("var slider=byId('dev-slider')"),'host must capture canonical slider');
assert(host.includes('canvasSlot.replaceWith(canvas)'),'host must move original canvas into slot');
assert(host.includes('sliderSlot.replaceWith(slider)'),'host must move original slider into slot');
assert(host.includes("byId('cvs')!==canvas"),'host must verify canvas identity');
assert(host.includes("byId('dev-slider')!==slider"),'host must verify slider identity');
assert(!host.includes('cloneNode'),'host must never clone engine nodes');
assert(!/createElement\(['\"]canvas['\"]\)/.test(host),'host must never create a replacement canvas');
assert(!/createElement\(['\"]input['\"]\)/.test(host),'host must never create a replacement slider');
['calcQibla','AstronomicalSolver','VerificationSession','recordVerification','getUserMedia','mediaDevices'].forEach(t=>assert(!host.includes(t),'host crossed engine/scientific boundary: '+t));

const h=runtime.indexOf('presentation/compass/host.js');
const a=runtime.indexOf('presentation/compass/digital-adapter.js');
assert(h>=0&&a>h,'runtime must mount compass host before digital adapter');
assert(sw.includes("'./pages/compass.html'"),'offline shell missing compass fragment');
assert(sw.includes("'./js/presentation/compass/host.js'"),'offline shell missing compass host');
console.log('PASS compass external host identity contract');
