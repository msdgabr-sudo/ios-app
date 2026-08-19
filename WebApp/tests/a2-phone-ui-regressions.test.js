const fs=require('fs'),vm=require('vm'),assert=require('assert');
const read=p=>fs.readFileSync(p,'utf8');

const compassHost=read('js/presentation/compass/host.js');
assert(compassHost.includes("addEventListener('deviceorientationabsolute'"),'Deviation display must refresh from orientation events');
assert(compassHost.includes("addEventListener('deviceorientation'"),'Deviation display must refresh from fallback orientation events');
assert(compassHost.includes("updateCompassBoxes"),'Deviation display must reuse the original compass-box updater');
assert(!compassHost.includes('scrollIntoView('),'Deviation card must not navigate to the calculator');
assert(!compassHost.includes('calcQibla(')&&!compassHost.includes('drawDeviation('),'Compass host must remain presentation-only');

const nav=read('js/06-navigation.js');
assert(nav.includes('_qaResetPageScroll'),'Navigation must own deterministic page scroll reset');
assert(nav.includes('window.scrollTo(0,0)'),'Navigation must reset the browser scroll position');
assert(nav.includes("page.scrollTop=0"),'Navigation must reset the active page scroll container');
assert(nav.includes("requestAnimationFrame(function()"),'Navigation must repeat reset after dynamic presentation paint');
assert(nav.includes("qiblaastro:navigation-change"),'Navigation must publish one stable page-change event');
assert(nav.includes("classList.remove('qa-astro-fullscreen-mode')"),'Compass fullscreen state must not leak into Home');
assert(nav.includes("setAttribute('data-qa-active-page',id)"),'Navigation must synchronously publish the active route for isolated overlays');

const pageCss=read('css/07-pages.css');
assert(pageCss.includes('#qa-compass-home-button')&&pageCss.includes('+ 46px'),'Compass Home control must remain independently raised at the approved phone position');
assert(pageCss.includes('padding-top: 48px !important'),'Compass dashboard content must be lowered for phone acceptance without moving Home');
assert(pageCss.includes('margin-top: 18px !important'),'Digital compass canvas must be visibly lowered on phone');
assert(pageCss.includes('.qa-info')&&pageCss.includes('margin-top: 14px !important'),'Home date/prayer strip and following service rows must be lowered together');
assert(pageCss.includes('body[data-qa-active-page="gnss"]')&&pageCss.includes('min-height: 100dvh !important'),'GNSS must own a full-height dark surface without a detached black tail');
assert(pageCss.includes('.qa-compass-menu-button')&&pageCss.includes('display: none !important'),'Obsolete control under Compass Home must remain hidden');
assert(pageCss.includes('body:not([data-qa-active-page="compass"]) #qibla-success'),'Qibla success banner must never leak outside Compass');
assert(pageCss.includes('body:not([data-qa-active-page="compass"]) #qo-canvas'),'Qibla celebration canvas must never leak outside Compass');

const chromeCss=read('css/internal-screen-chrome.css');
assert(chromeCss.includes('body[data-qa-active-page="prayer"]')&&chromeCss.includes('#f7f4ee'),'Prayer must own a full light viewport surface');
assert(chromeCss.includes('body[data-qa-active-page="night"]')&&chromeCss.includes('#a9daf1'),'Falaki host must own a full sky viewport surface');
assert(chromeCss.includes('body[data-qa-active-page="serenity"]')&&chromeCss.includes('height:100dvh!important')&&chromeCss.includes('overflow:hidden!important'),'Serenity must remain a single non-scrolling viewport page');
assert(chromeCss.includes('body[data-qa-active-internal-screen="night"] #qa-internal-home-button svg')&&chromeCss.includes('display:block!important'),'Falaki must show the actual Home SVG');
assert(chromeCss.includes('content:none!important'),'Falaki must not replace Home with a back-arrow pseudo element');

const registry=read('js/presentation/page-registry.js');
assert(registry.includes("'css/presentation/prayer/settings-overrides.css'"),'Prayer registry must load the viewport-safe settings overrides');
const prayerOverrides=read('css/presentation/prayer/settings-overrides.css');
assert(prayerOverrides.includes('box-sizing:border-box!important'),'Prayer bottom sheet height must include its padding inside the viewport');
assert(prayerOverrides.includes('qa-prayer-details-body{display:block!important'),'Prayer timing/settings details must remain permanently visible');
assert(prayerOverrides.includes('padding-bottom:max(20px'),'Prayer page must not retain the obsolete large bottom spacer');
assert(prayerOverrides.includes('animation:qaSheetViewportFade'),'Prayer sheet must animate without translating below the viewport');
assert(prayerOverrides.includes('@keyframes qaSheetViewportFade{from{opacity:.65}to{opacity:1}}'),'Prayer sheet viewport-safe fade animation contract missing');

