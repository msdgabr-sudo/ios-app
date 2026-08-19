import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const base=process.env.QIBLA_TEST_URL||'http://127.0.0.1:8765/index.html';
const sizes=[[360,800],[393,873],[412,915]];
const browser=await chromium.launch({headless:true});

async function waitForInternalFrame(page,needle,selector){
  await page.waitForFunction(({needle,selector})=>{
    const f=[...document.querySelectorAll('iframe')].find(x=>(x.getAttribute('src')||'').includes(needle));
    return !!f&&!!f.contentDocument&&!!f.contentDocument.querySelector(selector);
  },{needle,selector},{timeout:20000});
}

try{
  for(const [width,height] of sizes){
    const context=await browser.newContext({viewport:{width,height},locale:'ar-EG'});
    await context.route('**/*',route=>{
      const u=new URL(route.request().url());
      if(u.hostname==='127.0.0.1'||u.hostname==='localhost')route.continue();
      else route.abort();
    });
    const page=await context.newPage();
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>typeof globalThis.GT==='function',{timeout:20000});

    await page.evaluate(()=>GT('quran'));
    await waitForInternalFrame(page,'pages/quran.html','#qrReader #qrText');
    const quran=await page.evaluate(()=>{
      const f=[...document.querySelectorAll('iframe')].find(x=>(x.getAttribute('src')||'').includes('pages/quran.html'));
      const d=f.contentDocument,w=f.contentWindow;
      const home=d.getElementById('qrHome'),reader=d.getElementById('qrReader'),surface=d.getElementById('qrReadingSurface'),text=d.getElementById('qrText');
      if(home)home.style.display='none';
      reader.style.display='block';reader.style.visibility='visible';
      text.innerHTML='<span class="qr-ayah">الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ الرَّحْمَٰنِ الرَّحِيمِ مَالِكِ يَوْمِ الدِّينِ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ</span>';
      const sr=surface.getBoundingClientRect(),tr=text.getBoundingClientRect(),cs=w.getComputedStyle(text);
      return {viewport:w.innerWidth,surfaceLeft:sr.left,surfaceRight:sr.right,textLeft:tr.left,textRight:tr.right,textWidth:tr.width,dir:cs.direction,align:cs.textAlign,docWidth:d.documentElement.scrollWidth};
    });
    assert.ok(quran.surfaceLeft<=2&&quran.viewport-quran.surfaceRight<=2,`Quran surface is not viewport-wide at ${width}x${height}: ${JSON.stringify(quran)}`);
    assert.ok(quran.textLeft<=10&&quran.viewport-quran.textRight<=10,`Quran text gutters exceed 10px at ${width}x${height}: ${JSON.stringify(quran)}`);
    assert.ok(quran.textWidth>=quran.viewport-20,`Quran text does not use the available width at ${width}x${height}: ${JSON.stringify(quran)}`);
    assert.equal(quran.dir,'rtl',`Quran text lost RTL at ${width}x${height}`);
    assert.equal(quran.align,'justify',`Quran text is not justified at ${width}x${height}`);
    assert.ok(quran.docWidth<=quran.viewport+3,`Quran rule creates horizontal overflow at ${width}x${height}: ${JSON.stringify(quran)}`);

    await page.evaluate(()=>GT('azkar'));
    await waitForInternalFrame(page,'pages/azkar.html','#azReader #azDhikrText');
    const azkar=await page.evaluate(()=>{
      const f=[...document.querySelectorAll('iframe')].find(x=>(x.getAttribute('src')||'').includes('pages/azkar.html'));
      const d=f.contentDocument,w=f.contentWindow;
      const home=d.getElementById('azHome'),reader=d.getElementById('azReader'),card=d.getElementById('azDhikrCard'),text=d.getElementById('azDhikrText');
      if(home){home.classList.remove('is-active');home.style.display='none';}
      reader.classList.add('is-active');reader.style.display='block';reader.style.visibility='visible';
      text.textContent='أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ';
      const cr=card.getBoundingClientRect(),tr=text.getBoundingClientRect(),cs=w.getComputedStyle(text);
      return {viewport:w.innerWidth,cardLeft:cr.left,cardRight:cr.right,textLeft:tr.left,textRight:tr.right,textWidth:tr.width,dir:cs.direction,align:cs.textAlign,docWidth:d.documentElement.scrollWidth};
    });
    assert.ok(azkar.cardLeft<=8&&azkar.viewport-azkar.cardRight<=8,`Adhkar card does not use phone width at ${width}x${height}: ${JSON.stringify(azkar)}`);
    assert.ok(azkar.textLeft<=18&&azkar.viewport-azkar.textRight<=18,`Adhkar text gutters exceed 18px at ${width}x${height}: ${JSON.stringify(azkar)}`);
    assert.ok(azkar.textWidth>=azkar.viewport-36,`Adhkar text does not use the available width at ${width}x${height}: ${JSON.stringify(azkar)}`);
    assert.equal(azkar.dir,'rtl',`Adhkar text lost RTL at ${width}x${height}`);
    assert.equal(azkar.align,'justify',`Adhkar text is not justified at ${width}x${height}`);
    assert.ok(azkar.docWidth<=azkar.viewport+3,`Adhkar rule creates horizontal overflow at ${width}x${height}: ${JSON.stringify(azkar)}`);

    await context.close();
  }
  console.log('Reading width gate: PASS');
  console.log('Quran: <=10px side gutters; RTL; justified; no horizontal overflow');
  console.log('Adhkar: <=18px side gutters; RTL; justified; no horizontal overflow');
  console.log('Viewports: '+sizes.map(x=>x.join('x')).join(', '));
} finally {
  await browser.close();
}
