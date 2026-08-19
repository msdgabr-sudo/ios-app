// ══════════════════════════════════════════════════════════════════════════════
// [JS-15] PRAYER TIMES — MWL method
// ══════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════
//  PRAYER TIMES — MWL method
// ════════════════════════════════════════════════
const PICO={'الفجر':'🌙','الشروق':'🌅','الظهر':'☀️','العصر':'🌤️','المغرب':'🌇','العشاء':'🌃'};
function calcPrayers(evts){
  if(!evts)return null;
  const{rH,sH,nH,dec}=evts;
  const f=LAT*D2R,d2=dec*D2R;
  const ha=a=>{const c=(Math.sin(a*D2R)-Math.sin(f)*Math.sin(d2))/(Math.cos(f)*Math.cos(d2));return Math.abs(c)>1?null:Math.acos(c)*R2D/15;};
  const fix=h=>((h%24)+24)%24;
  const Hf=ha(-18),Hi=ha(-17),Ha=ha(Math.atan(1/(1+Math.tan(Math.abs(f-d2))))*R2D);
  return[
    {n:'الفجر',h:fix(Hf?nH-Hf:rH-1.5)},{n:'الشروق',h:fix(rH)},
    {n:'الظهر',h:fix(nH+2/60)},{n:'العصر',h:fix(Ha?nH+Ha:nH+3.5)},
    {n:'المغرب',h:fix(sH+4/60)},{n:'العشاء',h:fix(Hi?nH+Hi:sH+1.25)}
  ];
}



// ══════════════════════════════════════════════════════════════════════════════
// [JS-22] PRAYER UI
// ══════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════
//  PRAYER UI
// ════════════════════════════════════════════════
let pCache=null,pKey='';
function prayerCacheKey(now){
  // Presentation/cache safety only: keep the existing location provider and
  // prayer engine untouched, but never reuse today's schedule after LAT/LON
  // changes. 4 decimals is ~11 m, well below a city-level move while avoiding
  // needless recalculation from tiny GNSS jitter.
  const lat=Number.isFinite(Number(LAT))?Number(LAT).toFixed(4):'na';
  const lon=Number.isFinite(Number(LON))?Number(LON).toFixed(4):'na';
  return now.toDateString()+'|'+lat+'|'+lon;
}
function updatePrayers(now,evts){
  const dk=prayerCacheKey(now);
  if(dk!==pKey){pCache=calcPrayers(evts);pKey=dk;}
  const pr=pCache;if(!pr)return;
  const lh=now.getHours()+now.getMinutes()/60+now.getSeconds()/3600;
  let ci=-1;for(let i=pr.length-1;i>=0;i--)if(lh>=pr[i].h){ci=i;break;}
  const ni=(ci+1)%pr.length;
  const np=pr[ni];let stn=(np.h-lh)*3600;if(stn<0)stn+=86400;
  const ph=ci>=0?pr[ci].h:pr[pr.length-1].h-24;
  let span=(np.h-ph)*3600;if(span<0)span+=86400;
  set('p-cd',shms(stn));set('p-nn',np.n);
  const pf=gel('p-prog');if(pf)pf.style.width=Math.max(0,Math.min(100,(span-stn)/span*100)).toFixed(1)+'%';
  const pl=gel('p-list');
  if(pl)pl.innerHTML=pr.map((p,i)=>{
    const isN=i===ni,isPa=!isN&&ci>=0&&i<=ci;
    return`<div class="p-row${isN?' curr':isPa?' past':''}"><div class="p-ico">${PICO[p.n]||'🕌'}</div><div class="p-name">${p.n}</div>${isN?'<div class="p-tag">قادمة</div>':''}<div class="p-time">${hm(p.h)}</div></div>`;
  }).join('');
}



// ══════════════════════════════════════════════════════════════════════════════
// [JS-23] METHOD RANKING
// ══════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════
//  METHOD RANKING
// ════════════════════════════════════════════════
function buildMethods(malt,mill,salt){
  const night=salt<-6,moonOk=malt>5&&mill>.12;
  const items=[
    {ico:'⭐',t:'نجم القطب — بولاريس',d:'ارتفاعه ثابت 30° شمالاً · دقة < 0.02°',v:`القبلة = ${QT.toFixed(1)}° منه باتجاه عقارب الساعة`,cls:night?'best':'',tag:'ahi',r:night?'متاح الآن 🌙':'انتظر الظلام'},
    {ico:'🌙',t:'موضع القمر ELP2000',d:`حساب فلكي دقيق ±0.1° · مرجع اتجاهي موثوق`,v:moonOk?`القمر الآن سمت ${moonPos(new Date()).az.toFixed(0)}° ارتفاع ${malt.toFixed(0)}°`:'الارتفاع أو الإضاءة غير كافيَيْن',cls:moonOk?'best':'',tag:moonOk?'ahi':'tag-lo',r:moonOk?'متاح الآن 🌙':'غير كافٍ الآن'},
    {ico:'✨',t:'النجوم المرشدة',d:'الجوزاء غرباً · العقرب جنوباً · نجوم الدب يشيرون لبولاريس',v:'دقة ~5° مع التدريب البسيط',cls:night?'good':'',tag:'amid',r:night?'السماء مظلمة الآن':'انتظر الليل'},
    {ico:'🧭',t:'بوصلة + تصحيح WMM2025',d:`اطرح ${MDECL.toFixed(2)}° من قراءة البوصلة للتصحيح`,v:`قبلة البوصلة المصحَّحة = ${QM.toFixed(1)}°`,cls:'good',tag:'amid',r:'متاح دائماً — يتأثر بمعايرة الهاتف'},
  ];
  const el=gel('methList');if(!el)return;
  el.innerHTML=items.map(m=>`<div class="m-item ${m.cls}"><div class="m-ico">${m.ico}</div><div class="m-body"><div class="m-title">${m.t}${m.cls==='best'?' ✓':''}</div><div class="m-desc">${m.d}</div><div class="m-val" style="color:${m.cls==='best'?'var(--gold-l)':m.cls==='good'?'var(--gold)':'var(--txt3)'}">${m.v}</div><span class="m-tag ${m.tag}">${m.r}</span></div></div>`).join('');
}
