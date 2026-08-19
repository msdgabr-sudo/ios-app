'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=process.cwd(),sets=['values','values-en','values-fr','values-id','values-ur'];
function read(p){return fs.readFileSync(path.join(root,p),'utf8');}
function stringNames(xml){return new Set([...xml.matchAll(/<string\s+name="([^"]+)"/g)].map(m=>m[1]));}

// Localized Native Azkar surface remains intact.
const azkarRequired=['azkar_channel_name','azkar_channel_description','azkar_notification_title','azkar_start_title','azkar_start_message','azkar_start_action','azkar_stop_title','azkar_stop_message','azkar_stop_action','azkar_cancel_action','azkar_permission_required','azkar_started_toast'];
for(const set of sets){const p=`android-twa/native/azkar-reminders/res/${set}/strings.xml`;assert(fs.existsSync(p),`${p} missing`);const n=stringNames(read(p));for(const k of azkarRequired)assert(n.has(k),`${set} missing ${k}`);}
const azActivity=read('android-twa/native/azkar-reminders/AzkarReminderActivity.java');
const azScheduler=read('android-twa/native/azkar-reminders/AzkarReminderScheduler.java');
const azReceiver=read('android-twa/native/azkar-reminders/AzkarReminderReceiver.java');
const azBoot=read('android-twa/native/azkar-reminders/AzkarBootReceiver.java');
assert(azActivity.includes('NativeBridgeToken.valid'));
assert(azActivity.includes('POST_NOTIFICATIONS'));
assert(azActivity.includes('AzkarReminderScheduler.MIN_INTERVAL_MINUTES'));
assert(azActivity.includes('continueActivation()'));
assert(azActivity.includes('ACTION_APP_NOTIFICATION_SETTINGS'));
assert(azActivity.includes('ACTION_CHANNEL_NOTIFICATION_SETTINGS'));
assert(azActivity.includes('restartIntoAuthenticatedLauncher()'));
assert(azActivity.includes('AzkarReminderScheduler.stop(this)'));
assert(azScheduler.includes('MIN_INTERVAL_MINUTES = 15'));
assert(azScheduler.includes('DEFAULT_INTERVAL_MINUTES = 15'));
assert(azScheduler.includes('setAndAllowWhileIdle'));
assert(azScheduler.includes('ELAPSED_REALTIME_WAKEUP'));
assert(azScheduler.includes('KEY_NEXT_ELAPSED'));
assert(azScheduler.includes('scheduleNextFromDelivery'));
assert(azScheduler.includes('restartAfterBoot'));
assert(azScheduler.includes('restore(Context context)'));
assert(azScheduler.includes('nextFutureTarget'));
assert(azScheduler.includes('previousTarget + intervalMs'),'next reminder must stay anchored to intended cadence instead of drifting from delayed delivery');
assert(!azScheduler.includes('setExact(')&&!azScheduler.includes('setExactAndAllowWhileIdle'),'Azkar must remain inexact; exact alarm access is reserved for prayer-time Adhan');
assert(azScheduler.includes('PendingIntent.getBroadcast')&&azScheduler.includes('AzkarReminderReceiver.class'));
assert(azReceiver.includes('channelIssue'));
assert(azReceiver.includes('_v2'));
assert(azReceiver.includes('"/raw/" + rawName'));
assert(!azReceiver.includes('"android.resource://" + context.getPackageName() + "/" + rawId'),'Azkar channel must not persist numeric resource-id sound URIs');
assert(azReceiver.includes('scheduleNextFromDelivery'));
assert(azBoot.includes('restartAfterBoot')&&azBoot.includes('restore(context)'));

// Localized prayer and widget resources remain complete.
const prayerRequired=['prayer_channel_adhan','prayer_channel_notice','prayer_channel_description','prayer_notification_title','prayer_notification_now','prayer_notification_advance','prayer_name_fajr','prayer_name_dhuhr','prayer_name_asr','prayer_name_maghrib','prayer_name_isha'];
const widgetRequired=['widget_app_name','widget_city_unavailable','widget_refresh_required','widget_value_unavailable','widget_qibla_unavailable','widget_qibla_value'];
for(const set of sets){let p=`android-twa/native/prayer-widget/res/${set}/strings.xml`;assert(fs.existsSync(p),`${p} missing`);let n=stringNames(read(p));for(const k of prayerRequired)assert(n.has(k),`${set} missing ${k}`);p=`android-twa/native/widget/res/${set}/strings.xml`;n=stringNames(read(p));for(const k of widgetRequired)assert(n.has(k),`${set} missing ${k}`);}

const token=read('android-twa/native/prayer-widget/NativeBridgeToken.java');
const launcher=read('android-twa/native/prayer-widget/QiblaLauncherActivity.java');
const sync=read('android-twa/native/prayer-widget/PrayerWidgetSyncActivity.java');
const scheduler=read('android-twa/native/prayer-widget/PrayerNativeScheduler.java');
const receiver=read('android-twa/native/prayer-widget/PrayerNotificationReceiver.java');
const prayerBoot=read('android-twa/native/prayer-widget/PrayerBootReceiver.java');
const widget=read('android-twa/native/widget/QiblaWidgetProvider.java');
const apply=read('android-twa/apply_native_widget.ps1');
const mergedGate=read('android-twa/check_generated_permissions.py');

// Per-install authenticated bridge.
for(const t of ['SecureRandom','MODE_PRIVATE','candidate'])assert(token.includes(t),`token gate missing ${t}`);
assert(launcher.includes('nativeToken=')&&!launcher.includes('appendQueryParameter("nativeToken"'),'native token must remain fragment-only');
assert(launcher.includes('nativeAdhan=')&&launcher.includes('PrayerNativeScheduler.nativeActive(this)'),'launcher must report confirmed native scheduler ownership');
assert(launcher.includes('nativeAzkar=')&&launcher.includes('azkarInterval=')&&launcher.includes('azkarPhrase='),'launcher must report confirmed Native Azkar state');
assert(launcher.includes('azkarResult=')&&launcher.includes('azkarIssue='),'launcher must report Native Azkar result/issue to the TWA');
assert(sync.includes('NativeBridgeToken.valid'));
assert(sync.includes('MODE_PRIVATE'));
assert(sync.includes('safePlan(d.getQueryParameter("plan"))'));
assert(sync.includes('days.length<2||days.length>180'),'native plan horizon must be bounded to six months');
assert(sync.includes('raw.length()>16384'),'native plan payload must remain bounded');

// Permission lifecycle: runtime notifications + user-granted exact-alarm special access for prayer Adhan only.
assert(sync.includes('POST_NOTIFICATIONS'));
assert(sync.includes('Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM'));
assert(sync.includes('PrayerNativeScheduler.canScheduleExactAlarms(this)'));
assert(sync.includes('if(!interactive){finish();return;}'),'automatic refresh must never open permission UI');
assert(sync.includes('boolean applied=apply(data);'));
assert(sync.includes('restartIntoAuthenticatedLauncher()'),'onboarding success must return through launcher with confirmed ownership');
assert(apply.includes('android.permission.SCHEDULE_EXACT_ALARM'));
assert(apply.includes('android.permission.POST_NOTIFICATIONS'));
assert(mergedGate.includes('android.permission.SCHEDULE_EXACT_ALARM'));
assert(mergedGate.includes('android.permission.USE_EXACT_ALARM'),'restricted USE_EXACT_ALARM must be explicitly rejected');

// Exact actual prayer event, independent informational pre-alert.
assert(scheduler.includes('AlarmManager.RTC_WAKEUP'));
assert(scheduler.includes('setExactAndAllowWhileIdle'),'actual prayer event must be exact even in idle');
assert(scheduler.includes('if(pre)')&&scheduler.includes('setAndAllowWhileIdle'),'pre-alert must remain inexact and separate');
assert(scheduler.includes('PendingIntent.getBroadcast')&&scheduler.includes('PrayerNotificationReceiver.class'));
assert(scheduler.includes('PRE_REQ')&&scheduler.includes('boolean pre'));
assert(scheduler.includes('KEY_PLAN = "plan_v1"'));
assert(scheduler.includes('KEY_NATIVE_ACTIVE = "native_active_v1"'));
assert(scheduler.includes('scheduledPrayerCount>0'),'exhausted dated plan must not remain falsely owned by Native');
assert(scheduler.includes('nextPlannedOccurrence(plan, i, now, tz)'));
assert(scheduler.includes('if (actual <= 0L) continue;'),'an exhausted date-stamped prayer must not replay stale daily minutes');
assert(receiver.includes('extends BroadcastReceiver'));
assert(receiver.includes('show(context,id,mode,pre);')&&receiver.includes('PrayerNativeScheduler.reschedule(context);'));
assert(receiver.includes('USAGE_ALARM')&&receiver.includes('rawNameForAdhan'));
assert(receiver.includes('"/raw/"+rawName'),'prayer notification sound URI must use stable raw resource name rather than numeric resource id');
assert(receiver.includes('_v2'),'code4 must use a fresh prayer notification channel contract after the native upgrade');
assert(prayerBoot.includes('ACTION_BOOT_COMPLETED')&&prayerBoot.includes('ACTION_MY_PACKAGE_REPLACED')&&prayerBoot.includes('ACTION_TIMEZONE_CHANGED')&&prayerBoot.includes('ACTION_TIME_CHANGED'));
assert(prayerBoot.includes('ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED'),'granting exact access must restore schedule');
for(const raw of ['adhan_mecca.mp3','adhan_ahmed_al_nufais.mp3','adhan_islam_sobhi.mp3','adhan_fajr.mp3'])assert(apply.includes(raw),`native Adhan package missing ${raw}`);

// Widget remains read-only over authenticated private prayer state.
assert(widget.includes('PrayerNativeScheduler.PREFS'));
assert(!/android:name=["'](?:com\.qiblalabs\.)?WidgetDataActivity["']/.test(apply),'legacy WidgetDataActivity must remain absent');
assert(apply.includes('QiblaWidgetProvider')&&apply.includes('PrayerWidgetSyncActivity'));

// Dated plan must reuse the approved prayer engine; no second calculation engine is introduced.
const plan=read('js/presentation/prayer/native-plan.js');
assert(plan.includes('QiblaPrayerMethods.calculate'));
assert(plan.includes('QiblaPrayerLocation.dateKey'));
assert(plan.includes('sameMinutes(first.times,current)'));
assert(plan.includes('MAX_DAYS=180'));
assert(plan.includes("cacheKey='',cachePlan=null"),'six-month plan must be cached between polling checks');

// Web/native prayer bridge carries the long plan and confirms native ownership before suppressing Web audio.
const webSync=read('js/presentation/prayer/schedule-sync.js');
assert(webSync.includes("TOKEN_KEY='qiblaastro:native-token'"));
assert(webSync.includes("AUTO_KEY='qiblaastro:prayer-native-sync-enabled:v1'"));
assert(webSync.includes("OWNER_KEY='qiblaastro:prayer-native-owner:v1'"));
assert(webSync.includes("LAST_SYNC_KEY='qiblaastro:prayer-native-sync-last:v1'"));
assert(webSync.includes('PLAN_DAYS=180'));
assert(webSync.includes('QiblaPrayerNativePlan.build(PLAN_DAYS)'));
assert(webSync.includes("hp.get('nativeAdhan')"));
assert(webSync.includes('function installWebFallbackGuard()'));
assert(webSync.includes('if(nativeOwnerConfirmed())return;return webCheck(now,cache);'));
assert(webSync.includes("q.set('interactive',interactive?'1':'0')"));
assert(webSync.includes("q.set('onboarding',onboarding?'1':'0')"));
assert(webSync.includes('intent://prayer-sync?')&&webSync.includes('package=com.qiblalabs'));
assert(webSync.includes("maybeAutoSync('startup')")&&webSync.includes("maybeAutoSync('location-changed')")&&webSync.includes("maybeAutoSync('runtime-ready')"));
assert(webSync.includes('if(!p||!Number.isFinite(Number(p.h)))return -1;'),'invalid/missing prayer time must be rejected by minuteFor');
assert(webSync.includes("if(minute<0)return {ready:false,reason:'prayer-times'}"),'invalid prayer minute must stop Native payload readiness');

// Azkar bridge: Android is the source of truth; visible UI never claims success before launcher confirmation.
const azWeb=read('js/azkar-native-reminders.js');
const azPage=read('pages/azkar.html');
const azHost=read('js/presentation/azkar/host.js');
assert(azWeb.includes("token='+encodeURIComponent(token)"));
assert(azWeb.includes('tokenFromHash')&&azWeb.includes('tokenFromStorage'));
assert(azWeb.includes('MIN_INTERVAL=15'));
assert(azWeb.includes('function enforceMinimumInterval()'));
assert(azWeb.includes("p.get('nativeAzkar')"));
assert(azWeb.includes("p.get('azkarResult')")&&azWeb.includes("p.get('azkarIssue')"));
assert(azWeb.includes("'intent://azkar-reminder?token='"));
assert(azWeb.includes('package=com.qiblalabs'));
assert(azWeb.includes('HANDOFF_TIMEOUT_MS=10000'));
assert(azWeb.includes("row.style.setProperty('display','flex','important')"),'status row must remain visible for actionable Native feedback');
assert(azWeb.includes("'جاري تفعيل التنبيه...'"),'button must expose pending Native state rather than optimistic success');
assert(azWeb.includes("showFailure('native-token')"),'missing Native token must not be silently swallowed');
assert(!azWeb.includes("STORAGE_KEY='qiblaastro:native-azkar-reminder:v1'"),'legacy localStorage must not remain the Native source of truth');
assert(!azWeb.includes('a.click()'));
assert(azHost.includes("TOKEN_KEY='qiblaastro:native-token'")&&azHost.includes('seedFrameContext(frame)'));
assert(azPage.includes('#azAudio .az-audio-status{display:flex!important}'),'Azkar reminder status must be visibly rendered');
assert(azPage.includes('azkar-native-reminders.js?v=20260818-native5'),'Azkar page must cache-bust the confirmed bridge release');

// Current early-core boot and service-worker release.
const bootstrap=read('js/presentation/bootstrap.js');
assert(bootstrap.includes('loadPrayerCore(loadPermissions);'));
assert(bootstrap.includes('native-plan.js?v=20260818-adhan-core2')&&bootstrap.includes('schedule-sync.js?v=20260818-adhan-core2'));
const sw=read('service-worker.js');
assert(sw.includes("qiblaastro-v6.20-azkar-native-confirmed"));
assert(sw.includes("AZKAR_RELEASE='azkar-native-confirmed-20260818-v1'"));
assert(sw.includes('./js/presentation/prayer/native-plan.js')&&sw.includes('./js/presentation/prayer/schedule-sync.js')&&sw.includes('./js/azkar-native-reminders.js'));

console.log('Native Android localization/security gate: PASS');
console.log('Prayer: exact RTC_WAKEUP Adhan + separate inexact pre-alert + stable local audio channel: PASS');
console.log('Prayer: POST_NOTIFICATIONS + user-granted SCHEDULE_EXACT_ALARM + confirmed native ownership: PASS');
console.log('Prayer: cached 180-day authoritative dated plan + reboot/time/exact-permission restoration: PASS');
console.log('Azkar: confirmed Native ownership + 15-minute minimum + anchored inexact idle-safe scheduling: PASS');
console.log('Azkar: notification permission/channel recovery + stable v2 local audio path + reboot/update restoration: PASS');
console.log('Widget authenticated/localized contracts: PASS');
