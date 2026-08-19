'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const helperPath='js/presentation/compass/trusted-qibla-refresh.js';
const src=fs.readFileSync(helperPath,'utf8');
const bootstrap=fs.readFileSync('js/presentation/bootstrap.js','utf8');

assert(!/activateCompass\s*\(/.test(src),'presentation bridge must not activate compass sensor');
assert(!/deviceHeading\s*=/.test(src),'presentation bridge must not modify device heading');
assert(!/calcQibla\s*\(/.test(src),'presentation bridge must not calculate QT');
assert(!/getUserMedia\s*\(|AstronomicalVerification|celestialSolver|verificationEngine/i.test(src),'presentation bridge must not call camera/verification/solver runtime');
assert(src.includes("getElementById('q-deg')"),'bridge must observe the existing displayed Qibla value');
assert(src.includes('MutationObserver'),'bridge must handle GPS arriving after Premium mount');
assert(src.includes('root.drawCompass('),'bridge must request presentation redraw only');

const premiumPos=bootstrap.indexOf("js/compass-premium-render.js");
const helperPos=bootstrap.indexOf('js/presentation/compass/trusted-qibla-refresh.js');
assert(premiumPos>=0&&helperPos>premiumPos,'bridge must load only after Premium renderer');

function runCase(initialQ, laterQ){
  let draws=0;
  let observerCb=null;
  const qEl={textContent:initialQ};
  class FakeMutationObserver{
    constructor(cb){observerCb=cb;}
    observe(){}
    disconnect(){}
  }
  const sandbox={
    QT:Number.NaN,
    document:{
      readyState:'complete',
      getElementById(id){return id==='q-deg'?qEl:null;},
      addEventListener(){}
    },
    MutationObserver:FakeMutationObserver,
    setTimeout(fn){fn();return 1;},
    drawCompass(){draws++;},
    console
  };
  vm.createContext(sandbox);
  vm.runInContext(src,sandbox,{filename:helperPath});
  if(laterQ!==undefined){
    assert.strictEqual(draws,0,'must not draw pointer before trusted Qibla value exists');
    qEl.textContent=laterQ;
    assert(observerCb,'observer must be installed while Qibla is unresolved');
    observerCb();
  }
  return draws;
}

assert.strictEqual(runCase('136.0°'),1,'GPS/QT ready before Premium: render exactly once');
assert.strictEqual(runCase('---','136.0°'),1,'Premium ready before GPS/QT: render exactly once when value arrives');

console.log('Trusted Qibla → Premium presentation ordering gate: PASS');
console.log('Cases: QT before Premium = PASS; QT after Premium = PASS; sensor activation = NONE');
