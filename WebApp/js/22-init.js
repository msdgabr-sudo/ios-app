// ══════════════════════════════════════════════════════════════════════════════
// [JS-32] QURAN MODULE
// ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════
// QiblaAstro — Quran Module v6.1
// Offline | Local JSON | No External APIs
// ══════════════════════════════════════════════════

// ── المتغيرات ──
var _qrCurrent   = 1;
var _qrFontSize  = 1.45;
var _qrUIVisible = true;
var _qrMemCache  = {};   // Layer 1: Memory
var _qrBM        = null;
var _qrStarsRAF  = null;
var _qrActive    = false;

// استرجاع bookmark
try{ _qrBM=JSON.parse(localStorage.getItem('qr-bm')||'null'); }catch(e){}

// ── فهرس السور — مضمّن محلياً بالكامل ──
var _qrIndex=[
  {id:1,name:"الفاتحة",nameEn:"Al-Fatihah",type:"meccan",total_verses:7},
  {id:2,name:"البقرة",nameEn:"Al-Baqarah",type:"medinan",total_verses:286},
  {id:3,name:"آل عمران",nameEn:"Ali 'Imran",type:"medinan",total_verses:200},
  {id:4,name:"النساء",nameEn:"An-Nisa",type:"medinan",total_verses:176},
  {id:5,name:"المائدة",nameEn:"Al-Ma'idah",type:"medinan",total_verses:120},
  {id:6,name:"الأنعام",nameEn:"Al-An'am",type:"meccan",total_verses:165},
  {id:7,name:"الأعراف",nameEn:"Al-A'raf",type:"meccan",total_verses:206},
  {id:8,name:"الأنفال",nameEn:"Al-Anfal",type:"medinan",total_verses:75},
  {id:9,name:"التوبة",nameEn:"At-Tawbah",type:"medinan",total_verses:129},
  {id:10,name:"يونس",nameEn:"Yunus",type:"meccan",total_verses:109},
  {id:11,name:"هود",nameEn:"Hud",type:"meccan",total_verses:123},
  {id:12,name:"يوسف",nameEn:"Yusuf",type:"meccan",total_verses:111},
  {id:13,name:"الرعد",nameEn:"Ar-Ra'd",type:"medinan",total_verses:43},
  {id:14,name:"إبراهيم",nameEn:"Ibrahim",type:"meccan",total_verses:52},
  {id:15,name:"الحجر",nameEn:"Al-Hijr",type:"meccan",total_verses:99},
  {id:16,name:"النحل",nameEn:"An-Nahl",type:"meccan",total_verses:128},
  {id:17,name:"الإسراء",nameEn:"Al-Isra",type:"meccan",total_verses:111},
  {id:18,name:"الكهف",nameEn:"Al-Kahf",type:"meccan",total_verses:110},
  {id:19,name:"مريم",nameEn:"Maryam",type:"meccan",total_verses:98},
  {id:20,name:"طه",nameEn:"Ta-Ha",type:"meccan",total_verses:135},
  {id:21,name:"الأنبياء",nameEn:"Al-Anbya",type:"meccan",total_verses:112},
  {id:22,name:"الحج",nameEn:"Al-Hajj",type:"medinan",total_verses:78},
  {id:23,name:"المؤمنون",nameEn:"Al-Mu'minun",type:"meccan",total_verses:118},
  {id:24,name:"النور",nameEn:"An-Nur",type:"medinan",total_verses:64},
  {id:25,name:"الفرقان",nameEn:"Al-Furqan",type:"meccan",total_verses:77},
  {id:26,name:"الشعراء",nameEn:"Ash-Shu'ara",type:"meccan",total_verses:227},
  {id:27,name:"النمل",nameEn:"An-Naml",type:"meccan",total_verses:93},
  {id:28,name:"القصص",nameEn:"Al-Qasas",type:"meccan",total_verses:88},
  {id:29,name:"العنكبوت",nameEn:"Al-'Ankabut",type:"meccan",total_verses:69},
  {id:30,name:"الروم",nameEn:"Ar-Rum",type:"meccan",total_verses:60},
  {id:31,name:"لقمان",nameEn:"Luqman",type:"meccan",total_verses:34},
  {id:32,name:"السجدة",nameEn:"As-Sajdah",type:"meccan",total_verses:30},
  {id:33,name:"الأحزاب",nameEn:"Al-Ahzab",type:"medinan",total_verses:73},
  {id:34,name:"سبأ",nameEn:"Saba",type:"meccan",total_verses:54},
  {id:35,name:"فاطر",nameEn:"Fatir",type:"meccan",total_verses:45},
  {id:36,name:"يس",nameEn:"Ya-Sin",type:"meccan",total_verses:83},
  {id:37,name:"الصافات",nameEn:"As-Saffat",type:"meccan",total_verses:182},
  {id:38,name:"ص",nameEn:"Sad",type:"meccan",total_verses:88},
  {id:39,name:"الزمر",nameEn:"Az-Zumar",type:"meccan",total_verses:75},
  {id:40,name:"غافر",nameEn:"Ghafir",type:"meccan",total_verses:85},
  {id:41,name:"فصلت",nameEn:"Fussilat",type:"meccan",total_verses:54},
  {id:42,name:"الشورى",nameEn:"Ash-Shuraa",type:"meccan",total_verses:53},
  {id:43,name:"الزخرف",nameEn:"Az-Zukhruf",type:"meccan",total_verses:89},
  {id:44,name:"الدخان",nameEn:"Ad-Dukhan",type:"meccan",total_verses:59},
  {id:45,name:"الجاثية",nameEn:"Al-Jathiyah",type:"meccan",total_verses:37},
  {id:46,name:"الأحقاف",nameEn:"Al-Ahqaf",type:"meccan",total_verses:35},
  {id:47,name:"محمد",nameEn:"Muhammad",type:"medinan",total_verses:38},
  {id:48,name:"الفتح",nameEn:"Al-Fath",type:"medinan",total_verses:29},
  {id:49,name:"الحجرات",nameEn:"Al-Hujurat",type:"medinan",total_verses:18},
  {id:50,name:"ق",nameEn:"Qaf",type:"meccan",total_verses:45},
  {id:51,name:"الذاريات",nameEn:"Adh-Dhariyat",type:"meccan",total_verses:60},
  {id:52,name:"الطور",nameEn:"At-Tur",type:"meccan",total_verses:49},
  {id:53,name:"النجم",nameEn:"An-Najm",type:"meccan",total_verses:62},
  {id:54,name:"القمر",nameEn:"Al-Qamar",type:"meccan",total_verses:55},
  {id:55,name:"الرحمن",nameEn:"Ar-Rahman",type:"medinan",total_verses:78},
  {id:56,name:"الواقعة",nameEn:"Al-Waqi'ah",type:"meccan",total_verses:96},
  {id:57,name:"الحديد",nameEn:"Al-Hadid",type:"medinan",total_verses:29},
  {id:58,name:"المجادلة",nameEn:"Al-Mujadila",type:"medinan",total_verses:22},
  {id:59,name:"الحشر",nameEn:"Al-Hashr",type:"medinan",total_verses:24},
  {id:60,name:"الممتحنة",nameEn:"Al-Mumtahanah",type:"medinan",total_verses:13},
  {id:61,name:"الصف",nameEn:"As-Saf",type:"medinan",total_verses:14},
  {id:62,name:"الجمعة",nameEn:"Al-Jumu'ah",type:"medinan",total_verses:11},
  {id:63,name:"المنافقون",nameEn:"Al-Munafiqun",type:"medinan",total_verses:11},
  {id:64,name:"التغابن",nameEn:"At-Taghabun",type:"medinan",total_verses:18},
  {id:65,name:"الطلاق",nameEn:"At-Talaq",type:"medinan",total_verses:12},
  {id:66,name:"التحريم",nameEn:"At-Tahrim",type:"medinan",total_verses:12},
  {id:67,name:"الملك",nameEn:"Al-Mulk",type:"meccan",total_verses:30},
  {id:68,name:"القلم",nameEn:"Al-Qalam",type:"meccan",total_verses:52},
  {id:69,name:"الحاقة",nameEn:"Al-Haqqah",type:"meccan",total_verses:52},
  {id:70,name:"المعارج",nameEn:"Al-Ma'arij",type:"meccan",total_verses:44},
  {id:71,name:"نوح",nameEn:"Nuh",type:"meccan",total_verses:28},
  {id:72,name:"الجن",nameEn:"Al-Jinn",type:"meccan",total_verses:28},
  {id:73,name:"المزمل",nameEn:"Al-Muzzammil",type:"meccan",total_verses:20},
  {id:74,name:"المدثر",nameEn:"Al-Muddaththir",type:"meccan",total_verses:56},
  {id:75,name:"القيامة",nameEn:"Al-Qiyamah",type:"meccan",total_verses:40},
  {id:76,name:"الإنسان",nameEn:"Al-Insan",type:"medinan",total_verses:31},
  {id:77,name:"المرسلات",nameEn:"Al-Mursalat",type:"meccan",total_verses:50},
  {id:78,name:"النبأ",nameEn:"An-Naba",type:"meccan",total_verses:40},
  {id:79,name:"النازعات",nameEn:"An-Nazi'at",type:"meccan",total_verses:46},
  {id:80,name:"عبس",nameEn:"Abasa",type:"meccan",total_verses:42},
  {id:81,name:"التكوير",nameEn:"At-Takwir",type:"meccan",total_verses:29},
  {id:82,name:"الانفطار",nameEn:"Al-Infitar",type:"meccan",total_verses:19},
  {id:83,name:"المطففين",nameEn:"Al-Mutaffifin",type:"meccan",total_verses:36},
  {id:84,name:"الانشقاق",nameEn:"Al-Inshiqaq",type:"meccan",total_verses:25},
  {id:85,name:"البروج",nameEn:"Al-Buruj",type:"meccan",total_verses:22},
  {id:86,name:"الطارق",nameEn:"At-Tariq",type:"meccan",total_verses:17},
  {id:87,name:"الأعلى",nameEn:"Al-A'la",type:"meccan",total_verses:19},
  {id:88,name:"الغاشية",nameEn:"Al-Ghashiyah",type:"meccan",total_verses:26},
  {id:89,name:"الفجر",nameEn:"Al-Fajr",type:"meccan",total_verses:30},
  {id:90,name:"البلد",nameEn:"Al-Balad",type:"meccan",total_verses:20},
  {id:91,name:"الشمس",nameEn:"Ash-Shams",type:"meccan",total_verses:15},
  {id:92,name:"الليل",nameEn:"Al-Layl",type:"meccan",total_verses:21},
  {id:93,name:"الضحى",nameEn:"Ad-Duhaa",type:"meccan",total_verses:11},
  {id:94,name:"الشرح",nameEn:"Ash-Sharh",type:"meccan",total_verses:8},
  {id:95,name:"التين",nameEn:"At-Tin",type:"meccan",total_verses:8},
  {id:96,name:"العلق",nameEn:"Al-Alaq",type:"meccan",total_verses:19},
  {id:97,name:"القدر",nameEn:"Al-Qadr",type:"meccan",total_verses:5},
  {id:98,name:"البينة",nameEn:"Al-Bayyinah",type:"medinan",total_verses:8},
  {id:99,name:"الزلزلة",nameEn:"Az-Zalzalah",type:"medinan",total_verses:8},
  {id:100,name:"العاديات",nameEn:"Al-Adiyat",type:"meccan",total_verses:11},
  {id:101,name:"القارعة",nameEn:"Al-Qari'ah",type:"meccan",total_verses:11},
  {id:102,name:"التكاثر",nameEn:"At-Takathur",type:"meccan",total_verses:8},
  {id:103,name:"العصر",nameEn:"Al-Asr",type:"meccan",total_verses:3},
  {id:104,name:"الهمزة",nameEn:"Al-Humazah",type:"meccan",total_verses:9},
  {id:105,name:"الفيل",nameEn:"Al-Fil",type:"meccan",total_verses:5},
  {id:106,name:"قريش",nameEn:"Quraysh",type:"meccan",total_verses:4},
  {id:107,name:"الماعون",nameEn:"Al-Ma'un",type:"meccan",total_verses:7},
  {id:108,name:"الكوثر",nameEn:"Al-Kawthar",type:"meccan",total_verses:3},
  {id:109,name:"الكافرون",nameEn:"Al-Kafirun",type:"meccan",total_verses:6},
  {id:110,name:"النصر",nameEn:"An-Nasr",type:"medinan",total_verses:3},
  {id:111,name:"المسد",nameEn:"Al-Masad",type:"meccan",total_verses:5},
  {id:112,name:"الإخلاص",nameEn:"Al-Ikhlas",type:"meccan",total_verses:4},
  {id:113,name:"الفلق",nameEn:"Al-Falaq",type:"meccan",total_verses:5},
  {id:114,name:"الناس",nameEn:"An-Nas",type:"meccan",total_verses:6}
];

