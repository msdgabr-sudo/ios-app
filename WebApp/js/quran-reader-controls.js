(()=>{'use strict';
const save=document.getElementById('qrSavePlace');
if(!save)return;
const reader=document.getElementById('qrReader');
const surface=document.getElementById('qrReadingSurface');
const quick=document.getElementById('qrReaderBookmark');
const toast=document.getElementById('qrReaderToast');
let timer=null,immersiveTimer=null;
function notice(msg,ms=1100){if(!toast)return;toast.textContent=msg;toast.classList.add('is-on');clearTimeout(notice._t);notice._t=setTimeout(()=>toast.classList.remove('is-on'),ms)}
function calmLater(){clearTimeout(immersiveTimer);immersiveTimer=setTimeout(()=>{if(reader&&reader.classList.contains('is-active'))reader.classList.add('is-calm')},3200)}
function wake(){if(reader)reader.classList.remove('is-calm');calmLater()}
if(surface)surface.addEventListener('click',wake);
['scroll','touchmove'].forEach(ev=>window.addEventListener(ev,calmLater,{passive:true}));

save.addEventListener('click',()=>{
  save.classList.add('is-saved');const label=save.querySelector('small');const old=label?label.textContent:'';
  if(label)label.textContent='تم الحفظ';clearTimeout(timer);timer=setTimeout(()=>{save.classList.remove('is-saved');if(label)label.textContent=old||'حفظ الموضع'},1300);calmLater();
});

/* Independent reference marks: keep several reading places, separate from the main resume point. */
const MARKS='qibla_quran_reference_marks_v1';
function currentMark(){const surah=(document.getElementById('qrReaderSurah')?.textContent||'').trim();const meta=(document.getElementById('qrReaderMeta')?.textContent||'').trim();const active=[...document.querySelectorAll('#qrText [data-ayah],#qrText .qr-ayah')].find(el=>{const r=el.getBoundingClientRect();return r.bottom>120&&r.top<innerHeight*.62});const ayah=active?.dataset?.ayah||active?.dataset?.number||'';return{surah,meta,ayah,at:Date.now()}}
function addReference(){let marks=[];try{marks=JSON.parse(localStorage.getItem(MARKS)||'[]')}catch{}const mark=currentMark();const key=`${mark.surah}|${mark.ayah}`;marks=marks.filter(m=>`${m.surah}|${m.ayah}`!==key);marks.unshift(mark);marks=marks.slice(0,20);localStorage.setItem(MARKS,JSON.stringify(marks));notice(mark.ayah?`أضيفت علامة عند الآية ${mark.ayah}`:'أضيفت علامة مرجعية');if(quick){quick.classList.add('is-marked');setTimeout(()=>quick.classList.remove('is-marked'),900)}}
if(quick)quick.addEventListener('click',e=>{e.stopPropagation();addReference();calmLater()});

const minus=document.getElementById('qrFontMinus'),plus=document.getElementById('qrFontPlus'),text=document.getElementById('qrText');
if(!minus||!plus||!text)return;
const KEY='qibla_quran_font_scale',MIN=.84,MAX=1.28,STEP=.08;let scale=Number(localStorage.getItem(KEY)||1);if(!Number.isFinite(scale))scale=1;scale=Math.min(MAX,Math.max(MIN,scale));
function baseSize(){return window.matchMedia('(max-width:390px)').matches?1.43:1.53}
function apply(show=false){text.style.setProperty('font-size',(baseSize()*scale).toFixed(3)+'rem','important');minus.disabled=scale<=MIN+.001;plus.disabled=scale>=MAX-.001;localStorage.setItem(KEY,String(scale));if(show)notice(`حجم الخط ${Math.round(scale*100)}٪`,900)}
minus.addEventListener('click',e=>{e.stopPropagation();scale=Math.max(MIN,+(scale-STEP).toFixed(2));apply(true);calmLater()});plus.addEventListener('click',e=>{e.stopPropagation();scale=Math.min(MAX,+(scale+STEP).toFixed(2));apply(true);calmLater()});window.addEventListener('resize',()=>apply(false),{passive:true});apply(false);calmLater();
})();
