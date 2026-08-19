'use strict';
const fs=require('fs'),assert=require('assert');
const read=p=>fs.readFileSync(p,'utf8');

const permissions=read('js/presentation/permissions-onboarding.js');
const gnss=read('js/05-gnss.js');
const nav=read('js/06-navigation.js');
const bootstrap=read('js/presentation/bootstrap.js');
const index=read('index.html');
const sync=read('js/presentation/prayer/schedule-sync.js');
const plan=read('js/presentation/prayer/native-plan.js');
const adhanUi=read('js/presentation/prayer/adhan-ui.js');
const runtime=read('js/runtime/trusted-location-dependent-sync.js');
const nativeActivity=read('android-twa/native/prayer-widget/PrayerWidgetSyncActivity.java');
const nativeScheduler=read('android-twa/native/prayer-widget/PrayerNativeScheduler.java');
const nativeLauncher=read('android-twa/native/prayer-widget/QiblaLauncherActivity.java');
const nativeBoot=read('android-twa/native/prayer-widget/PrayerBootReceiver.java');
const nativeReceiver=read('android-twa/native/prayer-widget/PrayerNotificationReceiver.java');
const applyNative=read('android-twa/apply_native_widget.ps1');
const mergedGate=read('android-twa/check_generated_permissions.py');
const twa=JSON.parse(read('android-twa/twa-manifest.json'));
const sw=read('service-worker.js');

// Release/TWA identity stays fixed while this native fix is prepared for the next Play upload.
assert.strictEqual(twa.appVersion,'3.1.1');
assert.strictEqual(twa.appVersionCode,4);
assert.strictEqual(twa.features&&twa.features.locationDelegation&&twa.features.locationDelegation.enabled,true);
assert.strictEqual(twa.enableNotifications,true);

