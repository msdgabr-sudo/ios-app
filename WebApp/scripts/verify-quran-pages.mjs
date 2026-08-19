#!/usr/bin/env node
import fs from 'node:fs/promises';

const LOCAL='js/quran-pages.js';
const REMOTE='https://raw.githubusercontent.com/quran-center/quran-meta/master/src/lists/HafsLists.ts';

function extract(src,name){const m=src.match(new RegExp(`(?:const|export const)\\s+${name}[^=]*=\\s*\\[([\\s\\S]*?)\\]`));if(!m)throw new Error(`cannot find ${name}`);return m[1].split(',').map(x=>Number(x.trim())).filter(Number.isFinite)}
function die(msg){console.error('FAIL:',msg);process.exitCode=1}

const localSrc=await fs.readFile(LOCAL,'utf8');
const pages=extract(localSrc,'PAGE_STARTS');
const counts=extract(localSrc,'COUNTS');
if(counts.length!==114)die(`COUNTS length ${counts.length}, expected 114`);
if(counts.reduce((a,b)=>a+b,0)!==6236)die('surah counts do not sum to 6236');
if(pages.length!==606)die(`PAGE_STARTS length ${pages.length}, expected 606 (dummy + 604 pages + sentinel)`);
if(pages[0]!==0||pages[1]!==1||pages[604]!==6222||pages[605]!==6237)die(`unexpected page boundary sentinels: ${pages[0]},${pages[1]},${pages[604]},${pages[605]}`);
for(let i=2;i<pages.length;i++)if(pages[i]<=pages[i-1])die(`page starts not strictly increasing at index ${i}`);

let remoteSrc;
try{const r=await fetch(REMOTE,{headers:{'user-agent':'QiblaAstro-Quran-Verification/1.0'}});if(!r.ok)throw new Error(`HTTP ${r.status}`);remoteSrc=await r.text()}catch(e){die(`cannot fetch quran-meta reference: ${e.message}`)}
if(remoteSrc){const ref=extract(remoteSrc,'PageList');if(ref.length!==pages.length)die(`reference PageList length ${ref.length} != ${pages.length}`);else{let mismatch=0;for(let i=0;i<pages.length;i++)if(pages[i]!==ref[i]){mismatch++;if(mismatch<=10)console.error(`MISMATCH page index ${i}: local=${pages[i]} ref=${ref[i]}`)}if(mismatch)die(`${mismatch} page metadata mismatches`);else console.log('OK: local 604-page metadata exactly matches quran-center/quran-meta Hafs PageList')}}
if(!process.exitCode)console.log('QURAN PAGE METADATA VERIFICATION: PASS');