const bootstrap=read('js/presentation/bootstrap.js');
assert(bootstrap.includes('internal-screen-chrome.css?v=20260814-surface-contract1'),'Bootstrap must request the current internal surface contract');
assert(bootstrap.includes('page-registry.js?v=20260814-prayer-overrides1'),'Bootstrap must request the registry that includes prayer overrides');
assert(bootstrap.includes('js/presentation/prayer/location-settings-ui.js'),'Prayer-only location settings UI must be loaded after the Prayer page mounts');
assert(bootstrap.includes('js/presentation/prayer/calculation-settings-ui.js'),'Prayer calculation settings UI must be loaded after the Prayer page mounts');
assert(bootstrap.includes('js/presentation/permissions-onboarding.js'),'Production bootstrap must load the existing permissions/GNSS startup integration layer');

const homeFinalizer=read('js/home-reference-finalizer.js');
assert(homeFinalizer.includes('icons/hm-astronomy.png'),'Home astronomy card must use the dedicated project astronomy icon');
assert(homeFinalizer.includes('js/presentation/bootstrap.js'),'Guaranteed Home finalizer must load the production presentation bootstrap');

const picker=read('js/i18n/home-language-picker.js');
assert(picker.includes("window.addEventListener('click'"),'Language picker must capture on window before the legacy document interceptor');
assert(picker.includes("closest('#qaLangToggle')"),'Language picker must own the Home language trigger');
for(const lang of ['ar','en','fr','id','ur'])assert(picker.includes("['"+lang+"'"),`Language picker must expose ${lang}`);

const quranHost=read('js/presentation/quran/host.js');
assert(quranHost.includes("getElementById('qrAppBack')"),'Quran app-home button binding missing');
assert(quranHost.includes("root.GT==='function'")&&quranHost.includes("root.GT('home')"),'Quran index must return to app Home');

const index=read('index.html');
for(const id of ['page-home','page-compass','page-night','qa-home','qaLangToggle']){
 const count=(index.match(new RegExp('id=["\\\']'+id+'["\\\']','g'))||[]).length;
 assert.strictEqual(count,1,`Critical shell id must be unique: ${id}`);
}
assert(index.includes('data-qibla-home-final')&&index.includes('data-qibla-home-finalizer'),'Static Home scripts must remain explicit in index.html');
assert(index.includes('function tryBrowserGPS()'),'Production index must retain the existing trusted GNSS implementation');
assert(!index.includes('src="js/05-gnss.js"')&&!index.includes("src='js/05-gnss.js'"),'Production must not accidentally run a second external GNSS implementation alongside the inline engine');