// Location permission remains separate from trusted GNSS acquisition.
assert(permissions.includes('getLocationPermissionStatus'));
assert(permissions.includes('timer=root.setTimeout(settleFromPermission,10000)'));
assert(permissions.includes('enableHighAccuracy:false'));
assert(permissions.includes('maximumAge:60000'));
assert(index.includes('function tryBrowserGPS()'));
assert(permissions.includes("typeof root.tryBrowserGPS==='function'")&&permissions.includes('root.tryBrowserGPS()'));
assert(permissions.includes('trustedGnssReady()'));
assert(gnss.includes('gnssHasTrustedFix')&&gnss.includes("gnssSource='gps'"));
assert(!/ipapi|ipinfo|geolocation-db|fetch\s*\(/i.test(gnss));
assert(!nav.includes("gnssSource==='default'")&&!nav.includes('gnssSource==="default"'));
for(const forbidden of ['calcQibla(','refreshMdeclFromTrustedGnss(','calcPrayers(','sunPos(','moonPos(']){
  assert(!permissions.includes(forbidden),`Permissions integration touched protected calculation token: ${forbidden}`);
}
// The permissions layer may hand control to the pre-existing astronomical verification API after
// camera permission succeeds, but it must not implement or duplicate any protected calculation.
assert.strictEqual((permissions.match(/AstroVerification/g)||[]).length,1,'permissions layer must only reference the existing verification API once');
assert(permissions.includes('var api=root.AstroVerification;')&&permissions.includes('api.startProductionVerification();'),'camera permission gate must delegate to the existing verification API');
assert(runtime.includes('QiblaPrayerMethods.calculate'));
assert(bootstrap.includes("css/compass-confidence-final.css?v=20260809-reference-ui1"),'Adhan work must not alter compass assets');

// Native permission order: Android notification permission first, then exact-alarm special access, then apply/schedule.
assert(nativeActivity.includes('requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},REQ_NOTIFICATIONS);'));
assert(nativeActivity.includes('Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM'));
assert(nativeActivity.includes('PrayerNativeScheduler.canScheduleExactAlarms(this)'));
assert(nativeActivity.includes('if(!interactive){finish();return;}'),'background refresh must never pop permission UI');
assert(nativeActivity.includes('continueActivation();'),'permission grants must resume one deterministic activation state machine');
assert(nativeActivity.includes('boolean applied=apply(data);'));
assert(nativeActivity.includes('restartIntoAuthenticatedLauncher()'),'successful onboarding must restart through the authenticated launcher so web sees native ownership');
const notificationRequest=nativeActivity.indexOf('requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},REQ_NOTIFICATIONS);');
const exactRequest=nativeActivity.indexOf('Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM');
const applyPos=nativeActivity.indexOf('boolean applied=apply(data);');
assert(notificationRequest>=0&&exactRequest>notificationRequest&&applyPos>exactRequest,'enabled Adhan must not be applied before both permission gates');

// Exact prayer event; informational pre-alert remains inexact so it cannot throttle the exact Adhan in Doze.
assert(nativeScheduler.includes('Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms()'));
assert(nativeScheduler.includes('am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,at,pi);'),'actual prayer Adhan must use an exact idle-safe alarm');
assert(nativeScheduler.includes('if(pre)')&&nativeScheduler.includes('am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,at,pi);'),'pre-prayer reminder must remain separately inexact');
assert(nativeScheduler.includes('KEY_NATIVE_ACTIVE'));
assert(nativeScheduler.includes('p.edit().putBoolean(KEY_NATIVE_ACTIVE,false)'),'revoked exact access must remove confirmed native ownership');
assert(nativeScheduler.includes('scheduledPrayerCount>0'),'an exhausted dated plan must fail closed instead of retaining native ownership');
assert(nativeReceiver.includes('USAGE_ALARM')&&nativeReceiver.includes('rawNameForAdhan'));
assert(nativeReceiver.includes('"/raw/"+rawName'),'Adhan notification sound must use a stable named raw-resource URI');
assert(nativeReceiver.includes('_v2'),'code4 must create fresh prayer notification channels');
assert(nativeBoot.includes('ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED'),'granting exact-alarm access must trigger native rescheduling');
assert(applyNative.includes('android.permission.SCHEDULE_EXACT_ALARM'));
assert(applyNative.includes('ACTION_REQUEST_SCHEDULE_EXACT_ALARM'));
assert(mergedGate.includes('android.permission.SCHEDULE_EXACT_ALARM'));
assert(mergedGate.includes('android.permission.USE_EXACT_ALARM')&&mergedGate.includes('forbidden permission present'),'restricted USE_EXACT_ALARM must remain forbidden');

// Dated horizon: one authoritative web prayer engine, six months cached safely, refreshed on every normal app lifecycle.
assert(plan.includes('MAX_DAYS=180'));
assert(plan.includes('QiblaPrayerMethods.calculate'),'long plan must reuse the approved prayer engine');
assert(plan.includes('sameMinutes(first.times,current)'),'today must match the displayed schedule before native handoff');
assert(plan.includes("cacheKey='',cachePlan=null"),'long plan must be cached instead of recalculated every poll');
assert(sync.includes('PLAN_DAYS=180'));
assert(sync.includes('QiblaPrayerNativePlan.build(PLAN_DAYS)'));
assert(nativeActivity.includes('days.length<2||days.length>180'));
assert(nativeActivity.includes('raw.length()>16384'));
assert(sync.includes("maybeAutoSync('startup')")&&sync.includes("maybeAutoSync('location-changed')")&&sync.includes("maybeAutoSync('runtime-ready')"));

// One owner only: native Android suppresses the legacy web audio only after native ownership is positively confirmed.
assert(sync.includes("OWNER_KEY='qiblaastro:prayer-native-owner:v1'"));
assert(sync.includes("hp.get('nativeAdhan')"),'web must consume authenticated launcher scheduler state');
assert(nativeLauncher.includes('nativeAdhan=')&&nativeLauncher.includes('PrayerNativeScheduler.nativeActive(this)'));
assert(sync.includes('function installWebFallbackGuard()'));
assert(sync.includes('if(nativeOwnerConfirmed())return;return webCheck(now,cache);'),'legacy web scheduler must remain only as a fallback outside confirmed native ownership');
assert(adhanUi.includes('root._checkAdhan=function'),'existing web scheduler stays intact rather than being deleted/replaced');
assert(sync.includes("if(!st||!st.enabled)return false"),'native repair loop must stop when master Adhan is disabled');
assert(sync.includes("prayers[name]&&prayers[name]!=='off'"),'native repair loop must stop when all five prayer alert modes are off');

// First-run handoff cannot call a mere blur "success". Denial returns to the same overlay; success restarts the TWA with nativeAdhan=1.
assert(permissions.includes("btn.dataset.stage='adhan'"));
assert(permissions.includes('root.QiblaPrayerNativeSync.activate()'));
assert(permissions.includes('if(!confirmed){failNativeAdhanActivation(btn);return;}'));
assert(sync.includes('HANDOFF_TIMEOUT_MS=120000'));
assert(sync.includes('function onDepart(){departed=true;}'));
assert(sync.includes('finish(nativeOwnerConfirmed())'),'returning from Android must verify confirmed native ownership');
assert(sync.includes("q.set('interactive',interactive?'1':'0')"));
assert(sync.includes("q.set('onboarding',onboarding?'1':'0')"));
assert(sync.includes('buildQuery(payload,true,true)'));
assert(sync.includes('package=com.qiblalabs'));

// Early native bridge remains independent of prayer presentation mount.
assert(bootstrap.includes('function captureNativeTokenEarly()'));
assert(bootstrap.includes('function loadPrayerCore(onready)'));
assert(bootstrap.includes('loadPrayerCore(loadPermissions);'));
const mountPrayerPos=bootstrap.indexOf("loader.mount('prayer')");
const coreDefinitionPos=bootstrap.indexOf('function loadPrayerCore(onready)');
assert(coreDefinitionPos>=0&&mountPrayerPos>coreDefinitionPos);

// Cache release must retain the exact-Adhan bridge while evicting superseded code through the current v6.20 Azkar release.
assert(sw.includes("VERSION='qiblaastro-v6.20-azkar-native-confirmed'"));
assert(sw.includes("BRIDGE_RELEASE='prayer-exact-20260818-v1'"));
assert(sw.includes("AZKAR_RELEASE='azkar-native-confirmed-20260818-v1'"));
assert(sw.includes("PERMISSIONS_RELEASE='location-adhan-exact-cycle-20260818-v1'"));
assert(sw.includes("'./js/presentation/prayer/native-plan.js'")&&sw.includes("'./js/presentation/prayer/schedule-sync.js'"));

console.log('Permissions/GNSS/Adhan cycle: PASS');
console.log('Native order: location -> prayer plan -> POST_NOTIFICATIONS -> SCHEDULE_EXACT_ALARM -> exact prayer-time Adhan: PASS');
console.log('Ownership: confirmed Android Native suppresses Web audio; Web remains fallback otherwise: PASS');
console.log('Plan: authoritative prayer engine -> cached 180-day dated schedule -> startup/location/runtime refresh: PASS');
console.log('Edge case: all prayer modes off -> no permission-repair loop: PASS');