// ── تطبيع النص للبحث ──
function _qrNormalize(s){
  if(!s) return '';
  return s
    .replace(/[\u064B-\u065F\u0670]/g,'')  // حذف الحركات
    .replace(/[أإآ]/g,'ا')                 // توحيد الألف
    .replace(/[ةه]/g,'ه')                  // توحيد التاء المربوطة
    .replace(/[يى]/g,'ي')                  // توحيد الياء
    .toLowerCase();
}

// ── Canvas النجوم ──
function qrInitStars(){
  var cvs=gel('qr-stars');
  if(!cvs||cvs._init)return;
  cvs._init=true;
  var ctx=cvs.getContext('2d');
  var W=cvs.width=window.innerWidth,H=cvs.height=window.innerHeight;
  var stars=[];
  for(var i=0;i<100;i++){
    stars.push({x:Math.random()*W,y:Math.random()*H,
      r:Math.random()*.6+.2,a:Math.random(),
      da:(Math.random()-.5)*.004,vx:(Math.random()-.5)*.06,
      gold:Math.random()>.65});
  }
  function draw(){
    if(!_qrActive){_qrStarsRAF=null;return;}  // إيقاف عند عدم النشاط
    ctx.clearRect(0,0,W,H);
    stars.forEach(function(s){
      s.a+=s.da; if(s.a<0||s.a>1)s.da*=-1;
      s.x+=s.vx; if(s.x<0)s.x=W; if(s.x>W)s.x=0;
      ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fillStyle=s.gold
        ?'rgba(212,175,55,'+s.a.toFixed(2)+')'
        :'rgba(160,210,160,'+(s.a*.35).toFixed(2)+')';
      ctx.fill();
    });
    _qrStarsRAF=requestAnimationFrame(draw);
  }
  _qrStarsRAF=requestAnimationFrame(draw);
}

