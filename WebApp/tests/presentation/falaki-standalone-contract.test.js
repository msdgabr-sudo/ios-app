const fs=require('fs');const assert=require('assert');
const page=fs.readFileSync('pages/falaki.html','utf8');
const host=fs.readFileSync('js/presentation/falaki/host.js','utf8');
const runtime=fs.readFileSync('js/qibla-card-runtime.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

['فلكي','القمر الآن','الشمس الآن','كيف تستدل على القبلة من السماء؟','نجم الشمال','من السماء إلى الملاحة الحديثة'].forEach(x=>assert.ok(page.includes(x),x));
assert.match(page,/window\.FalakiPage/);
assert.match(page,/navigator\.geolocation\.getCurrentPosition/);
assert.ok(page.includes('صفحة تعليمية مستقلة'));

// The educational page must never enter camera / verification / device-heading runtime paths.
['getUserMedia','mediaDevices','DeviceOrientationEvent','deviceorientation','AstronomicalVerificationSession','astronomical-verification-store','startVerification','recordVerification','QiblaAstronomicalSolver'].forEach(token=>assert.ok(!page.includes(token),'forbidden Falaki runtime token: '+token));

assert.match(host,/page-night/);assert.match(host,/pages\/falaki\.html/);assert.match(host,/iframe/);
assert.match(runtime,/loadFalakiPresentation/);assert.match(runtime,/presentation\/falaki\/host\.js/);
assert.match(sw,/pages\/falaki\.html/);assert.match(sw,/presentation\/falaki\/host\.js/);assert.match(sw,/const VERSION='qiblaastro-v/);
console.log('Falaki standalone educational contract: PASS');
