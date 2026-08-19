/* QiblaAstro — Live deviation confidence presentation
 * Presentation only. Mirrors the already-rendered live deviation in each compass mode.
 * Does not calculate Qibla, modify device heading, verification records, or scientific engines.
 * © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
 */
(function(root){
'use strict';
var timer=0;
function byId(id){return root.document?root.document.getElementById(id):null;}
function finite(v){return typeof v==='number'&&Number.isFinite(v);}
function readDegrees(id){var el=byId(id);if(!el)return NaN;var m=String(el.textContent||'').replace(/,/g,'.').match(/-?\d+(?:\.\d+)?/);return m?Math.abs(Number(m[0])):NaN;}
function confidenceFromDeviation(deg){
  var d=Math.max(0,Math.min(180,Number(deg)));
  if(!finite(d))return {score:null,label:'بانتظار الاتجاه',state:'empty'};
  var score;
  if(d<=1)score=100-(d*2);
  else if(d<=3)score=98-((d-1)*9);
  else if(d<=10)score=80-((d-3)*(30/7));
  else score=50-((d-10)*(50/170));
  score=Math.max(0,Math.min(100,Math.round(score)));
  if(d<=1)return {score:score,label:'ممتازة',state:'excellent'};
  if(d<=3)return {score:score,label:'جيدة',state:'good'};
  if(d<=10)return {score:score,label:'متوسطة',state:'fair'};
  return {score:score,label:'منخفضة',state:'weak'};
}
function ensureAstro(){
  var box=byId('qa-astro-confidence');if(!box)return null;
  var card=box.querySelector('.qa-confidence-compact');if(!card)return null;
  if(card.getAttribute('data-live-deviation-confidence')==='1')return card;
  card.setAttribute('data-live-deviation-confidence','1');
  card.innerHTML='<span class="qa-row-icon">◎</span><div class="qa-live-confidence-copy"><b>درجة الثقة</b><strong id="qa-live-astro-confidence-score">—</strong><small id="qa-live-astro-confidence-label">بانتظار الاتجاه</small><span class="qa-live-confidence-track"><i></i></span></div>';
  return card;
}
function ensureDigital(){
  var card=byId('qa-digital-confidence-card');if(!card)return null;
  if(card.getAttribute('data-live-deviation-confidence')==='1')return card;
  card.setAttribute('data-live-deviation-confidence','1');
  var oldLive=card.querySelector('.qa-digital-confidence-live');if(oldLive)oldLive.style.display='none';
  var oldTrack=card.querySelector('.qa-digital-confidence-track');if(oldTrack)oldTrack.style.display='none';
  var body=card.querySelector('.qa-digital-confidence-body');if(!body)return card;
  var live=root.document.createElement('div');live.className='qa-live-digital-confidence';
  live.innerHTML='<strong id="qa-live-digital-confidence-score">—</strong><small id="qa-live-digital-confidence-label">بانتظار الاتجاه</small><span class="qa-live-confidence-track"><i></i></span>';
  body.appendChild(live);return card;
}
function paint(card,scoreEl,labelEl,data){
  if(!card||!scoreEl||!labelEl)return;
  card.setAttribute('data-live-state',data.state);
  scoreEl.textContent=data.score===null?'—':data.score+'%';
  labelEl.textContent=data.label;
  var bar=card.querySelector('.qa-live-confidence-track i');if(bar)bar.style.width=(data.score===null?0:data.score)+'%';
}
function updateAstro(){
  var card=ensureAstro();if(!card)return;
  var d=readDegrees('astro-deviation-value');
  paint(card,byId('qa-live-astro-confidence-score'),byId('qa-live-astro-confidence-label'),confidenceFromDeviation(d));
}
function updateDigital(){
  var card=ensureDigital();if(!card)return;
  var d=readDegrees('box-diff');
  paint(card,byId('qa-live-digital-confidence-score'),byId('qa-live-digital-confidence-label'),confidenceFromDeviation(d));
}
function update(){updateAstro();updateDigital();}
function start(){if(timer)return;update();timer=root.setInterval(update,200);}
root.QiblaLiveDeviationConfidence=Object.freeze({update:update,confidenceFromDeviation:confidenceFromDeviation});
if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',start,{once:true});else start();}
})(typeof globalThis!=='undefined'?globalThis:window);
