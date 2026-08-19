(()=>{'use strict';
const reader=document.getElementById('qrReader');
const meta=document.getElementById('qrReaderMeta');
const title=document.getElementById('qrReaderSurah');
if(!reader||!meta||!title)return;
const SURAHS=['الفاتحة','البقرة','آل عمران','النساء','المائدة','الأنعام','الأعراف','الأنفال','التوبة','يونس','هود','يوسف','الرعد','إبراهيم','الحجر','النحل','الإسراء','الكهف','مريم','طه','الأنبياء','الحج','المؤمنون','النور','الفرقان','الشعراء','النمل','القصص','العنكبوت','الروم','لقمان','السجدة','الأحزاب','سبأ','فاطر','يس','الصافات','ص','الزمر','غافر','فصلت','الشورى','الزخرف','الدخان','الجاثية','الأحقاف','محمد','الفتح','الحجرات','ق','الذاريات','الطور','النجم','القمر','الرحمن','الواقعة','الحديد','المجادلة','الحشر','الممتحنة','الصف','الجمعة','المنافقون','التغابن','الطلاق','التحريم','الملك','القلم','الحاقة','المعارج','نوح','الجن','المزمل','المدثر','القيامة','الإنسان','المرسلات','النبأ','النازعات','عبس','التكوير','الانفطار','المطففين','الانشقاق','البروج','الطارق','الأعلى','الغاشية','الفجر','البلد','الشمس','الليل','الضحى','الشرح','التين','العلق','القدر','البينة','الزلزلة','العاديات','القارعة','التكاثر','العصر','الهمزة','الفيل','قريش','الماعون','الكوثر','الكافرون','النصر','المسد','الإخلاص','الفلق','الناس'];
const JUZ=[[1,1],[2,142],[2,253],[3,93],[4,24],[4,148],[5,82],[6,111],[7,88],[8,41],[9,93],[11,6],[12,53],[15,1],[17,1],[18,75],[21,1],[23,1],[25,21],[27,56],[29,46],[33,31],[36,28],[39,32],[41,47],[46,1],[51,31],[58,1],[67,1],[78,1]];
const ar=n=>String(n).replace(/\d/g,d=>'٠١٢٣٤٥٦٧٨٩'[d]);
function pos(){const name=title.textContent.replace(/^سورة\s+/,'').trim();const s=SURAHS.indexOf(name)+1;const cur=document.querySelector('.qr-ayah.is-current');const a=Number(cur?.dataset?.ayah)||1;return{s:s||1,a}}
function juzOf(s,a){let j=1;for(let i=0;i<JUZ.length;i++){const [js,ja]=JUZ[i];if(s>js||(s===js&&a>=ja))j=i+1;else break}return j}
function update(){if(!reader.classList.contains('is-active'))return;const {s,a}=pos();const j=juzOf(s,a);const p=window.QuranPages?.pageOf?.(s,a);const base=meta.textContent.replace(/\s*·\s*الجزء\s+[٠-٩0-9]+(?:\s*·\s*الصفحة\s+[٠-٩0-9]+)?\s*$/,'');meta.textContent=p?`${base} · الجزء ${ar(j)} · الصفحة ${ar(p)}`:`${base} · الجزء ${ar(j)}`;reader.dataset.page=p||'';reader.dataset.juz=j}
let raf=0;reader.addEventListener('scroll',()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(update)},{passive:true});
const mo=new MutationObserver(update);mo.observe(title,{childList:true,characterData:true,subtree:true});
mo.observe(document.getElementById('qrText'),{subtree:true,attributes:true,attributeFilter:['class']});
setTimeout(update,120);
})();
