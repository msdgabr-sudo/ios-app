/* Run with: node tests/wmm2025-golden-test.js
 * This test does NOT load the app, compass, camera, or astronomical verification.
 */
'use strict';
const wmm=require('../js/22-wmm2025-engine.js');
const cases=[
 [2025.0,28.0,89.0,-121.0,-99.77],
 [2025.0,48.0,80.0,-96.0,-29.91],
 [2025.0,54.0,82.0,87.0,54.89],
 [2025.0,65.0,43.0,93.0,0.50],
 [2025.0,51.0,-33.0,109.0,-5.49],
 [2025.0,39.0,-59.0,-8.0,-15.75],
 [2025.0,3.0,-50.0,-103.0,27.96],
 [2025.0,94.0,-29.0,-110.0,15.74],
 [2027.0,37.0,-66.0,-5.0,-17.22],
 [2027.0,67.0,72.0,-115.0,13.73],
 [2027.0,44.0,22.0,174.0,6.46],
 [2027.0,54.0,54.0,178.0,0.63]
];
let failed=0;
for(const [year,alt,lat,lon,want] of cases){const got=wmm.calculate(lat,lon,alt,year).declination,err=Math.abs(got-want);const ok=err<0.02;console.log(`${ok?'PASS':'FAIL'} ${year} lat=${lat} lon=${lon} D=${got.toFixed(3)} expected=${want.toFixed(2)} err=${err.toFixed(3)}`);if(!ok)failed++;}
if(failed){console.error(`WMM2025 GATE FAILED: ${failed}/${cases.length}`);process.exit(1);}else console.log(`WMM2025 GATE PASSED: ${cases.length}/${cases.length}`);
