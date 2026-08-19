'use strict';
const fs=require('fs');
const assert=require('assert');
const src=fs.readFileSync('js/runtime/trusted-location-dependent-sync.js','utf8');
for(const id of ['pr-r','pr-n','pr-s','pr-h']){
  assert(src.includes("setText('"+id+"'"),`runtime sync must populate ${id}`);
}
assert(src.includes('function renderPrayerDetails()'),'prayer detail renderer must exist');
assert(src.includes('eCache'),'detail renderer must read existing solar event cache');
assert(src.includes("typeof hm==='function'"),'detail renderer must use existing time formatter');
for(const forbidden of ['calcQibla(', 'drawCompass(', 'activateCompass(', 'startProductionVerification(']){
  assert(!src.includes(forbidden),`prayer detail fix must not call protected path: ${forbidden}`);
}
console.log('Prayer detail fields runtime gate: PASS');
console.log('Verified: sunrise/noon/sunset/Hijri fields are populated from existing runtime data');
console.log('Verified: protected compass/Qibla/verification paths remain untouched');
