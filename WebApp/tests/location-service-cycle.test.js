'use strict';
const fs=require('fs'),assert=require('assert');
const read=p=>fs.readFileSync(p,'utf8');

const bootstrap=read('js/presentation/bootstrap.js');
const web=read('js/presentation/location-service-control.js');
const launcher=read('android-twa/native/prayer-widget/QiblaLauncherActivity.java');
const state=read('android-twa/native/prayer-widget/NativeLocationState.java');
const settings=read('android-twa/native/prayer-widget/LocationSettingsActivity.java');
const apply=read('android-twa/apply_native_widget.ps1');
const mergedGate=read('android-twa/check_generated_permissions.py');

// The Location-service bridge starts early and remains separate from scientific engines.
assert(bootstrap.includes("js/presentation/location-service-control.js?v=20260818-native-location1"));
assert(bootstrap.indexOf('loadLocationServiceControl();')<bootstrap.indexOf('loadPrayerCore(loadPermissions);'));
for(const forbidden of ['calcQibla(','AstroVerification','QiblaPrayer','solarEvts(','moonPos(','sunPos(','WMM2025','bigdatacloud','reverse-geocode']){
  assert(!web.includes(forbidden),`Location-service control touched protected/unrelated path: ${forbidden}`);
}
assert(!web.includes('navigator.geolocation.getCurrentPosition'),'new service layer must reuse the existing GPS acquisition path');
assert(web.includes("root.tryBrowserGPS()"),'Location ON must hand back to the existing GPS function');
assert(web.includes("gnssHasTrustedFix")&&web.includes("gnssSource==='gps'"),'ready state must require the existing trusted GPS contract');

// Compact home state is explicit and contains no long new screen flow.
for(const label of ['◉ تفعيل الموقع','◌ جارٍ تحديد الموقع','● الموقع محدد'])assert(web.includes(label),`missing compact state: ${label}`);
assert(web.includes("#page-home .qa-sky .qa-bearing"),'compact control must stay beneath the existing home accuracy area');
assert(web.includes("nativeLocation")&&web.includes("qiblaastro:native-location-enabled:v1"));
assert(web.includes("package=com.qiblalabs")&&web.includes("scheme=qiblaastro")&&web.includes("location-settings"));
assert(web.includes("root.addEventListener('hashchange',handleNativeReturn)"),'return from Android settings must refresh native state even without a full page reload');

// Existing permission screen is only intercepted when permission is already granted and Android Location is known OFF.
assert(web.includes("permissionGranted=status&&status.state==='granted'"));
assert(web.includes("nativeState!==false||!permissionGranted"));
assert(web.includes("target.closest('#qa-permission-allow')"));
assert(web.includes("stopImmediatePropagation"));

// Android publishes ON/OFF only; it never supplies coordinates or enables Location silently.
assert(launcher.includes('NativeLocationState.isEnabled(this)'));
assert(launcher.includes('"&nativeLocation="'));
assert(state.includes('LocationManager'));
assert(state.includes('manager.isLocationEnabled()'));
assert(state.includes('LocationManager.GPS_PROVIDER')&&state.includes('LocationManager.NETWORK_PROVIDER'));
assert(settings.includes('NativeBridgeToken.valid(this'));
assert(settings.includes('Settings.ACTION_LOCATION_SOURCE_SETTINGS'));
assert(settings.includes('NativeLocationState.isEnabled(this)'));
assert(settings.includes('QiblaLauncherActivity.class'));
for(const forbidden of ['requestPermissions(','ACCESS_BACKGROUND_LOCATION','getLastKnownLocation','getCurrentLocation','getLatitude','getLongitude']){
  assert(!settings.includes(forbidden),`Location settings bridge must not acquire coordinates or add permission flow: ${forbidden}`);
}

// Generated AAB must contain the authenticated Activity but must not request background location.
assert(apply.includes('com.qiblalabs.nativebridge.LocationSettingsActivity'));
assert(apply.includes('android:host="location-settings"'));
assert(!apply.includes('android.permission.ACCESS_BACKGROUND_LOCATION'));
assert(mergedGate.includes('LOCATION_SETTINGS = "com.qiblalabs.nativebridge.LocationSettingsActivity"'));
assert(mergedGate.includes('"android.permission.ACCESS_BACKGROUND_LOCATION": "foreground location is sufficient'));
assert(mergedGate.includes('data.get(ANDROID + "host") == "location-settings"'));

console.log('Android Location service cycle: PASS');
console.log('Permission granted + Location OFF -> compact enable action -> Android settings -> launcher state refresh -> existing GPS acquisition: PASS');
console.log('Scope guard: Qibla / astronomy / city / prayer calculations untouched; background location forbidden: PASS');
