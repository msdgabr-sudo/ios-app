/* QiblaAstro — Quran iframe-local Back history bridge
 * Presentation-only. Keeps Android/TWA Back hierarchy inside the modern Quran iframe:
 * Reader -> Quran index -> app Home.
 * No Quran corpus, calculation, GNSS, WMM, compass, prayer or verification logic is changed.
 * © 2026 Mohamed SG Behairy. All Rights Reserved. */
(function(root){
  'use strict';
  var KEY='qiblaastroQuranNav';
  var VERSION=1;
  var restoring=false;
  var reader=root.document&&root.document.getElementById('qrReader');
  var home=root.document&&root.document.getElementById('qrHome');
  var back=root.document&&root.document.getElementById('qrReaderBack');
  if(!reader||!home||!back)return;

  function owned(state){
    var nav=state&&state[KEY];
    return nav&&nav.version===VERSION?nav:null;
  }
  function stateFor(readerOpen){
    var base=(root.history.state&&typeof root.history.state==='object')?Object.assign({},root.history.state):{};
    base[KEY]={version:VERSION,reader:!!readerOpen};
    return base;
  }
  function isReaderVisible(){return reader.classList.contains('is-active');}
  function showIndexViaExistingControl(){
    if(!isReaderVisible())return;
    restoring=true;
    try{back.click();}finally{restoring=false;}
  }

  // Prime only this iframe's current entry. This does not push a new navigation.
  try{root.history.replaceState(stateFor(isReaderVisible()),'');}catch(_){ }

  // Opening a Surah is observed from the real modern Quran DOM. One child history
  // entry is added exactly once. Moving between Surahs keeps the same reader entry.
  var observer=new MutationObserver(function(){
    if(restoring)return;
    var nowOpen=isReaderVisible();
    var nav=owned(root.history.state);
    if(nowOpen){
      if(!nav||nav.reader!==true){
        try{root.history.pushState(stateFor(true),'');}catch(_){ }
      }
    }else if(nav&&nav.reader===true){
      // The visible Back button was used directly. Consume the reader entry instead
      // of leaving a stale Forward/Back mismatch in the joint browser history.
      try{root.history.back();}catch(_){ }
    }
  });
  observer.observe(reader,{attributes:true,attributeFilter:['class']});

  // Keep the visible reader Back button and Android hardware Back on the same stack.
  back.addEventListener('click',function(event){
    if(restoring)return;
    var nav=owned(root.history.state);
    if(isReaderVisible()&&nav&&nav.reader===true){
      event.preventDefault();
      event.stopImmediatePropagation();
      try{root.history.back();}catch(_){ }
    }
  },true);

  // Browser/TWA Back traverses the iframe's own entry first. Popstate does not
  // bubble into the parent document, so the already-working top-level Home layer
  // remains untouched. We invoke the Quran screen's existing reader-back control
  // rather than duplicating any Quran reader logic here.
  root.addEventListener('popstate',function(event){
    var nav=owned(event.state);
    if(!nav)return;
    if(nav.reader===false)showIndexViaExistingControl();
  });

  root.__qiblaQuranBackHistory={version:VERSION,owner:'quran-iframe',stateKey:KEY};
})(typeof globalThis!=='undefined'?globalThis:window);
