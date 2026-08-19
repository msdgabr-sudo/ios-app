'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const html = fs.readFileSync('index.html','utf8');
const lines = html.split(/\r?\n/);

function sha256(s){ return crypto.createHash('sha256').update(s).digest('hex'); }
function uniq(arr){ return [...new Set(arr)]; }
function matches(re, s){ const out=[]; let m; while((m=re.exec(s))) out.push(m); return out; }

const scripts=[];
const scriptRe=/<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
let sm;
while((sm=scriptRe.exec(html))){
  const attrs=sm[1]||'';
  const body=sm[2]||'';
  const srcMatch=attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
  const before=html.slice(0,sm.index);
  const startLine=before.split(/\r?\n/).length;
  const endLine=startLine+(sm[0].match(/\n/g)||[]).length;
  scripts.push({
    type:srcMatch?'external':'inline',
    src:srcMatch?srcMatch[1]:null,
    startLine,endLine,
    bytes:Buffer.byteLength(sm[0]),
    bodyBytes:Buffer.byteLength(body),
    sha256:sha256(body),
    containsProtectedTokens:/QiblaAstronomical|astronomical|trueCameraHeading|verificationOffset|targetAz|targetAlt|QT\b|deviceHeading|camera|gravity|solver|verification/i.test(body)
  });
}

const styles=[];
const styleRe=/<style\b([^>]*)>([\s\S]*?)<\/style>/gi;
let stm;
while((stm=styleRe.exec(html))){
  const body=stm[2]||'';
  const startLine=html.slice(0,stm.index).split(/\r?\n/).length;
  styles.push({startLine,endLine:startLine+(stm[0].match(/\n/g)||[]).length,bytes:Buffer.byteLength(stm[0]),bodyBytes:Buffer.byteLength(body),sha256:sha256(body)});
}

const externalCss=matches(/<link\b[^>]*\brel\s*=\s*["']stylesheet["'][^>]*>/gi,html).map(x=>{
  const m=x[0].match(/\bhref\s*=\s*["']([^"']+)["']/i); return m?m[1]:null;
}).filter(Boolean);
const ids=matches(/\bid\s*=\s*["']([^"']+)["']/gi,html).map(x=>x[1]);
const idCounts={}; ids.forEach(id=>idCounts[id]=(idCounts[id]||0)+1);
const duplicateIds=Object.entries(idCounts).filter(([,n])=>n>1).map(([id,count])=>({id,count}));
const onclicks=matches(/\bonclick\s*=\s*["']([^"']+)["']/gi,html).map(x=>x[1]);
const inlineHandlers=matches(/\bon(?:click|change|input|submit|load|error|touchstart|touchend)\s*=\s*["']([^"']+)["']/gi,html).map(x=>x[1]);
const pageIds=ids.filter(id=>/^page-/.test(id));

const protectedRefs=[];
const protectedPatterns=['astronomical-solver','astronomical-verification-session','astronomical-verification-store','astronomical-observation-bridge','celestial-detector','camera-projection','camera-pose','gravity-reference','astro-qibla-engine','astro-verification'];
for(const p of protectedPatterns){ if(html.includes(p)) protectedRefs.push(p); }

const markers=lines.map((line,i)=>({line:i+1,text:line.trim()})).filter(x=>/^<!--/.test(x.text) && /(SECTION|SERVICE WORKER|QIBLA|ASTRO|CAMERA|VERIFICATION|PAGE|SCRIPT|CSS)/i.test(x.text)).slice(0,300);

const inlineScriptBytes=scripts.filter(s=>s.type==='inline').reduce((a,s)=>a+s.bodyBytes,0);
const inlineStyleBytes=styles.reduce((a,s)=>a+s.bodyBytes,0);
const report={
  generatedAt:new Date().toISOString(),
  index:{bytes:Buffer.byteLength(html),lines:lines.length,sha256:sha256(html)},
  scripts:{total:scripts.length,external:scripts.filter(s=>s.type==='external').length,inline:scripts.filter(s=>s.type==='inline').length,inlineBodyBytes:inlineScriptBytes,items:scripts},
  styles:{inline:styles.length,inlineBodyBytes:inlineStyleBytes,items:styles,externalCss},
  dom:{ids:ids.length,uniqueIds:uniq(ids).length,duplicateIds,pageIds:uniq(pageIds),onclickCount:onclicks.length,inlineHandlerCount:inlineHandlers.length},
  protectedRefs,
  markers,
  risk:{
    inlineScriptsTouchingProtectedTokens:scripts.filter(s=>s.type==='inline'&&s.containsProtectedTokens).map(s=>({startLine:s.startLine,endLine:s.endLine,bytes:s.bodyBytes,sha256:s.sha256})),
    duplicateIdCount:duplicateIds.length
  }
};

fs.mkdirSync('reports',{recursive:true});
fs.writeFileSync('reports/index-surgery-audit.json',JSON.stringify(report,null,2)+'\n');

const md=[];
md.push('# QiblaAstro index.html Surgical Audit','',`Generated: ${report.generatedAt}`,'');
md.push(`- index.html: **${(report.index.bytes/1024).toFixed(2)} KB**, **${report.index.lines} lines**`);
md.push(`- Scripts: **${report.scripts.total}** total = ${report.scripts.external} external + ${report.scripts.inline} inline`);
md.push(`- Inline JavaScript bodies: **${(inlineScriptBytes/1024).toFixed(2)} KB**`);
md.push(`- Inline style blocks: **${styles.length}**, **${(inlineStyleBytes/1024).toFixed(2)} KB**`);
md.push(`- External stylesheets: **${externalCss.length}**`);
md.push(`- DOM IDs: **${ids.length}** occurrences / **${uniq(ids).length}** unique`);
md.push(`- Duplicate IDs: **${duplicateIds.length}**`);
md.push(`- Inline event handlers: **${inlineHandlers.length}**`);
md.push(`- Protected-core filenames referenced directly in index: **${protectedRefs.length}**`,'');
md.push('## Script order','', '| # | Type | Lines | Body size | Protected-token risk | Source |','|---:|---|---:|---:|---|---|');
scripts.forEach((s,i)=>md.push(`| ${i+1} | ${s.type} | ${s.startLine}-${s.endLine} | ${(s.bodyBytes/1024).toFixed(2)} KB | ${s.containsProtectedTokens?'YES':'no'} | ${s.src||'inline'} |`));
md.push('','## Duplicate IDs','');
if(duplicateIds.length) duplicateIds.forEach(x=>md.push(`- \`${x.id}\` × ${x.count}`)); else md.push('- None');
md.push('','## Page IDs',''); pageIds.length?uniq(pageIds).forEach(x=>md.push(`- \`${x}\``)):md.push('- None');
md.push('','## Protected references',''); protectedRefs.length?protectedRefs.forEach(x=>md.push(`- \`${x}\``)):md.push('- None');
md.push('','## Surgical rule','', 'No inline block marked with protected-token risk may be extracted or edited until its dependencies and execution order are frozen by a dedicated regression test.');
fs.writeFileSync('reports/index-surgery-audit.md',md.join('\n')+'\n');
console.log(JSON.stringify({indexBytes:report.index.bytes,indexLines:report.index.lines,inlineScriptBytes,inlineStyleBytes,scripts:scripts.length,duplicateIds:duplicateIds.length,inlineHandlers:inlineHandlers.length},null,2));
