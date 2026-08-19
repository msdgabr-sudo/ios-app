'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const src=fs.readFileSync('js/05-gnss.js','utf8');

function makeContext(nativeResult, nativeReject){
  let browserCalls=0;
  const nodes=new Map();
  const context={
    console,
    Date,
    Math,
    Number,
    Promise,
    setTimeout,
    clearTimeout,
    window:null,
    navigator:{
      geolocation:{
        getCurrentPosition(){browserCalls++;},
        watchPosition(){browserCalls++;return 1;},
        clearWatch(){}
      },
      vibrate(){}
    },
    document:{
      getElementById(id){
        if(!nodes.has(id))nodes.set(id,{textContent:'',style:{},scrollIntoView(){}});
        return nodes.get(id);
      }
    },
    MDECL_READY:false,
    MDECL_STATUS:'unavailable',
    MDECL_FIELD:null,
    MDECL:0,
    QT:0,
    QM:0,
    _rawHeading:null,
    compassAvailable:false,
    calOffset:0
  };
  context.set=(id,value)=>{context.document.getElementById(id).textContent=String(value);};
  context.refreshMdeclFromTrustedGnss=()=>{
    context.MDECL_READY=true;
    context.MDECL_STATUS='ready';
    context.MDECL=2;
    return true;
  };
  context.calcQibla=(lat,lon)=>(lat+lon+360)%360;
  context.window=context;
  context.QiblaIOSNative={
    platform:'ios',
    requestLocation(){
      if(nativeReject)return Promise.reject(nativeReject);
      return Promise.resolve(nativeResult);
    }
  };
  vm.createContext(context);
  vm.runInContext(src,context,{filename:'05-gnss.js'});
  return {context,nodes,getBrowserCalls:()=>browserCalls};
}

async function flush(){await Promise.resolve();await Promise.resolve();}

(async()=>{
  const now=Date.now();
  const good=makeContext({
    type:'location',requestId:'test',ok:true,source:'core-location',fullAccuracy:true,
    timestamp:now,
    coords:{latitude:30.0444,longitude:31.2357,accuracy:7.5,altitude:25}
  });
  vm.runInContext('tryBrowserGPS()',good.context);
  await flush();
  assert.strictEqual(vm.runInContext('gnssHasTrustedFix',good.context),true,'fresh full-accuracy Core Location fix must become trusted');
  assert.strictEqual(vm.runInContext('gnssSource',good.context),'gps');
  assert.strictEqual(vm.runInContext('LAT',good.context),30.0444);
  assert.strictEqual(vm.runInContext('LON',good.context),31.2357);
  assert.strictEqual(good.getBrowserCalls(),0,'native iOS must not fall back to browser geolocation');

  const reduced=makeContext(null,{code:'reduced-accuracy'});
  vm.runInContext('tryBrowserGPS()',reduced.context);
  await flush();
  assert.strictEqual(vm.runInContext('gnssHasTrustedFix',reduced.context),false,'reduced accuracy must never be marked trusted');
  assert.strictEqual(vm.runInContext('gnssSource',reduced.context),'unresolved');
  assert.strictEqual(reduced.getBrowserCalls(),0,'failed native iOS request must not fall back to browser geolocation');
  assert.match(reduced.nodes.get('compass-status-msg').textContent,/الموقع الدقيق/);

  const stale=makeContext({
    type:'location',requestId:'test',ok:true,source:'core-location',fullAccuracy:true,
    timestamp:now-60000,
    coords:{latitude:30.0444,longitude:31.2357,accuracy:5,altitude:25}
  });
  vm.runInContext('tryBrowserGPS()',stale.context);
  await flush();
  assert.strictEqual(vm.runInContext('gnssHasTrustedFix',stale.context),false,'stale Core Location fix must be rejected');

  const invalid=makeContext({
    type:'location',requestId:'test',ok:true,source:'core-location',fullAccuracy:true,
    timestamp:now,
    coords:{latitude:200,longitude:31.2,accuracy:5,altitude:0}
  });
  vm.runInContext('tryBrowserGPS()',invalid.context);
  await flush();
  assert.strictEqual(vm.runInContext('gnssHasTrustedFix',invalid.context),false,'out-of-range coordinate must be rejected');

  for(const forbidden of ['ipapi','ipinfo','geolocation-db']){
    assert(!src.toLowerCase().includes(forbidden.toLowerCase()),`forbidden approximate location provider: ${forbidden}`);
  }
  assert(src.includes("result.source!=='core-location'"));
  assert(src.includes("result.fullAccuracy!==true"));
  assert(src.includes("gnssSource='gps'"));
  assert(src.includes("gnssHasTrustedFix=true"));

  console.log('iOS Core Location -> Trusted GNSS gate: PASS');
  console.log('Verified: full accuracy + freshness + coordinate validity required; no browser/IP fallback on native iOS.');
})().catch(error=>{console.error(error);process.exit(1);});
