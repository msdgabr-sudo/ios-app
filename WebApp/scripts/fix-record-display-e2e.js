'use strict';
const fs=require('fs');

function replaceRequired(path, oldText, newText){
  let s=fs.readFileSync(path,'utf8');
  if(!s.includes(oldText)) throw new Error(path+': required pattern not found: '+oldText);
  s=s.replace(oldText,newText);
  fs.writeFileSync(path,s);
}

replaceRequired(
  'js/astronomical-verification-session.js',
  "      alignmentMode: 'qibla-axis',",
  "      alignmentMode: result.alignmentMode || 'astronomical-solved-bearing',"
);

let store=fs.readFileSync('js/astronomical-verification-store.js','utf8');
const publishOld=`  function publishCompatibility() {\n    if (root) root.__qiblaIndependentAstroRecord = lastRecord;\n  }`;
const publishNew=`  function publishCompatibility() {\n    if (!root) return;\n    root.__qiblaIndependentAstroRecord = lastRecord;\n    try {\n      if (typeof root.dispatchEvent === 'function' && typeof root.CustomEvent === 'function') {\n        root.dispatchEvent(new root.CustomEvent('qiblaastro:astronomical-record', { detail: lastRecord }));\n      }\n    } catch (_) {}\n  }`;
if(!store.includes(publishOld)) throw new Error('store publishCompatibility block not found');
store=store.replace(publishOld,publishNew);
fs.writeFileSync('js/astronomical-verification-store.js',store);

let runtime=fs.readFileSync('js/qibla-card-runtime.js','utf8');
const runtimeOld=`  if (root.document) {\n    if (root.document.readyState === 'loading') {\n      root.document.addEventListener('DOMContentLoaded', start, { once: true });\n    } else {\n      start();\n    }\n  }`;
const runtimeNew=`  if (typeof root.addEventListener === 'function') {\n    root.addEventListener('qiblaastro:astronomical-record', function () { updateCards(true); });\n  }\n\n  if (root.document) {\n    if (root.document.readyState === 'loading') {\n      root.document.addEventListener('DOMContentLoaded', start, { once: true });\n    } else {\n      start();\n    }\n  }`;
if(!runtime.includes(runtimeOld)) throw new Error('runtime startup block not found');
runtime=runtime.replace(runtimeOld,runtimeNew);
fs.writeFileSync('js/qibla-card-runtime.js',runtime);

let sw=fs.readFileSync('service-worker.js','utf8');
sw=sw.replace(/Service Worker v[0-9.]+/,'Service Worker v5.16');
sw=sw.replace(/const VERSION = '[^']+';/,"const VERSION = 'qiblaastro-v5.16-record-display-e2e';");
fs.writeFileSync('service-worker.js',sw);

console.log('End-to-end astronomical record display path repaired.');