// ── IndexedDB ──
var _qrDB=null;
function _qrOpenDB(){
  if(_qrDB) return Promise.resolve(_qrDB);
  return new Promise(function(res,rej){
    try{
      var req=indexedDB.open('qiblaastro-quran',1);
      req.onupgradeneeded=function(e){e.target.result.createObjectStore('surahs',{keyPath:'id'});};
      req.onsuccess=function(e){_qrDB=e.target.result;res(_qrDB);};
      req.onerror=function(){rej();};
    }catch(e){rej(e);}
  });
}
function _qrIDBGet(num){
  return _qrOpenDB().then(function(db){
    return new Promise(function(res,rej){
      var tx=db.transaction('surahs','readonly');
      var req=tx.objectStore('surahs').get(num);
      req.onsuccess=function(){res(req.result||null);};
      req.onerror=function(){rej();};
    });
  }).catch(function(){return null;});
}
function _qrIDBSet(data){
  _qrOpenDB().then(function(db){
    try{
      var tx=db.transaction('surahs','readwrite');
      tx.objectStore('surahs').put(data);
    }catch(e){}
  }).catch(function(){});
}

// ── تهيئة ──
function qrInit(){
  _qrActive=true;
  qrInitStars();
  qrShowBmCard();
  qrRenderList(_qrIndex);
}

// ── إشارة مرجعية ──
function qrShowBmCard(){
  var card=gel('qr-bm-card'),name=gel('qr-bm-name');
  if(!card)return;
  if(_qrBM&&_qrBM.s){
    card.style.display='block';
    if(name)name.textContent=_qrBM.n||'سورة '+_qrBM.s;
  } else { card.style.display='none'; }
}
function qrOpenBm(){ if(_qrBM&&_qrBM.s)qrOpen(_qrBM.s); }

// ── عرض القائمة ──
function qrRenderList(list){
  var el=gel('qr-list'); if(!el)return;
  var html='';
  list.forEach(function(s,i){
    var isOdd=i%2===0;
    var typeAr=s.type==='meccan'?'مكية':'مدنية';
    html+='<div onclick="qrOpen('+s.id+')" style="'+
      'display:flex;align-items:center;gap:12px;padding:11px 10px;'+
      'border-radius:14px;margin-bottom:4px;cursor:pointer;direction:rtl;'+
      'background:'+(isOdd?'rgba(255,255,255,.04)':'transparent')+';'+
      'border:1px solid rgba(212,175,55,'+(isOdd?'.12':'.05')+')'+
      '" onmouseover="this.style.background=\'rgba(212,175,55,.12)\'"'+
      ' onmouseout="this.style.background=\''+(isOdd?'rgba(255,255,255,.04)':'transparent')+'\'">'+
      '<div style="width:38px;height:38px;border-radius:50%;'+
        'border:1.5px solid rgba(212,175,55,.4);'+
        'background:rgba(212,175,55,.08);display:flex;align-items:center;'+
        'justify-content:center;flex-shrink:0;font-size:.7rem;color:#E8C878;font-weight:600">'+s.id+'</div>'+
      '<div style="flex:1">'+
        '<div style="font-size:1.05rem;color:#F0EAD6;font-family:\'Amiri Quran\',serif;font-weight:400">'+s.name+'</div>'+
        '<div style="font-size:.6rem;color:rgba(212,175,55,.55);margin-top:2px">'+
          s.total_verses+' آية · '+typeAr+'</div>'+
      '</div>'+
      '<div style="color:rgba(212,175,55,.5);font-size:1rem">›</div>'+
    '</div>';
  });
  el.innerHTML=html||'<div style="text-align:center;padding:40px;color:rgba(212,175,55,.4)">لا نتائج</div>';
}

// ── بحث محسّن ──
function qrSearch(q){
  if(!q){qrRenderList(_qrIndex);return;}
  var nq=_qrNormalize(q);
  var f=_qrIndex.filter(function(s){
    return _qrNormalize(s.name).indexOf(nq)>=0 ||
           (s.nameEn||'').toLowerCase().indexOf(q.toLowerCase())>=0 ||
           s.id===parseInt(q);
  });
  qrRenderList(f);
}

// ── تحميل السورة — async/await متسلسل ──
async function qrOpen(num){
  _qrCurrent = num;
  gel('qr-index').style.display = 'none';
  gel('qr-reader').style.display = 'block';
  if(!_qrActive){ _qrActive=true; qrInitStars(); }

  var el = gel('qr-text');
  if(el) el.innerHTML = '<div style="text-align:center;padding:80px;color:rgba(212,175,55,.4)">'+
    '<div style="font-size:2rem;margin-bottom:12px">📖</div>جاري التحميل...</div>';

  // STEP 1: Memory Cache
  if(_qrMemCache[num]){
    qrRender(_qrMemCache[num]);
    return;
  }

  // STEP 2: IndexedDB
  try{
    var cached = await _qrIDBGet(num);
    if(cached){
      _qrMemCache[num] = cached;
      qrRender(cached);
      return;
    }
  }catch(e){}  // فشل IndexedDB لا يوقف التنفيذ

  // STEP 3: Local JSON
  try{
    var path = './quran/' + num + '.json';
    var response = await fetch(path);
    if(!response.ok) throw new Error('HTTP ' + response.status);
    var data = await response.json();

    // حفظ في Memory
    _qrMemCache[num] = data;

    // حفظ في IndexedDB
    try{ _qrIDBSet(data); }catch(e){}

    // Render
    qrRender(data);

  }catch(err){
    // STEP 4: Error Handler
    if(el) el.innerHTML =
      '<div style="text-align:center;padding:60px">'+
      '<div style="font-size:1.5rem;margin-bottom:12px">⚠️</div>'+
      '<div style="color:rgba(212,175,55,.7);margin-bottom:8px;font-size:.85rem">'+
        'تعذّر تحميل سورة ' + num + '</div>'+
      '<div style="color:rgba(212,175,55,.4);font-size:.7rem;margin-bottom:16px">'+
        'تأكد من وجود الملف: quran/' + num + '.json</div>'+
      '<button onclick="qrOpen('+num+')" style="background:rgba(212,175,55,.12);'+
        'border:1.5px solid rgba(212,175,55,.4);color:#E8C878;padding:9px 18px;'+
        'border-radius:12px;cursor:pointer;font-family:inherit;font-size:.85rem">'+
        '🔄 إعادة المحاولة</button>'+
      '</div>';
  }
}

