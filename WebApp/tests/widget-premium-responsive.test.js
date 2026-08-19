'use strict';
const fs=require('fs'),assert=require('assert');
const read=p=>fs.readFileSync(p,'utf8');

const provider=read('android-twa/native/widget/QiblaWidgetProvider.java');
const compact=read('android-twa/native/widget/qibla_widget_compact.xml');
const medium=read('android-twa/native/widget/qibla_widget.xml');
const large=read('android-twa/native/widget/qibla_widget_large.xml');
const info=read('android-twa/native/widget/qibla_widget_info.xml');
const apply=read('android-twa/apply_native_widget.ps1');

for(const token of ['MODE_COMPACT','MODE_MEDIUM','MODE_LARGE','onAppWidgetOptionsChanged','OPTION_APPWIDGET_MIN_WIDTH','OPTION_APPWIDGET_MIN_HEIGHT','R.layout.qibla_widget_compact','R.layout.qibla_widget_large']){
  assert(provider.includes(token),`responsive widget provider missing ${token}`);
}
for(const token of ['Build.VERSION_CODES.S','Map<SizeF, RemoteViews>','new SizeF(110f, 110f)','new SizeF(245f, 110f)','new SizeF(245f, 180f)','new RemoteViews(viewMapping)']){
  assert(provider.includes(token),`Android 12 responsive RemoteViews contract missing ${token}`);
}
for(const forbidden of ['calcQibla','WMM2025','sunPos(','moonPos(','solarEvts(','navigator.geolocation','bigdatacloud','LAT','LON']){
  assert(!provider.includes(forbidden),`widget provider must remain presentation-only: ${forbidden}`);
}
assert(provider.includes('PrayerNativeScheduler.PREFS'),'widget must continue reading only the authenticated private prayer store');
assert(!provider.includes('.edit()'),'widget must remain read-only');
assert(provider.includes('DateFormat.getTimeFormat(context)'),'widget times must respect the device time format');

const commonIds=['widget_root','widget_city','widget_hijri','widget_next_prayer','widget_prayer_time','widget_qibla'];
for(const [name,xml] of [['compact',compact],['medium',medium],['large',large]]){
  for(const id of commonIds)assert(xml.includes(`@+id/${id}`),`${name} layout missing ${id}`);
  assert(xml.includes('@drawable/qibla_widget_bg'),`${name} layout missing premium surface`);
}
const prayerIds=['fajr','dhuhr','asr','maghrib','isha'];
for(const xml of [medium,large])for(const id of prayerIds){
  assert(xml.includes(`@+id/widget_${id}_name`),`prayer strip missing ${id} name`);
  assert(xml.includes(`@+id/widget_${id}_time`),`prayer strip missing ${id} time`);
}
assert(large.includes('@+id/widget_updated'),'large widget must expose last update state');

for(const token of ['android:minWidth="110dp"','android:minHeight="110dp"','android:targetCellWidth="4"','android:targetCellHeight="2"','android:previewLayout="@layout/qibla_widget"','android:resizeMode="horizontal|vertical"']){
  assert(info.includes(token),`widget provider info missing ${token}`);
}
for(const file of ['qibla_widget_compact.xml','qibla_widget_large.xml'])assert(apply.includes(file),`Android package integration missing ${file}`);
assert(apply.includes("res\\drawable"),'widget drawable resources must be packaged into the AAB');

for(const set of ['values','values-en','values-fr','values-id','values-ur']){
  const strings=read(`android-twa/native/widget/res/${set}/strings.xml`);
  for(const key of ['widget_description','widget_location_unavailable_short','widget_next_prayer_label','widget_qibla_label','widget_true_north','widget_qibla_degrees','widget_updated_value']){
    assert(strings.includes(`name="${key}"`),`${set} missing ${key}`);
  }
}
for(const drawable of ['qibla_widget_bg.xml','qibla_widget_panel.xml','qibla_widget_panel_gold.xml','qibla_widget_strip.xml']){
  assert(fs.existsSync(`android-twa/native/widget/res/drawable/${drawable}`),`missing ${drawable}`);
}

console.log('Premium responsive widget: PASS');
console.log('2x2 compact + 4x2 medium + 4x3 large responsive RemoteViews buckets: PASS');
console.log('Scope guard: widget remains read-only; Qibla/prayer/astronomy/location calculations untouched: PASS');
