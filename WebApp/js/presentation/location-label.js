/* QiblaAstro — presentation-only city/country label resolver.
 * Reads existing GNSS values for labels only; never writes GNSS/Qibla state.
 */
(function(){
'use strict';var CACHE_KEY='qiblaastro-city-label-v1',lastKey='',currentLabel='',inFlight=false,lastAttemptAt=0,MIN_RETRY_MS=60000;
function el(){return document.getElementById('prayer-location-label');}function safeText(v){return typeof v==='string'?v.trim():'';}
function makeLabel(data){if(!data||typeof data!=='object')return'';var city=safeText(data.city)||safeText(data.locality)||safeText(data.principalSubdivision),country=safeText(data.countryName);if(city&&country&&city!==country)return city+'، '+country;return city||country||'';}
function cacheKey(lat,lon){return Number(lat).toFixed(2)+','+Number(lon).toFixed(2);}function readCache(key){try{var o=JSON.parse(localStorage.getItem(CACHE_KEY)||'null');if(o&&o.key===key&&o.label)return o.label;}catch(e){}return'';}function writeCache(key,label){try{localStorage.setItem(CACHE_KEY,JSON.stringify({key:key,label:label,ts:Date.now()}));}catch(e){}}
function publish(label){label=safeText(label);if(!label)return;currentLabel=label;var target=el();try{var pl=window.QiblaPrayerLocation&&window.QiblaPrayerLocation.effective?window.QiblaPrayerLocation.effective():null;if(target&&!(pl&&pl.mode==='manual'))target.textContent=label;}catch(_){if(target)target.textContent=label;}try{window.dispatchEvent(new CustomEvent('qiblaastro:location-label',{detail:{label:label}}));}catch(e){}}
function resolve(){var lat,lon,source;try{lat=LAT;lon=LON;source=gnssSource;}catch(e){return;}if(!Number.isFinite(Number(lat))||!Number.isFinite(Number(lon))||source!=='gps')return;var key=cacheKey(lat,lon),cached=readCache(key);if(cached){publish(cached);lastKey=key;return;}publish('موقعك الحالي · GPS');var now=Date.now();if(inFlight||lastKey===key&&now-lastAttemptAt<MIN_RETRY_MS)return;inFlight=true;lastAttemptAt=now;lastKey=key;var url='https://api.bigdatacloud.net/data/reverse-geocode-client?latitude='+encodeURIComponent(lat)+'&longitude='+encodeURIComponent(lon)+'&localityLanguage=ar';fetch(url,{method:'GET',mode:'cors',credentials:'omit'}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}).then(function(data){var label=makeLabel(data);if(label){writeCache(key,label);publish(label);}}).catch(function(){}).finally(function(){inFlight=false;});}
window.QiblaLocationLabel={update:resolve,getLabel:function(){return currentLabel||safeText(el()&&el().textContent);}};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',resolve,{once:true});else resolve();setInterval(resolve,5000);
})();

/* Prayer dependency chain only. */
(function(){
'use strict';if(!document)return;
function script(src,marker,onload){if(document.querySelector('script['+marker+']')){if(onload)onload();return;}var s=document.createElement('script');s.src=src;s.async=false;s.setAttribute(marker,'true');if(onload)s.onload=onload;(document.head||document.documentElement).appendChild(s);}
function style(href,marker){if(document.querySelector('link['+marker+']'))return;var l=document.createElement('link');l.rel='stylesheet';l.href=href;l.setAttribute(marker,'true');(document.head||document.documentElement).appendChild(l);}
function loadUi(){style('css/presentation/prayer/settings-overrides.css?v=20260814-prayer-settings2','data-qibla-prayer-settings-overrides');script('js/presentation/prayer/calculation-settings-ui.js?v=20260814-global-prayer2','data-qibla-prayer-calculation-settings-ui');script('js/presentation/prayer/location-settings-ui.js?v=20260814-prayer-location2','data-qibla-prayer-location-settings-ui');}
function loadSync(){script('js/runtime/trusted-location-dependent-sync.js?v=20260814-prayer-runtime6','data-qibla-trusted-location-runtime-sync');loadUi();}
function loadFormat(){script('js/prayer/time-format.js?v=20260814-prayer-12h1','data-qibla-prayer-time-format',loadSync);}
function loadLocation(){script('js/prayer/prayer-location.js?v=20260814-prayer-location2','data-qibla-prayer-location',loadFormat);}
function loadSettings(){script('js/prayer/prayer-settings.js?v=20260814-global-prayer1','data-qibla-prayer-settings',loadLocation);}
function loadMethods(){script('js/prayer/calculation-methods.js?v=20260814-global-prayer2','data-qibla-prayer-methods',loadSettings);}
function afterTimezone(){loadMethods();}
if(window.QiblaLocalTimezone&&window.QiblaLocalTimezone.isInstalled&&window.QiblaLocalTimezone.isInstalled()){afterTimezone();return;}
if(document.querySelector('script[data-qibla-local-timezone-adapter]')){window.addEventListener('qiblaastro:timezone-adapter-ready',afterTimezone,{once:true});return;}
script('js/runtime/local-timezone-adapter.js?v=20260814-timezone1','data-qibla-local-timezone-adapter',afterTimezone);
})();