// ── رسم السورة ──
function qrRender(d){
  if(!d||!d.verses) return;
  var ne=gel('qr-surah-name'),ie=gel('qr-surah-info'),ni=gel('qr-nav-info');
  var typeAr=d.type==='meccan'?'مكية':'مدنية';
  if(ne) ne.textContent='سورة '+d.name;
  if(ie) ie.textContent=(d.total_verses||d.verses.length)+' آية · '+typeAr;
  if(ni) ni.textContent='سورة '+d.id+' من ١١٤';

  var html=
    '<div style="text-align:center;margin-bottom:28px;padding-bottom:20px;'+
      'border-bottom:1px solid rgba(212,175,55,.15)">'+
      '<div style="font-size:1.6rem;color:#D4AF37;font-family:\'Amiri Quran\',serif;margin-bottom:6px">'+
        'سورة '+d.name+'</div>'+
      '<div style="font-size:.65rem;color:rgba(212,175,55,.5)">'+
        (d.total_verses||d.verses.length)+' آية · '+typeAr+'</div>'+
    '</div>';

  if(d.id!==1&&d.id!==9){
    html+='<div style="text-align:center;color:#D4AF37;font-family:\'Amiri Quran\',serif;'+
      'font-size:1.4rem;margin-bottom:28px;padding:14px;background:rgba(212,175,55,.05);'+
      'border-radius:16px;border:1px solid rgba(212,175,55,.12)">'+
      'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>';
  }

  d.verses.forEach(function(v){
    var txt=v.text||v.arabic||'';
    var vn=v.id||v.verseNo||v.numberInSurah||'';
    html+='<span style="color:#F0EAD6">'+txt+'</span>'+
      '<span style="color:#D4AF37;font-family:\'Amiri Quran\',serif;'+
        'font-size:.95rem;margin:0 3px;white-space:nowrap">﴿'+vn+'﴾</span> ';
  });

  var el=gel('qr-text');
  if(el){ el.innerHTML=html; el.style.fontSize=_qrFontSize+'rem'; }

  _qrBM={s:d.id,n:'سورة '+d.name};
  try{localStorage.setItem('qr-bm',JSON.stringify(_qrBM));}catch(e){}

  var reader=gel('qr-reader');
  if(reader)reader.scrollTop=0;
  _qrUIVisible=true;
  qrSetUI(true);
}

// ── التنقل ──
function qrBack(){
  gel('qr-reader').style.display='none';
  gel('qr-index').style.display='block';
  qrShowBmCard();
}
function qrNext(){ if(_qrCurrent<114)qrOpen(_qrCurrent+1); }
function qrPrev(){ if(_qrCurrent>1) qrOpen(_qrCurrent-1); }

// ── حجم الخط ──
function qrFontSize(d){
  _qrFontSize=Math.max(.9,Math.min(2.2,_qrFontSize+d*.1));
  var el=gel('qr-text');
  if(el)el.style.fontSize=_qrFontSize+'rem';
}

// ── وضع التركيز ──
function qrToggleUI(){ _qrUIVisible=!_qrUIVisible; qrSetUI(_qrUIVisible); }
function qrSetUI(show){
  var top=gel('qr-top-bar'),bot=gel('qr-bottom-bar');
  if(top){top.style.transition='transform .3s ease,opacity .3s ease';
    top.style.transform=show?'translateY(0)':'translateY(-110%)';
    top.style.opacity=show?'1':'0';}
  if(bot){bot.style.transition='transform .3s ease,opacity .3s ease';
    bot.style.transform=show?'translateY(0)':'translateY(110%)';
    bot.style.opacity=show?'1':'0';}
}

// ── إشارة مرجعية ──
function qrBookmark(){
  try{localStorage.setItem('qr-bm',JSON.stringify(_qrBM));}catch(e){}
  var btn=gel('qr-bm-btn');
  if(btn){btn.textContent='✅';setTimeout(function(){btn.textContent='🔖';},1200);}
  try{navigator.vibrate([30,20,60]);}catch(e){}
}

// ── إيقاف عند مغادرة الصفحة ──
function qrDeactivate(){
  _qrActive=false;
  if(_qrStarsRAF){cancelAnimationFrame(_qrStarsRAF);_qrStarsRAF=null;}
}


// ══ قطرات روحانية ══
var _zkParticlesEnabled=true;
function zkDrops(count,isMorning){
  if(!_zkParticlesEnabled)return;
  try{
    var cvs=document.createElement('canvas');
    cvs.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;z-index:9998;pointer-events:none';
    cvs.width=window.innerWidth;cvs.height=window.innerHeight;
    document.body.appendChild(cvs);
    var ctx=cvs.getContext('2d');
    var drops=[];
    for(var i=0;i<count;i++){
      drops.push({
        x:Math.random()*cvs.width,y:-Math.random()*30,
        r:Math.random()*2+.8,vy:Math.random()*1.5+.8,
        vx:(Math.random()-.5)*.4,a:Math.random()*.7+.5,
        gold:isMorning
      });
    }
    var start=Date.now();
    var _zkDraw=function(){
      ctx.clearRect(0,0,cvs.width,cvs.height);
      var alive=false;
      drops.forEach(function(d){
        d.y+=d.vy;d.x+=d.vx;d.a-=.006;
        if(d.a>0&&d.y<cvs.height*.75){
          alive=true;
          var col=d.gold?'rgba(212,175,55,':'rgba(180,210,255,';
          ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,Math.PI*2);
          ctx.fillStyle=col+d.a.toFixed(2)+')';ctx.fill();
          ctx.beginPath();ctx.arc(d.x,d.y,d.r*2.5,0,Math.PI*2);
          ctx.fillStyle=col+(d.a*.25).toFixed(2)+')';ctx.fill();
        }
      });
      if(alive&&Date.now()-start<1500){requestAnimationFrame(_zkDraw);}
      else{try{if(cvs.parentNode)cvs.parentNode.removeChild(cvs);}catch(e){}}
    }
    requestAnimationFrame(_zkDraw);
  }catch(e){}
}
function zkCompletionMsg(){
  try{
    if(!document.getElementById('zk-anim-style')){
      var st=document.createElement('style');
      st.id='zk-anim-style';
      st.textContent='@keyframes zkFadeUp{0%{opacity:0;transform:translate(-50%,-40%)}50%{opacity:1}100%{opacity:0;transform:translate(-50%,-65%)}}';
      document.head.appendChild(st);
    }
    var div=document.createElement('div');
    div.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;text-align:center;pointer-events:none;animation:zkFadeUp 2s ease forwards';
    div.innerHTML='<div style="font-size:1.5rem;color:#D4AF37;font-weight:700;text-shadow:0 0 20px rgba(212,175,55,.9)">تقبّل الله منك 🌿</div>';
    document.body.appendChild(div);
    setTimeout(function(){try{if(div.parentNode)div.parentNode.removeChild(div);}catch(e){}},2200);
  }catch(e){}
}



