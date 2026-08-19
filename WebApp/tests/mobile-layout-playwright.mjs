import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const base=process.env.QIBLA_TEST_URL||'http://127.0.0.1:8765/index.html';
const sizes=[[360,800],[393,873],[412,915]];
const browser=await chromium.launch({headless:true});

async function overflow(page,label){
  const r=await page.evaluate(()=>({
    innerWidth:window.innerWidth,
    doc:document.documentElement.scrollWidth,
    body:document.body?document.body.scrollWidth:0,
    active:[...document.querySelectorAll('.page.active')].map(x=>({id:x.id,w:x.scrollWidth,client:x.clientWidth}))
  }));
  const max=Math.max(r.doc,r.body,...r.active.map(x=>x.w));
  assert.ok(max<=r.innerWidth+3,`${label}: horizontal overflow ${max-r.innerWidth}px (max=${max}, viewport=${r.innerWidth})`);
}

try{
  for(const [width,height] of sizes){
    const context=await browser.newContext({viewport:{width,height},locale:'ar-EG',geolocation:{latitude:30.0444,longitude:31.2357},permissions:['geolocation']});
    await context.route('**/*',route=>{
      const u=new URL(route.request().url());
      if(u.hostname==='127.0.0.1'||u.hostname==='localhost')route.continue();
      else route.abort();
    });
    const page=await context.newPage();
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>typeof globalThis.GT==='function',{timeout:20000});
    await page.evaluate(()=>GT('home'));
    await page.waitForTimeout(800);
    await overflow(page,`home ${width}x${height}`);

    await page.evaluate(()=>GT('prayer'));
    await page.waitForFunction(()=>{
      const p=document.getElementById('page-prayer');
      return !!p&&p.classList.contains('active')&&!!document.getElementById('qa-prayer-details')&&!!document.getElementById('qa-adhan-sheet')&&!!globalThis.QiblaAdhanUI;
    },{timeout:20000});
    await page.waitForTimeout(300);
    await overflow(page,`prayer ${width}x${height}`);

    const details=await page.evaluate(()=>{
      const p=document.getElementById('page-prayer');
      const toggle=document.getElementById('qa-prayer-details-toggle');
      const details=document.getElementById('qa-prayer-details');
      const bodyStyle=getComputedStyle(document.body),pageStyle=p?getComputedStyle(p):null;
      return {page:!!p,toggleVisible:!!toggle&&getComputedStyle(toggle).display!=='none'&&!toggle.hidden,detailsVisible:!!details&&getComputedStyle(details).display!=='none'&&!details.hidden,bodyBg:bodyStyle.backgroundColor,pageBg:pageStyle&&pageStyle.backgroundImage};
    });
    assert.equal(details.page,true,`prayer page missing at ${width}x${height}`);
    assert.equal(details.toggleVisible,false,`legacy details collapse toggle must not be visible at ${width}x${height}`);
    assert.equal(details.detailsVisible,true,`prayer details must remain permanently visible at ${width}x${height}`);
    assert.notEqual(details.bodyBg,'rgb(1, 4, 11)',`prayer must not expose the dark app shell at ${width}x${height}`);
    assert.ok(details.pageBg&&details.pageBg!=='none',`prayer must own its cream background at ${width}x${height}`);

    const sheet=await page.evaluate(()=>{
      QiblaAdhanUI.open('muezzin');
      const s=document.getElementById('qa-adhan-sheet');
      const body=document.getElementById('qa-sheet-body');
      if(!s||!body)return null;
      const ss=getComputedStyle(s),bs=getComputedStyle(body),rect=s.getBoundingClientRect();
      return {hidden:s.hidden,top:rect.top,bottom:rect.bottom,viewport:innerHeight,bodyOverflowY:bs.overflowY,sheetMaxHeight:ss.maxHeight,animation:ss.animationName};
    });
    assert.ok(sheet,`adhan settings sheet missing at ${width}x${height}`);
    assert.equal(sheet.hidden,false,`adhan settings sheet did not open at ${width}x${height}`);
    assert.ok(sheet.top>=-2&&sheet.bottom<=height+2,`settings sheet exceeds viewport at ${width}x${height}: ${JSON.stringify(sheet)}`);
    assert.ok(['auto','scroll'].includes(sheet.bodyOverflowY)||sheet.sheetMaxHeight.includes('vh'),`settings sheet has no internal mobile scroll contract at ${width}x${height}: ${JSON.stringify(sheet)}`);
    assert.equal(sheet.animation,'qaSheetViewportFade',`prayer sheet must not animate below the viewport at ${width}x${height}`);
    await page.evaluate(()=>{const c=document.querySelector('[data-qa-close-sheet]');if(c)c.click();});

    await page.evaluate(()=>GT('night'));
    await page.waitForFunction(()=>{
      const frame=document.getElementById('qa-falaki-frame');
      return !!frame&&!!frame.contentDocument&&!!frame.contentDocument.querySelector('main.shell');
    },{timeout:20000});
    await page.waitForTimeout(150);
    const falaki=await page.evaluate(()=>{
      const p=document.getElementById('page-night'),f=document.getElementById('qa-falaki-frame'),h=document.getElementById('qa-internal-home-button');
      const pr=p.getBoundingClientRect(),fr=f.getBoundingClientRect(),svg=h&&h.querySelector('svg');
      return {pageHeight:pr.height,frameHeight:fr.height,viewport:innerHeight,pageBg:getComputedStyle(p).backgroundColor,bodyBg:getComputedStyle(document.body).backgroundColor,homeVisible:!!h&&!h.hidden&&getComputedStyle(h).display!=='none',svgVisible:!!svg&&getComputedStyle(svg).display!=='none',before:h?getComputedStyle(h,'::before').content:null};
    });
    assert.ok(falaki.pageHeight>=height-2&&falaki.frameHeight>=height-2,`Falaki host must fill viewport at ${width}x${height}: ${JSON.stringify(falaki)}`);
    assert.notEqual(falaki.pageBg,'rgba(0, 0, 0, 0)',`Falaki page background must not be transparent at ${width}x${height}`);
    assert.notEqual(falaki.bodyBg,'rgb(1, 4, 11)',`Falaki must not expose dark shell background at ${width}x${height}`);
    assert.equal(falaki.homeVisible,true,`Falaki Home button missing at ${width}x${height}`);
    assert.equal(falaki.svgVisible,true,`Falaki must show Home SVG at ${width}x${height}`);
    assert.ok(falaki.before==='none'||falaki.before==='normal',`Falaki must not show legacy back arrow at ${width}x${height}: ${falaki.before}`);

    await page.evaluate(()=>GT('serenity'));
    await page.waitForFunction(()=>{
      const p=document.getElementById('page-serenity');
      return !!p&&p.classList.contains('active')&&!!p.querySelector('.sr-stage');
    },{timeout:20000});
    await page.waitForTimeout(150);
    const serenity=await page.evaluate(()=>{
      const p=document.getElementById('page-serenity'),stage=p.querySelector('.sr-stage'),pr=p.getBoundingClientRect(),sr=stage.getBoundingClientRect(),ps=getComputedStyle(p),bs=getComputedStyle(document.body);
      return {viewport:innerHeight,pageHeight:pr.height,stageHeight:sr.height,pageScrollHeight:p.scrollHeight,pageClientHeight:p.clientHeight,pageOverflow:ps.overflowY,bodyOverflow:bs.overflowY,bodyHeight:document.body.scrollHeight,bodyBg:bs.backgroundColor};
    });
    assert.ok(Math.abs(serenity.pageHeight-height)<=2&&Math.abs(serenity.stageHeight-height)<=2,`Serenity must be exactly one viewport at ${width}x${height}: ${JSON.stringify(serenity)}`);
    assert.ok(serenity.pageScrollHeight<=serenity.pageClientHeight+2,`Serenity page must not have scrollable extra height at ${width}x${height}: ${JSON.stringify(serenity)}`);
    assert.equal(serenity.pageOverflow,'hidden',`Serenity page overflow must be hidden at ${width}x${height}`);
    assert.equal(serenity.bodyOverflow,'hidden',`Serenity body must not scroll at ${width}x${height}`);

    await context.close();
  }
  console.log('Mobile Chromium layout gate: PASS');
  console.log('Viewports: '+sizes.map(x=>x.join('x')).join(', '));
  console.log('Home + Prayer horizontal overflow: NONE');
  console.log('Prayer: full cream surface; details always visible; settings sheet viewport-contained');
  console.log('Falaki: full sky surface + real Home icon');
  console.log('Serenity: exactly one viewport with no page/body scroll');
} finally {
  await browser.close();
}
