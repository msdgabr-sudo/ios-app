'use strict';
const fs=require('fs');
const assert=require('assert');

function exists(p){assert(fs.existsSync(p),`required file missing: ${p}`);}
[
  'js/geomag/wmm2025.js',
  'js/geomag/wmm2025-runtime.js',
  'js/presentation/permissions-onboarding.js',
  'js/presentation/quran/host.js',
  'js/presentation/quran/back-history.js',
  'js/presentation/azkar/host.js',
  'js/presentation/azkar/back-history.js',
  'tests/wmm2025-official-gate.js',
  'tests/wmm2025-global-coverage.test.js',
  'tests/wmm2025-runtime-integration.test.js',
  'tests/prayer-location-deviation.test.js',
  'tests/local-timezone-adapter.test.js',
  'tests/timezone-production-wiring.test.js',
  'tests/trusted-location-runtime-sync.test.js',
  'tests/falaki-location-propagation.test.js',
  'tests/i18n-roundtrip-safety.test.js',
  'tests/astronomical-verification-store-persistence.test.js',
  'checkpoints/PRAYER_TIMEZONE_AUDIT_2026-08-14.md',
  'checkpoints/NATIVE_ANDROID_SOURCE_BLOCKER_2026-08-14.md'
].forEach(exists);

const gnss=fs.readFileSync('js/05-gnss.js','utf8');
assert(/let\s+LAT\s*=\s*Number\.NaN/.test(gnss),'GNSS must fail closed without a default city');
assert(/gnssSource\s*=\s*['\"]unresolved['\"]/.test(gnss),'GNSS must start unresolved');
assert(!/get\.geojs|freeipapi|ipwhois/.test(gnss),'sensitive runtime must not call IP geolocation services');
assert(/function\s+tryIPGeo\s*\(\)/.test(gnss),'compatibility alias may remain');

const permissions=fs.readFileSync('js/presentation/permissions-onboarding.js','utf8');
assert(/function\s+queryLocationPermission\s*\(/.test(permissions),'onboarding must inspect the browser/TWA geolocation permission state');
assert(/if\(err&&err\.code===1\)\{finish\('denied'\)/.test(permissions),'only PERMISSION_DENIED may classify location permission as denied');
assert(/if\(err&&err\.code===1\)\{finish\('denied'\);return;\}[\s\S]*settleFromPermission\(\)/.test(permissions),'position timeout/unavailable must resolve from permission state instead of being classified as denied');
const permissionFlowStart=permissions.indexOf('async function runPermissionRequest()');
const permissionFlowEnd=permissions.indexOf('function mountOnboarding',permissionFlowStart);
assert(permissionFlowStart>=0&&permissionFlowEnd>permissionFlowStart,'first-run permission flow block missing');
const permissionFlow=permissions.slice(permissionFlowStart,permissionFlowEnd);
assert(permissionFlow.includes("setState('notifications','contextual')"),'first-run notification state must remain contextual until Native Adhan activation');
assert(!permissionFlow.includes('requestWebNotifications()'),'first-run onboarding must not launch a competing Web notification prompt');
assert(!/var\s+notificationPromise=requestWebNotifications\(\)/.test(permissions),'legacy concurrent notification/location permission request must remain removed');
assert(/typeof\s+root\.tryBrowserGPS===['\"]function['\"]/.test(permissions),'successful permission onboarding must hand off to the existing trusted GNSS path');

// Production Android/TWA top-level Back contract. The parent document owns only
// app-level navigation: internal screen -> Home -> Android/browser.
const indexHtml=fs.readFileSync('index.html','utf8');
const homeFinal=fs.readFileSync('js/home-final.js','utf8');
assert(indexHtml.includes("var _pageHistory = ['home'];"),'expected historical inline Back wrapper not found; review navigation architecture before changing this gate');
assert(indexHtml.includes('var _origGT = GT;'),'expected production inline GT wrapper not found; review navigation architecture before changing this gate');
assert(/Android\/TWA Back compatibility layer/.test(homeFinal),'production runtime Back compatibility layer must be present in home-final.js');
assert(/var\s+renderPage=\(typeof\s+window\._origGT===['\"]function['\"]\)\?window\._origGT:window\.GT/.test(homeFinal),'runtime layer must bypass the legacy GT history wrapper and retain only its renderer');
assert(/history\.replaceState\(stateFor\('home'\)/.test(homeFinal),'startup must replace the current entry with Home rather than push a duplicate entry');
assert(/if\(current===['\"]home['\"]\)history\.pushState\(stateFor\(id\)/.test(homeFinal),'opening a top-level internal screen from Home must create exactly one browser history entry');
assert(/else\s+history\.replaceState\(stateFor\(id\)/.test(homeFinal),'internal-to-internal navigation must replace the single internal entry');
assert(/window\.addEventListener\(['\"]popstate['\"],function\(event\)[\s\S]*stopImmediatePropagation\(\)/.test(homeFinal),'parent capture-phase popstate handler must neutralize the obsolete inline parent listener');

// The visible Quran screen is the modern same-origin iframe pages/quran.html.
const quranHost=fs.readFileSync('js/presentation/quran/host.js','utf8');
const quranPage=fs.readFileSync('pages/quran.html','utf8');
const quranBack=fs.readFileSync('js/presentation/quran/back-history.js','utf8');
assert(/FRAME_SRC=['\"]pages\/quran\.html['\"]/.test(quranHost),'modern Quran iframe source must remain pages/quran.html');
assert(/frame\.id=['\"]qa-quran-frame['\"]/.test(quranHost),'modern Quran must remain mounted in qa-quran-frame');
assert(quranPage.includes('id="qrHome"')&&quranPage.includes('id="qrReader"')&&quranPage.includes('id="qrReaderBack"'),'modern Quran iframe contract must expose Home, Reader and Reader Back controls');
assert(/function\s+wireBackHistory\s*\(frame\)/.test(quranHost),'Quran host must install the iframe-local Back bridge');
assert(/presentation\/quran\/back-history\.js/.test(quranHost),'Quran host must load the dedicated iframe-local Back bridge');
assert(/var\s+KEY=['\"]qiblaastroQuranNav['\"]/.test(quranBack),'Quran nested history must use an isolated iframe-local state key');
assert(/new\s+MutationObserver/.test(quranBack),'Quran bridge must observe the real modern reader visibility rather than the obsolete parent reader');
assert(/history\.pushState\(stateFor\(true\)/.test(quranBack),'opening the modern Quran reader must add exactly one iframe child history entry');
assert(/back\.addEventListener\(['\"]click['\"],[\s\S]*history\.back\(\)[\s\S]*\},true\)/.test(quranBack),'visible Quran reader Back control must consume the same iframe history entry in capture phase');
assert(/root\.addEventListener\(['\"]popstate['\"],[\s\S]*showIndexViaExistingControl\(\)/.test(quranBack),'Android/browser Back inside the iframe must return the modern reader to the Quran index');

// Azkar is also a modern same-origin iframe with two child views: Reader and Audio.
// Its child history must remain entirely presentation-local and must reuse AzkarPage.
const azkarHost=fs.readFileSync('js/presentation/azkar/host.js','utf8');
const azkarPage=fs.readFileSync('pages/azkar.html','utf8');
const azkarBack=fs.readFileSync('js/presentation/azkar/back-history.js','utf8');
assert(/FRAME_SRC=['\"]pages\/azkar\.html['\"]/.test(azkarHost),'modern Azkar iframe source must remain pages/azkar.html');
assert(/frame\.id=['\"]qa-azkar-frame['\"]/.test(azkarHost),'modern Azkar must remain mounted in qa-azkar-frame');
assert(azkarPage.includes('id="azHome"')&&azkarPage.includes('id="azReader"')&&azkarPage.includes('id="azAudio"'),'modern Azkar iframe contract must expose Home, Reader and Audio views');
assert(/function\s+wireBackHistory\s*\(frame\)/.test(azkarHost),'Azkar host must install the iframe-local Back bridge');
assert(/presentation\/azkar\/back-history\.js/.test(azkarHost),'Azkar host must load the dedicated iframe-local Back bridge');
assert(/var\s+KEY=['\"]qiblaastroAzkarNav['\"]/.test(azkarBack),'Azkar nested history must use an isolated iframe-local state key');
assert(/new\s+MutationObserver/.test(azkarBack),'Azkar bridge must observe the real modern Azkar child-view transitions');
assert(/history\.pushState\(stateFor\('reader',cat\)/.test(azkarBack),'opening an Azkar category must add one Reader child history entry');
assert(/history\.pushState\(stateFor\('audio'\)/.test(azkarBack),'opening Azkar audio reminders must add one Audio child history entry');
assert(/root\.history\.back\(\)/.test(azkarBack),'visible Azkar child Back controls must consume the child history entry instead of creating a second path');
assert(/root\.addEventListener\(['\"]popstate['\"],[\s\S]*renderState\(nav\)/.test(azkarBack),'Android/browser Back inside the Azkar iframe must render the browser-selected child state');
assert(/AzkarPage\.openCategory/.test(azkarBack)&&/AzkarPage\.openAudio/.test(azkarBack)&&/AzkarPage\.home/.test(azkarBack),'Azkar bridge must reuse existing public presentation controls rather than duplicate counter/audio logic');

const serviceWorker=fs.readFileSync('service-worker.js','utf8');
assert(serviceWorker.includes("'./js/home-final.js'"),'service worker must critical-cache the guaranteed parent runtime entry point');
assert(serviceWorker.includes("'./js/presentation/quran/host.js'"),'service worker must critical-cache the modern Quran host');
assert(serviceWorker.includes("'./js/presentation/quran/back-history.js'"),'service worker must critical-cache the Quran nested Back bridge');
assert(serviceWorker.includes("'./js/presentation/azkar/host.js'"),'service worker must critical-cache the modern Azkar host');
assert(serviceWorker.includes("'./js/presentation/azkar/back-history.js'"),'service worker must critical-cache the Azkar nested Back bridge');
assert(/fetch\(r,\{cache:['\"]no-store['\"]\}\)/.test(serviceWorker),'service worker must network-refresh JS/CSS/HTML instead of pinning stale navigation code');

const core=fs.readFileSync('js/04-core.js','utf8');
assert(/const\s+UTC_OFF\s*=\s*3\s*;/.test(core),'legacy solar-event UTC+3 contract must remain explicit behind the isolated civil-time adapter');
const timezoneAudit=fs.readFileSync('checkpoints/PRAYER_TIMEZONE_AUDIT_2026-08-14.md','utf8');
assert(timezoneAudit.includes('original global time-zone release blocker is CLOSED'),'timezone audit must record the verified isolated migration');

const treeCandidates=['AndroidManifest.xml','build.gradle','build.gradle.kts','settings.gradle','settings.gradle.kts'];
for(const p of treeCandidates)assert(!fs.existsSync(p),`unexpected native project root appeared outside the guarded Bubblewrap generation path: ${p}`);

console.log('A2 pre-native Web/PWA release-readiness structure: PASS');
console.log('Location onboarding: permission grant is separated from GNSS fix readiness; notification prompting remains contextual.');
console.log('Navigation: parent owns app-level Back; Quran and Azkar iframes own only their nested child Back levels.');
console.log('Service Worker: parent, Quran and Azkar Back presentation bridges are critical-cached with network-first code refresh.');
console.log('Timezone status: legacy UTC+3 engine contract is isolated behind verified production civil-time conversion.');
console.log('Native-source checkpoint remains separately governed by the guarded Bubblewrap/native-injection release path.');
console.log('This is a pre-native source gate; APK/AAB artifacts still require their dedicated build/signing verification.');
