// Run after js/engines/wmm2025-isolated.js. This file is isolated from app runtime.
const WMM2025_REFERENCE_CASES = [
  [2025,0,80,0,1.28], [2025,0,0,120,-0.16], [2025,0,-80,-120,68.78],
  [2025,100,80,0,0.85], [2025,100,0,120,-0.15], [2025,100,-80,-120,68.21],
  [2027.5,0,80,0,2.59], [2027.5,0,0,120,-0.24], [2027.5,0,-80,-120,68.49]
];
function runWMM2025Gate(){
  return WMM2025_REFERENCE_CASES.map(function(t){
    const r=QiblaWMM2025.declination(t[2],t[3],t[1],t[0]);
    const error=Math.abs(r.declination-t[4]);
    return {year:t[0],altKm:t[1],lat:t[2],lon:t[3],expected:t[4],actual:r.declination,error:error,pass:error<0.02};
  });
}
if(typeof window!=='undefined') window.runWMM2025Gate=runWMM2025Gate;
