/* QiblaAstro — Digital Compass read-only presentation adapter
 * Presentation contract only. It reads canonical engine-written DOM outputs and invokes existing public actions.
 * It does not calculate, mutate, or own Qibla/GNSS/device-heading/verification truth.
 * © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
 */
(function(root){'use strict';
  function doc(){return root.document||null;}
  function byId(id){var d=doc();return d?d.getElementById(id):null;}
  function text(id){var el=byId(id);return el?String(el.textContent||'').trim():'';}
  function numberFrom(id){var m=text(id).replace(/,/g,'.').match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):null;}
  function finite(v){return typeof v==='number'&&Number.isFinite(v);}

  function snapshot(){
    var heading=numberFrom('box-heading');
    var qibla=numberFrom('box-qibla');
    var deviation=numberFrom('box-diff');
    var accuracy=numberFrom('compass-accuracy');
    return Object.freeze({
      qiblaDeg:finite(qibla)?qibla:null,
      headingDeg:finite(heading)?heading:null,
      deviationDeg:finite(deviation)?deviation:null,
      accuracyDeg:finite(accuracy)?accuracy:null,
      qiblaText:text('box-qibla'),
      headingText:text('box-heading'),
      headingHint:text('live-compass-hint'),
      deviationText:text('box-diff'),
      deviationSide:text('box-dir'),
      accuracyText:text('compass-accuracy'),
      gnssLabel:text('gnss-badge'),
      gnssStatus:text('gnss-btn-status')
    });
  }

  function invoke(name){
    var fn=root[name];
    if(typeof fn!=='function')return false;
    fn();return true;
  }
  function activateCompass(){
    if(typeof root._qiblaActivateLiveCompass==='function'){root._qiblaActivateLiveCompass();return true;}
    if(typeof root.activateCompass==='function'){root.activateCompass();return true;}
    return false;
  }
  function requestGnss(){return invoke('tryBrowserGPS');}
  function openCalibration(){return invoke('showManualCal');}
  function closeCalibration(){return invoke('hideManualCal');}
  function resetCalibration(){return invoke('resetCompassCalibration');}
  function goHome(){
    if(typeof root.GT==='function'){root.GT('home');return true;}
    return false;
  }

  root.QiblaDigitalCompassAdapter=Object.freeze({
    snapshot:snapshot,
    activateCompass:activateCompass,
    requestGnss:requestGnss,
    openCalibration:openCalibration,
    closeCalibration:closeCalibration,
    resetCalibration:resetCalibration,
    goHome:goHome
  });
})(typeof globalThis!=='undefined'?globalThis:window);
