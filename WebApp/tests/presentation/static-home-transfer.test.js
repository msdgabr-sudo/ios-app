'use strict';
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
function fail(msg){throw new Error(msg);}
const html=read('index.html');
const homeJs=read('js/home-final.js');
const sw=read('service-worker.js');
const nav=read('css/06-navigation.css');

const must=[
  'id="page-home"','id="qa-home"',
  'data-go="compass" data-compass-mode="digital"',
  'data-go="compass" data-compass-mode="astro"',
  '>التحقق الفلكي<','>القبلة الرقمية<',
  'id="qibla-compass-engine-anchors"','id="cvs"','id="dev-slider"',
  'id="page-compass" data-external-page="compass"',
  'id="page-night" data-external-page="falaki"'
];
for(const token of must) if(!html.includes(token)) fail('Missing static Home contract token: '+token);
for(const id of ['page-home','qa-home','page-compass','page-night','cvs','dev-slider']){
  const n=(html.match(new RegExp('id=["\\\']'+id+'["\\\']','g'))||[]).length;
  if(n!==1) fail('Expected one '+id+', found '+n);
}
if(/createElement\(['"]main['"]\)/.test(homeJs)||homeJs.includes('page.insertBefore(root')||homeJs.includes('root.innerHTML')){
  fail('home-final.js must bind static Home, not generate it');
}
if(!nav.includes('body.tab-home .nav')||!nav.includes('body.tab-home .bottom-nav')) fail('First-paint legacy navigation suppression missing');
for(const asset of [
  './css/home-final.css','./css/home-header-controls.css','./js/home-final.js',
  './js/home-reference-finalizer.js','./images/home/qibla-bg-4k.webp','./images/home/kaaba-reference.data-uri.txt'
]) if(!sw.includes(asset)) fail('Home offline asset missing: '+asset);
if(!sw.includes("qiblaastro-v5.56-static-home-integrated")) fail('Expected Home-integrated cache version');
console.log('Static Home transfer contract: PASS');
