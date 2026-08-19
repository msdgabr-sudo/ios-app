'use strict';
const fs=require('fs');const assert=require('assert');
const host=fs.readFileSync('js/presentation/compass/host.js','utf8');
const page=fs.readFileSync('pages/compass.html','utf8');
const runtime=fs.readFileSync('js/qibla-card-runtime.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

assert(host.includes("pages/compass.html"),'host must load external compass fragment');
assert(host.includes("byId('cvs')"),'host must capture canonical canvas node');
assert(host.includes("byId('dev-slider')"),'host must capture canonical deviation slider node');
assert(host.includes('canvasSlot.replaceWith(canvas)'),'host must move the exact canonical canvas into the fragment');
assert(host.includes('sliderSlot.replaceWith(slider)'),'host must move the exact canonical slider into the fragment');
assert(!host.includes('cloneNode'),'host must never clone canonical engine nodes');
assert(!/createElement\(['"]canvas['"]\)/.test(host),'host must never create a replacement canvas');
assert(!/createElement\(['"]input['"]\)/.test(host),'host must never create a replacement slider');
assert(!/calcQibla|AstronomicalSolver|AstroQiblaEngine|getUserMedia|mediaDevices/.test(host),'host must not cross into scientific/camera logic');

assert(page.includes('data-qibla-engine-slot="cvs"'),'fragment must expose canvas slot');
assert(page.includes('data-qibla-engine-slot="dev-slider"'),'fragment must expose slider slot');
assert(!page.includes('id="cvs"'),'fragment must not duplicate canonical canvas ID');
assert(!page.includes('id="dev-slider"'),'fragment must not duplicate canonical slider ID');
assert(!page.includes('📍 تتبّع'),'retired tracking presentation debris must remain removed');
assert(!page.includes('🔒 قفل'),'retired lock presentation debris must remain removed');

const ih=runtime.indexOf('presentation/compass/host.js');
const ia=runtime.indexOf('digital-adapter.js');
const il=runtime.indexOf('digital-layout.js');
const im=runtime.indexOf('mode-view.js');
assert(ih>=0&&ia>ih&&il>ia&&im>il,'runtime must mount host before digital presentation adapters');
assert(sw.includes("'./pages/compass.html'"),'offline shell must cache compass fragment');
assert(sw.includes("'./js/presentation/compass/host.js'"),'offline shell must cache compass host');
console.log('COMPASS EXTERNAL HOST IDENTITY CONTRACT: PASS');