// ══════════════════════════════════════════════════════════════════════════════
// AZKAR REDESIGN ENHANCEMENTS — QiblaAstro Premium
// Author: Mohamed Sayed Gabr Behairy
// (c) 2026 — All Rights Reserved
// ══════════════════════════════════════════════════════════════════════════════

(function() {
  'use strict';

  function updateAzkarBackground(sectionId) {
    const morning = document.getElementById('az-bg-morning');
    const evening = document.getElementById('az-bg-evening');
    const night = document.getElementById('az-bg-night');
    if (!morning || !evening || !night) return;
    morning.classList.remove('active');
    evening.classList.remove('active');
    night.classList.remove('active');
    if (sectionId === 'zs-sabah') morning.classList.add('active');
    else if (sectionId === 'zs-masa') evening.classList.add('active');
    else night.classList.add('active');
  }

  function spawnParticles(x, y) {
    const container = document.getElementById('az-particles');
    if (!container) return;
    for (let i = 0; i < 12; i++) {
      const p = document.createElement('div');
      p.className = 'az-particle';
      const ox = (Math.random() - 0.5) * 100;
      const oy = (Math.random() - 0.5) * 40;
      const sz = 2 + Math.random() * 4;
      const dl = Math.random() * 0.3;
      p.style.cssText = `left:${x+ox}px;top:${y+oy}px;width:${sz}px;height:${sz}px;animation-delay:${dl}s;animation-duration:${0.8+Math.random()*0.6}s;`;
      const gold = Math.random() > 0.4;
      p.style.background = gold ? `radial-gradient(circle,rgba(200,164,74,${0.15+Math.random()*0.15}),transparent)` : `radial-gradient(circle,rgba(220,230,255,${0.1+Math.random()*0.15}),transparent)`;
      container.appendChild(p);
      setTimeout(() => { if (p.parentNode) p.parentNode.removeChild(p); }, 2000);
    }
  }

  function addRipple(btn, e) {
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'az-ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px;`;
    btn.appendChild(ripple);
    setTimeout(() => { if (ripple.parentNode) ripple.parentNode.removeChild(ripple); }, 600);
  }

  const origZkSwitch = window.zkSwitch;
  window.zkSwitch = function(btn, sec) {
    const result = origZkSwitch.call(this, btn, sec);
    updateAzkarBackground(sec);
    document.querySelectorAll('.az-card').forEach((c, i) => {
      c.style.animation = 'none'; c.offsetHeight; c.style.animation = ''; c.style.animationDelay = (i * 0.05) + 's';
    });
    return result;
  };

  const origZkTap = window.zkTap;
  window.zkTap = function(btn, total) {
    const rect = btn.getBoundingClientRect();
    spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2);
    addRipple(btn, { clientX: rect.left + rect.width/2, clientY: rect.top + rect.height/2 });
    return origZkTap.call(this, btn, total);
  };

  function initAzkar() {
    const active = document.querySelector('.az-tab.on');
    if (active) {
      const m = active.getAttribute('onclick').match(/'zs-[^']+'/);
      if (m) updateAzkarBackground(m[0].replace(/'/g, ''));
    }
    document.querySelectorAll('.az-btn').forEach(b => {
      b.addEventListener('click', function(e) { addRipple(this, e); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAzkar);
  else initAzkar();

  const origGT = window.GT;
  if (origGT) {
    window.GT = function(id) {
      const result = origGT.call(this, id);
      if (id === 'azkar') setTimeout(initAzkar, 100);
      return result;
    };
  }
})();


// ═══ MODULE: SERENITY ═══
var _skTracks=[
  {title:"جئت بابك ساجداً",      type:"نشيد", file:"جئت بابك ساجدا.mp3"},
  {title:"سبحت لله في العش",     type:"نشيد", file:"سبحت لله في العش الطيور.mp3"},
  {title:"تبارك — خالد الجليل",  type:"قرآن", file:"سورة تبارك خالد الجليل.mp3"},
  {title:"تبارك — شعبان الصياد", type:"قرآن", file:"سورة تبارك شعبان الصياد.mp3"},
  {title:"صلى على سيد الثقلين",  type:"نشيد", file:"صلى على سيد الثقلين.mp3"},
  {title:"يا منقذي في شدتي",     type:"نشيد", file:"يا منقذى فى شدتى.mp3"}
];
var _skCurrent=0, _skPlaying=false, _skActive=false, _skRAF=null;

function skInitCanvas(){
  var c=document.getElementById('sk-canvas');
  if(!c||c._sk)return; c._sk=true;
  var ctx=c.getContext('2d');
  c.width=window.innerWidth; c.height=window.innerHeight;
  var pts=[];
  for(var i=0;i<160;i++) pts.push({
    x:Math.random()*c.width, y:Math.random()*c.height,
    r:Math.random()*2+.4, vy:Math.random()*.5+.1,
    vx:(Math.random()-.5)*.2, a:Math.random(),
    tw:Math.random()*.012+.003, gold:Math.random()>.45
  });
  var ang=0;
  function _skDraw(){
    if(!_skActive){_skRAF=null;return;}
    ang+=.003;
    var g=ctx.createLinearGradient(0,0,c.width,c.height);
    g.addColorStop(0,'rgba(3,6,18,1)');
    g.addColorStop(.5,'rgba(7,4,20,1)');
    g.addColorStop(1,'rgba(2,1,10,1)');
    ctx.fillStyle=g; ctx.fillRect(0,0,c.width,c.height);
    var gl=ctx.createRadialGradient(c.width/2,c.height*.35,0,c.width/2,c.height*.35,c.width*.55);
    gl.addColorStop(0,'rgba(212,175,55,.06)'); gl.addColorStop(1,'transparent');
    ctx.fillStyle=gl; ctx.fillRect(0,0,c.width,c.height);
    pts.forEach(function(p){
      p.y+=p.vy; p.x+=p.vx+Math.sin(ang+p.y*.007)*.15;
      p.a+=p.tw; if(p.a>1||p.a<0)p.tw*=-1;
      if(p.y>c.height+5)p.y=-5;
      if(p.x<-5)p.x=c.width+5;
      if(p.x>c.width+5)p.x=-5;
      var al=Math.abs(Math.sin(p.a));
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=p.gold?'rgba(212,175,55,'+(al*.5).toFixed(2)+')'
                          :'rgba(210,225,255,'+(al*.35).toFixed(2)+')';
      ctx.fill();
      if(p.gold&&al>.4){
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r*2.2,0,Math.PI*2);
        ctx.fillStyle='rgba(212,175,55,'+(al*.07).toFixed(2)+')'; ctx.fill();
      }
    });
    _skRAF=requestAnimationFrame(_skDraw);
  }
  _skRAF=requestAnimationFrame(_skDraw);
}

function skInit(){
  _skActive=true;
  skRenderList();
  skInitCanvas();
}

function skDeactivate(){
  _skActive=false;
  if(_skRAF){cancelAnimationFrame(_skRAF);_skRAF=null;}
  var a=document.getElementById('sk-audio');
  if(a&&!a.paused)a.pause();
}

function skRenderList(){
  var el=document.getElementById('sk-list'); if(!el)return;
  var htm='';
  _skTracks.forEach(function(t,i){
    htm+='<div onclick="skLoad('+i+',true)" id="sk-item-'+i+'" style="'+
      'display:flex;align-items:center;gap:12px;padding:13px 14px;margin-bottom:8px;'+
      'border-radius:16px;cursor:pointer;direction:rtl;'+
      'background:rgba(0,0,0,.45);border:1px solid rgba(212,175,55,.18);'+
      'transition:all .2s">'+
      '<div style="width:40px;height:40px;border-radius:50%;flex-shrink:0;'+
        'background:'+(t.type==='قرآن'?'rgba(212,175,55,.1)':'rgba(100,150,255,.08)')+';'+
        'border:1px solid rgba(212,175,55,.2);display:flex;align-items:center;justify-content:center;font-size:1rem">'+
        (t.type==='قرآن'?'📖':'🎵')+'</div>'+
      '<div style="flex:1">'+
        '<div style="font-size:.88rem;color:#F0EAD6;font-weight:600;direction:rtl">'+t.title+'</div>'+
        '<div style="font-size:.6rem;color:rgba(212,175,55,.45);margin-top:2px">'+t.type+'</div>'+
      '</div>'+
      '<div id="sk-ind-'+i+'" style="color:#D4AF37;font-size:.75rem;opacity:0">&#9654;</div>'+
    '</div>';
  });
  el.innerHTML=htm;
}

function skLoad(idx,play){
  _skCurrent=idx;
  var t=_skTracks[idx];
  var a=document.getElementById('sk-audio'); if(!a)return;
  var ti=document.getElementById('sk-title');
  var ty=document.getElementById('sk-type');
  var pl=document.getElementById('sk-player');
  if(ti)ti.textContent=t.title;
  if(ty)ty.textContent=t.type;
  if(pl)pl.style.display='block';
  _skTracks.forEach(function(_,i){
    var it=document.getElementById('sk-item-'+i);
    var ind=document.getElementById('sk-ind-'+i);
    if(it){it.style.borderColor=i===idx?'rgba(212,175,55,.5)':'rgba(212,175,55,.18)';
      it.style.background=i===idx?'rgba(212,175,55,.08)':'rgba(0,0,0,.45)';}
    if(ind)ind.style.opacity=i===idx?'1':'0';
  });
  a.src='./audio/'+t.file;
  a.load();
  if(play){a.play().then(function(){_skPlaying=true;skUpdateBtn();}).catch(function(){_skPlaying=false;skUpdateBtn();});}
}

function skToggle(){
  var a=document.getElementById('sk-audio'); if(!a)return;
  if(!a.src||a.src===window.location.href){skLoad(_skCurrent,true);return;}
  if(a.paused){a.play().then(function(){_skPlaying=true;skUpdateBtn();}).catch(function(){});}
  else{a.pause();_skPlaying=false;skUpdateBtn();}
}

function skUpdateBtn(){
  var b=document.getElementById('sk-play-btn');
  if(b)b.innerHTML=_skPlaying?'&#9646;&#9646;':'&#9654;';
}

function skNext(){skLoad((_skCurrent+1)%_skTracks.length,_skPlaying);}
function skPrev(){skLoad((_skCurrent-1+_skTracks.length)%_skTracks.length,_skPlaying);}

function skSeek(e){
  var a=document.getElementById('sk-audio'); if(!a||!a.duration)return;
  a.currentTime=(e.offsetX/e.currentTarget.offsetWidth)*a.duration;
}

function _skFmt(s){s=Math.floor(s||0);return Math.floor(s/60)+':'+(s%60<10?'0':'')+(s%60);}

document.addEventListener('DOMContentLoaded',function(){
  var a=document.getElementById('sk-audio'); if(!a)return;
  a.addEventListener('timeupdate',function(){
    if(!a.duration)return;
    var pr=document.getElementById('sk-progress');
    var cu=document.getElementById('sk-cur');
    if(pr)pr.style.width=(a.currentTime/a.duration*100).toFixed(1)+'%';
    if(cu)cu.textContent=_skFmt(a.currentTime);
  });
  a.addEventListener('loadedmetadata',function(){
    var d=document.getElementById('sk-dur');
    if(d)d.textContent=_skFmt(a.duration);
  });
  a.addEventListener('ended',skNext);
  a.addEventListener('play',function(){_skPlaying=true;skUpdateBtn();});
  a.addEventListener('pause',function(){_skPlaying=false;skUpdateBtn();});
});


// ══ ميزان الماء ══
var _bubbleActive=false;
function activateBubble(){
  if(typeof DeviceOrientationEvent!=='undefined'&&
     typeof DeviceOrientationEvent.requestPermission==='function'){
    DeviceOrientationEvent.requestPermission()
      .then(function(s){if(s==='granted')_startBubble();})
      .catch(function(){_startBubble();});
  } else {_startBubble();}
}
function _startBubble(){
  _bubbleActive=true;
  window.addEventListener('deviceorientation',_onBubble,true);
  var t=document.getElementById('level-txt');
  if(t)t.textContent='جاري...';
}
function _onBubble(e){
  var ball=document.getElementById('level-ball');
  var txt=document.getElementById('level-txt');
  if(!ball)return;
  var beta=e.beta||0;
  var gamma=e.gamma||0;
  var maxR=16;
  var x=Math.max(-maxR,Math.min(maxR,gamma/90*maxR));
  var y=Math.max(-maxR,Math.min(maxR,beta/90*maxR));
  ball.style.transform='translate(calc(-50% + '+x+'px),calc(-50% + '+y+'px))';
  var angle=Math.sqrt(x*x+y*y);
  var color=angle<4?'#40C070':angle<10?'#C8A44A':'#E05050';
  ball.style.background=color;
  ball.style.boxShadow='0 0 8px '+color;
  if(txt)txt.textContent=angle<4?'مستوٍ ✓':angle<10?'قريب':'أمِل الهاتف';
}
function deactivateBubble(){
  _bubbleActive=false;
  window.removeEventListener('deviceorientation',_onBubble);
}


// ══ زر الرجوع في الهاتف ══
var _pageHistory = ['home'];

function _pushPage(id){
  if(_pageHistory[_pageHistory.length-1] !== id){
    _pageHistory.push(id);
  }
}

window.addEventListener('popstate', function(){
  // إذا في قارئ القرآن → ارجع للفهرس
  var reader = document.getElementById('qr-reader');
  if(reader && reader.style.display !== 'none'){
    qrBack();
    return;
  }
  // ارجع للصفحة السابقة
  if(_pageHistory.length > 1){
    _pageHistory.pop();
    var prev = _pageHistory[_pageHistory.length-1];
    GT(prev);
  } else {
    GT('home');
  }
});

// push state عند كل انتقال
var _origGT = GT;
GT = function(id){
  _origGT(id);
  _pushPage(id);
  try{ history.pushState({page:id}, '', location.pathname + '#' + id); }catch(e){}
};


if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./sw.js').catch(function(){});
}


function _swAdhanNotify(title, body){
  try{
    if('Notification' in window){
      if(Notification.permission === 'granted'){
        new Notification(title, {
          body: body,
          icon: './images/1784590231216.png',
          silent: false
        });
      } else if(Notification.permission !== 'denied'){
        Notification.requestPermission().then(function(p){
          if(p === 'granted'){
            new Notification(title, {body:body, icon:'./images/1784590231216.png'});
          }
        });
      }
    }
  }catch(e){}
}

document.addEventListener('touchstart',function(){try{var el=document.documentElement;if(el.requestFullscreen)el.requestFullscreen();else if(el.webkitRequestFullscreen)el.webkitRequestFullscreen();}catch(e){}},{once:true});


(function(){
  var _r=null,_c=null,_w=0,_hh=0,_p=[],_g=[],_rf=null,_bottom=[];
  function _sz(){
    var cv=document.getElementById('sp-canvas');if(!cv||!_c)return;
    var d=window.devicePixelRatio||1;
    _w=window.innerWidth;_hh=window.innerHeight;
    cv.width=_w*d;cv.height=_hh*d;_c.setTransform(d,0,0,d,0,0);
  }
  function _stop(){
    if(_r)cancelAnimationFrame(_r);_r=null;
    if(_rf)window.removeEventListener('resize',_rf);_rf=null;
    if(_c)_c.clearRect(0,0,_w,_hh);_c=null;_p=[];_g=[];_bottom=[];
  }
  function _init(){
    var cv=document.getElementById('sp-canvas');if(!cv)return;
    _c=cv.getContext('2d');_sz();_rf=_sz;window.addEventListener('resize',_rf);
    // جسيمات عائمة
    for(var i=0;i<80;i++) _p.push({
      x:Math.random()*window.innerWidth,
      y:Math.random()*window.innerHeight,
      vx:(Math.random()-.5)*.35,
      vy:-(Math.random()*.55+.15),
      r:Math.random()*1.4+.3,
      a:Math.random()*.5+.1,
      ph:Math.random()*Math.PI*2,
      sp:Math.random()*.018+.004,
      gold:Math.random()>.4
    });
    // رزاز ذهبي من الأسفل
    for(var i=0;i<60;i++) _bottom.push({
      x:Math.random()*window.innerWidth,
      y:window.innerHeight+Math.random()*100,
      vx:(Math.random()-.5)*.8,
      vy:-(Math.random()*2+0.8),
      r:Math.random()*2.5+0.5,
      a:Math.random()*.8+.2,
      ph:Math.random()*Math.PI*2,
      sp:Math.random()*.025+.008
    });
    // حلقات
    _g=[{r:55,a:.22,sp:.28,mx:165},{r:95,a:.16,sp:.20,mx:185},{r:135,a:.11,sp:.24,mx:205}];
    var st=Date.now();
    var _d=function(){
      if(_r===null)return;
      var t=Date.now()-st,cx=_w/2,cy=_hh/2,mx=Math.max(_w,_hh);
      _c.clearRect(0,0,_w,_hh);
      // توهج مركزي
      var gl=_c.createRadialGradient(cx,cy*.6,0,cx,cy*.6,Math.min(_w,_hh)*.6);
      gl.addColorStop(0,'rgba(201,168,76,.09)');gl.addColorStop(1,'transparent');
      _c.fillStyle=gl;_c.fillRect(0,0,_w,_hh);
      // God Rays
      for(var i=0;i<12;i++){
        var ang=(i/12)*Math.PI*2+t*.00018;
        _c.save();_c.translate(cx,cy*.6);_c.rotate(ang);
        var gr=_c.createLinearGradient(0,0,0,-mx);
        gr.addColorStop(0,'rgba(201,168,76,.06)');gr.addColorStop(1,'rgba(201,168,76,0)');
        _c.beginPath();_c.moveTo(-11,0);_c.lineTo(22,-mx);_c.lineTo(-22,-mx);_c.lineTo(11,0);
        _c.fillStyle=gr;_c.fill();_c.restore();
      }
      // حلقات
      for(var j=0;j<_g.length;j++){
        var rg=_g[j];rg.r+=rg.sp;rg.a-=.0018;
        if(rg.r>rg.mx||rg.a<=0){rg.r=38+Math.random()*32;rg.a=.14+Math.random()*.14;}
        _c.beginPath();_c.arc(cx,cy*.6,rg.r,0,Math.PI*2);
        _c.strokeStyle='rgba(201,168,76,'+rg.a.toFixed(2)+')';_c.lineWidth=1;_c.stroke();
      }
      // جسيمات عائمة
      for(var k=0;k<_p.length;k++){
        var p=_p[k];p.ph+=p.sp;
        p.x+=p.vx+Math.sin(t*.001+p.ph)*.28;p.y+=p.vy;
        if(p.y<-8)p.y=_hh+8;if(p.x<-8)p.x=_w+8;if(p.x>_w+8)p.x=-8;
        var sh=(Math.sin(p.ph)+1)*.5,al=p.a*(.38+sh*.62);
        _c.beginPath();_c.arc(p.x,p.y,p.r,0,Math.PI*2);
        if(p.gold){_c.fillStyle='rgba(201,168,76,'+al.toFixed(2)+')';_c.shadowBlur=5;_c.shadowColor='#C9A84C';}
        else{_c.fillStyle='rgba(255,255,255,'+(al*.45).toFixed(2)+')';_c.shadowBlur=3;_c.shadowColor='rgba(255,255,255,.3)';}
        _c.fill();_c.shadowBlur=0;
      }
      // رزاز ذهبي من الأسفل
      var fade=Math.min(t/400,1);
      for(var m=0;m<_bottom.length;m++){
        var b=_bottom[m];b.ph+=b.sp;
        b.x+=b.vx+Math.sin(t*.0008+b.ph)*.4;b.y+=b.vy;
        if(b.y<-20){b.y=_hh+Math.random()*50;b.x=Math.random()*_w;}
        var bal=b.a*fade*(Math.sin(b.ph)+1)*.5;
        _c.beginPath();_c.arc(b.x,b.y,b.r,0,Math.PI*2);
        _c.fillStyle='rgba(201,168,76,'+Math.min(bal,.9).toFixed(2)+')';
        _c.shadowBlur=8;_c.shadowColor='rgba(201,168,76,.6)';
        _c.fill();_c.shadowBlur=0;
        // هالة صغيرة
        _c.beginPath();_c.arc(b.x,b.y,b.r*2.5,0,Math.PI*2);
        _c.fillStyle='rgba(201,168,76,'+(bal*.1).toFixed(2)+')';
        _c.fill();
      }
      _r=requestAnimationFrame(_d);
    };
    _r=requestAnimationFrame(_d);
  }
  document.addEventListener('DOMContentLoaded',function(){_init();setTimeout(_stop,1800);});
})();

// ════ MODULE 3: CELEBRATION ════
(function(){
  // State Machine
  var STATE = 'IDLE'; // IDLE | ARMED | CELEBRATING | COOLDOWN
  var _cooldownT = 0;
  var _celRAF = null;
  var _timers = [];
  var _ctx = null;
  var _w = 0, _h = 0;
  var _pts = [];
  var _initialized = false;

  // ── Init Canvas مرة واحدة ──
  function _initCanvas(){
    if(_initialized) return;
    var c = document.getElementById('qo-canvas');
    if(!c) return;
    var dpr = window.devicePixelRatio||1;
    _w = window.innerWidth; _h = window.innerHeight;
    c.width = _w*dpr; c.height = _h*dpr;
    c.style.width = _w+'px'; c.style.height = _h+'px';
    _ctx = c.getContext('2d');
    _ctx.scale(dpr,dpr);
    _initPts();
    _initialized = true;
  }

  // ── جسيمات مرة واحدة ──
  function _initPts(){
    var cols=['#FFD54F','#FFC107','#E8D5A3','#C9A84C','#FFFFFF','#F59E0B'];
    _pts = [];
    for(var i=0;i<120;i++) _pts.push({
      x:0,y:0,vx:0,vy:0,
      sz:Math.random()*4.5+1.5,
      col:cols[Math.floor(Math.random()*cols.length)],
      al:1,rot:0,
      rs:(Math.random()-.5)*.18,
      g:.1+Math.random()*.08
    });
  }

  // ── Reset جسيمات ──
  function _resetPts(){
    for(var i=0;i<_pts.length;i++){
      var p=_pts[i];
      p.x=_w/2+(Math.random()-.5)*_w*.45;
      p.y=_h/2+(Math.random()-.5)*_h*.35;
      p.vx=(Math.random()-.5)*5.5;
      p.vy=-(Math.random()*4.5+1.5);
      p.al=1;
      p.rot=Math.random()*Math.PI*2;
    }
  }

  // ── تشغيل ──
  function _start(){
    if(STATE !== 'ARMED') return;
    STATE = 'CELEBRATING';

    try{if(navigator.vibrate)navigator.vibrate([60,40,60]);}catch(e){}

    var cv = document.getElementById('cvs');
    if(cv) cv.classList.add('qibla-glow');

    _resetPts();

    var c = document.getElementById('qo-canvas');
    if(c) c.style.opacity='1';

    var txt = document.getElementById('qibla-success');
    if(txt){
      txt.style.display='block';
      txt.style.opacity='0';
      void txt.offsetWidth;
      requestAnimationFrame(function(){txt.style.opacity='1';});
    }

    var st = Date.now();
    var _draw = function(){
      if(STATE !== 'CELEBRATING'){_celRAF=null;return;}
      var el=Date.now()-st, pr=Math.min(el/2500,1);
      _ctx.clearRect(0,0,_w,_h);
      for(var i=0;i<_pts.length;i++){
        var p=_pts[i];
        p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.vx*=.99;p.rot+=p.rs;
        p.al=Math.max(0,1-pr*1.15);
        if(p.y>_h+20||p.al<=0) continue;
        _ctx.save();
        _ctx.translate(p.x,p.y);_ctx.rotate(p.rot);
        _ctx.globalAlpha=p.al;_ctx.fillStyle=p.col;
        if(p.col==='#C9A84C'||p.col==='#FFD54F'||p.col==='#F59E0B'){
          _ctx.shadowBlur=8;_ctx.shadowColor='#FFD700';
        }
        _ctx.fillRect(-p.sz/2,-p.sz/4,p.sz,p.sz/2);
        _ctx.shadowBlur=0;_ctx.restore();
      }
      _celRAF = requestAnimationFrame(_draw);
    };
    _celRAF = requestAnimationFrame(_draw);

    _timers.push(setTimeout(function(){
      var c2=document.getElementById('qo-canvas');if(c2)c2.style.opacity='0';
      var t2=document.getElementById('qibla-success');
      if(t2){t2.style.opacity='0';setTimeout(function(){t2.style.display='none';},500);}
      var cv2=document.getElementById('cvs');if(cv2)cv2.classList.remove('qibla-glow');
    },2500));

    _timers.push(setTimeout(function(){
      if(_celRAF){cancelAnimationFrame(_celRAF);_celRAF=null;}
      if(_ctx) _ctx.clearRect(0,0,_w,_h);
      for(var i=0;i<_timers.length;i++) clearTimeout(_timers[i]);
      _timers.length=0;
      STATE='COOLDOWN';
      _cooldownT=Date.now();
    },3100));
  }

  // ── State Machine ──
  function _celCheck(qDiff){
    var absD = qDiff<=180 ? qDiff : 360-qDiff;
    if(STATE==='IDLE'){
      if(absD<1.0){ STATE='ARMED'; _start(); }
    } else if(STATE==='COOLDOWN'){
      if(Date.now()-_cooldownT>=5000 && absD>3.0){ STATE='IDLE'; }
    }
  }

  // ── expose ──
  window._celCheck = _celCheck;

  document.addEventListener('DOMContentLoaded', function(){
    _initCanvas();
  });
})();
// ════ END MODULE 3 ════
