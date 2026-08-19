/* QiblaAstro — Azkar iframe-local Back history bridge
 * Presentation/navigation only. No dhikr data, counters, audio timers or engines are modified.
 * © 2026 Mohamed SG Behairy. All Rights Reserved. */
(function(root){
  'use strict';
  var KEY='qiblaastroAzkarNav';
  var VERSION=1;
  var app=root.document&&root.document.getElementById('azkarApp');
  var home=root.document&&root.document.getElementById('azHome');
  var reader=root.document&&root.document.getElementById('azReader');
  var audio=root.document&&root.document.getElementById('azAudio');
  var backReader=root.document&&root.document.getElementById('azBackHome');
  var backAudio=root.document&&root.document.getElementById('azAudioBack');
  if(!app||!home||!reader||!audio)return;

  var suppress=false;
  var lastView='home';

  function activeView(){
    if(reader.classList.contains('is-active'))return 'reader';
    if(audio.classList.contains('is-active'))return 'audio';
    return 'home';
  }
  function stateFor(view,cat){
    var s={};
    s[KEY]={version:VERSION,view:view};
    if(view==='reader'&&cat)s[KEY].category=cat;
    return s;
  }
  function navState(state){
    var nav=state&&state[KEY];
    if(!nav||nav.version!==VERSION)return null;
    return /^(home|reader|audio)$/.test(nav.view)?nav:null;
  }
  function currentCategory(){
    try{
      var st=root.AzkarPage&&root.AzkarPage.getState?root.AzkarPage.getState():null;
      return st&&st.currentCat?String(st.currentCat):null;
    }catch(_){return null;}
  }
  function withSuppressed(fn){
    suppress=true;
    try{fn();}finally{root.setTimeout(function(){suppress=false;lastView=activeView();},0);}
  }
  function renderState(nav){
    if(!nav||!root.AzkarPage)return;
    if(nav.view==='reader'&&nav.category&&typeof root.AzkarPage.openCategory==='function'){
      withSuppressed(function(){root.AzkarPage.openCategory(nav.category);});
      return;
    }
    if(nav.view==='audio'&&typeof root.AzkarPage.openAudio==='function'){
      withSuppressed(function(){root.AzkarPage.openAudio();});
      return;
    }
    if(nav.view==='home'){
      withSuppressed(function(){
        if(lastView==='reader'&&backReader){backReader.click();return;}
        if(lastView==='audio'&&backAudio){backAudio.click();return;}
        if(typeof root.AzkarPage.home==='function')root.AzkarPage.home();
      });
    }
  }

  // The iframe starts at the Azkar category home. Replace, never push, the initial entry.
  try{root.history.replaceState(stateFor('home'),'');}catch(_){ }

  var observer=new MutationObserver(function(){
    if(suppress)return;
    var next=activeView();
    if(next===lastView)return;
    var current=navState(root.history.state);

    if(next==='home'){
      // A visible in-screen Back control already changed the DOM to Home. Consume the
      // child browser entry instead of creating a second independent navigation path.
      if(current&&current.view!=='home'){
        lastView=next;
        try{root.history.back();return;}catch(_){ }
      }
      try{root.history.replaceState(stateFor('home'),'');}catch(_){ }
    }else if(next==='reader'){
      var cat=currentCategory();
      try{
        if(current&&current.view==='home')root.history.pushState(stateFor('reader',cat),'');
        else root.history.replaceState(stateFor('reader',cat),'');
      }catch(_){ }
    }else if(next==='audio'){
      try{
        if(current&&current.view==='home')root.history.pushState(stateFor('audio'),'');
        else root.history.replaceState(stateFor('audio'),'');
      }catch(_){ }
    }
    lastView=next;
  });
  [home,reader,audio].forEach(function(view){observer.observe(view,{attributes:true,attributeFilter:['class']});});

  root.addEventListener('popstate',function(event){
    var nav=navState(event.state);
    if(!nav)return;
    renderState(nav);
  });

  root.__qiblaAzkarBackHistory={version:VERSION,stateKey:KEY,views:['home','reader','audio']};
})(typeof globalThis!=='undefined'?globalThis:window);