const sw=read('service-worker.js');
for(const asset of ['./index.html','./js/06-navigation.js','./js/home-final.js','./js/home-reference-finalizer.js','./css/home-action-layout-233.css','./js/i18n/home-language-picker.js','./css/internal-screen-chrome.css','./js/presentation/bootstrap.js','./js/presentation/page-registry.js']){
 assert(sw.includes("'"+asset+"'"),`Service worker must precache stable shell asset: ${asset}`);
}
assert(sw.includes("'./js/presentation/permissions-onboarding.js'"),'Service worker must keep the production permissions/GNSS startup integration in the critical cache');
assert(/fetch\(r,\{cache:['\"]no-store['\"]\}\)/.test(sw),'Service worker must network-refresh JS/CSS/HTML so GNSS startup fixes are not pinned stale');

const gnss=read('js/05-gnss.js');
assert((gnss.match(/maximumAge:0/g)||[]).length>=2,'GNSS manual refresh/watch must request fresh device fixes');
assert(!/fetch\s*\(|ipapi|ipinfo|geolocation-db/i.test(gnss),'GNSS policy must not call IP/external geolocation');
assert(gnss.includes("gnssUpdating=true")&&gnss.includes("gnssUpdating=false"),'GNSS refresh busy state missing');

const permissions=read('js/presentation/permissions-onboarding.js');
assert(permissions.includes('function recoverTrustedGnss(reset)'),'Existing permissions integration must own startup recovery of the existing GNSS function');
assert(permissions.includes("typeof root.tryBrowserGPS==='function'")&&permissions.includes('root.tryBrowserGPS()'),'Startup recovery must reuse the existing production GNSS function rather than duplicate its equations');
assert(permissions.includes("queryLocationPermission()")&&permissions.includes("permission!=='granted'"),'Automatic GNSS startup must remain permission-gated');
assert(permissions.includes('GNSS_RECOVERY_DELAYS=[13000,17000,25000]'),'Transient cold-start GNSS recovery must be bounded rather than loop forever');
assert(permissions.includes("root.setTimeout(function(){recoverTrustedGnss(true);},100)"),'Installed app must check an already-granted location permission immediately on each startup');
assert(permissions.includes("root.addEventListener('focus',function(){recoverTrustedGnss(true);})")&&permissions.includes("visibilitychange"),'GNSS recovery must resume when the installed app returns to foreground');
assert(permissions.includes("typeof gnssHasTrustedFix!=='undefined'")&&permissions.includes("gnssSource==='gps'")&&permissions.includes('Number.isFinite(Number(LAT))')&&permissions.includes('Number.isFinite(Number(LON))'),'Recovery must stop only after the existing trusted finite GNSS state is ready');
assert(!permissions.includes('calcQibla(')&&!permissions.includes('refreshMdeclFromTrustedGnss(')&&!permissions.includes('calcPrayers(')&&!permissions.includes('sunPos(')&&!permissions.includes('moonPos('),'Startup integration must not alter or duplicate Qibla, WMM, prayer, Falaki or raw astronomical equations');

const ctx={console,CustomEvent:function(){},dispatchEvent(){},QiblaPrayerMethods:{methods:{
 mwl:{label:'رابطة العالم الإسلامي (MWL)'},egyptian:{label:'الهيئة المصرية العامة للمساحة'},ummAlQura:{label:'أم القرى — مكة'},karachi:{label:'جامعة العلوم الإسلامية — كراتشي'},isna:{label:'ISNA — أمريكا الشمالية'},singapore:{label:'سنغافورة / ماليزيا / إندونيسيا'},kuwait:{label:'الكويت'},qatar:{label:'قطر'}
}},QiblaPrayerLocation:{cities:[{nameAr:'الجيزة',countryAr:'مصر',nameEn:'Giza',countryEn:'Egypt'}]}};
ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(read('js/i18n/prayer-settings-complete-phrases.js'),ctx);
for(const lang of ['en','fr','id','ur']){
 for(const m of Object.values(ctx.QiblaPrayerMethods.methods)){
  const out=ctx.MIZAN_PRAYER_SETTINGS_DYNAMIC_TRANSLATE(m.label,lang);assert(out,`Method label missing for ${lang}: ${m.label}`);if(lang!=='ur')assert(!/[\u0600-\u06FF]/.test(out),`Method label still Arabic for ${lang}: ${m.label}`);
 }
 const city=ctx.MIZAN_PRAYER_SETTINGS_DYNAMIC_TRANSLATE('الجيزة، مصر',lang);assert(city==='Giza, Egypt',`City label not non-Arabic for ${lang}`);
 const summary=ctx.MIZAN_PRAYER_SETTINGS_DYNAMIC_TRANSLATE('تلقائي · الهيئة المصرية العامة للمساحة',lang);assert(summary&&!summary.includes('الهيئة'),`Dynamic calculation summary not translated for ${lang}`);
}
const bridge=read('js/i18n/internal-screen-language-bridge.js');
assert(bridge.includes('MIZAN_PRAYER_SETTINGS_DYNAMIC_TRANSLATE'),'Internal language bridge must consume prayer dynamic translator');
assert(bridge.includes('prayer-settings-complete-phrases.js'),'Prayer dynamic translation bundle must load');
console.log('A2 phone UI regression gate: PASS');
console.log('GNSS production startup: existing inline engine + permission-gated bounded recovery + foreground resume: PASS');
console.log('GNSS safety: no duplicate engine and no Qibla/WMM/prayer/Falaki/raw-equation changes in startup integration: PASS');
console.log('Home rows / astronomy icon / lowered compass dashboards / GNSS surface / persistent Prayer settings and bindings: PASS');