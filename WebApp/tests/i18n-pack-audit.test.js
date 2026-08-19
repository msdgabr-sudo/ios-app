'use strict';

const fs = require('fs');
const vm = require('vm');

const rollout = fs.readFileSync('js/i18n/english-rollout.js', 'utf8');
const active = [
  'ui-phrases.js','home-phrases.js','module-phrases.js',
  'extra-phrases.js','prayer-phrases.js','status-phrases.js','general-phrases.js',
  'dynamic-patterns.js','en-batch1.js','en-safe2.js','safe4-phrases.js','fr-phrases.js'
];

if (rollout.includes('js/i18n/languages.js')) {
  throw new Error('Unused legacy languages.js registry was reintroduced into Production.');
}

const bySource = new Map();
const byFile = new Map();
const fileBytes = new Map();
let totalBytes = 0;
for (const name of active) {
  const path = 'js/i18n/' + name;
  if (!fs.existsSync(path)) throw new Error('Missing active i18n pack: ' + path);
  if (!rollout.includes(path)) throw new Error('Pack exists but is not wired in Production: ' + path);
  const text = fs.readFileSync(path, 'utf8');
  const bytes = Buffer.byteLength(text);
  totalBytes += bytes;
  fileBytes.set(name, bytes);
  const keys = new Set();
  const re = /['"]([^'"\n]*[\u0600-\u06FF][^'"\n]*)['"]\s*:/g;
  let m;
  while ((m = re.exec(text))) {
    const key = m[1];
    keys.add(key);
    if (!bySource.has(key)) bySource.set(key, new Set());
    bySource.get(key).add(name);
  }
  byFile.set(name, keys);
}

const duplicates = [...bySource.entries()]
  .filter(([, files]) => files.size > 1)
  .map(([key, files]) => ({ key, files: [...files] }))
  .sort((a, b) => b.files.length - a.files.length || a.key.localeCompare(b.key));

const fileStats = active.map(name => {
  const keys = byFile.get(name);
  let unique = 0;
  let duplicated = 0;
  for (const key of keys) {
    if (bySource.get(key).size === 1) unique++;
    else duplicated++;
  }
  return { name, bytes: fileBytes.get(name), keys: keys.size, unique, duplicated };
}).sort((a, b) => a.unique - b.unique || a.keys - b.keys || a.name.localeCompare(b.name));

// Evaluate translation data in a DOM-free VM so we can measure which packs actually
// change the effective final map, not merely whether the same Arabic key appears twice.
const ctx = { console };
ctx.globalThis = ctx;
ctx.window = ctx;
vm.createContext(ctx);
for (const name of active) {
  vm.runInContext(fs.readFileSync('js/i18n/' + name, 'utf8'), ctx, { filename: name });
}

const baseLayers = [
  ['ui-phrases.js','MIZAN_UI_PHRASES'],
  ['home-phrases.js','MIZAN_HOME_PHRASES'],
  ['module-phrases.js','MIZAN_MODULE_PHRASES'],
  ['extra-phrases.js','MIZAN_EXTRA_PHRASES'],
  ['prayer-phrases.js','MIZAN_PRAYER_PHRASES'],
  ['status-phrases.js','MIZAN_STATUS_PHRASES'],
  ['general-phrases.js','MIZAN_GENERAL_PHRASES'],
  ['safe4-phrases.js','MIZAN_SAFE4_PHRASES']
];
const langs = ['en','fr','id','ur'];
function effectiveMap(lang, excluded) {
  const out = {};
  for (const [file, globalName] of baseLayers) {
    if (file === excluded) continue;
    Object.assign(out, (ctx[globalName] && ctx[globalName][lang]) || {});
  }
  if (lang === 'en') {
    if (excluded !== 'en-batch1.js') Object.assign(out, ctx.MIZAN_EN_BATCH1_PHRASES || {});
    if (excluded !== 'en-safe2.js') Object.assign(out, ctx.MIZAN_EN_SAFE2_PHRASES || {});
  }
  if (lang === 'fr' && excluded !== 'fr-phrases.js') Object.assign(out, ctx.MIZAN_FR_PHRASES || {});
  return out;
}
function effectiveDynamic(lang) {
  let out = [];
  if (ctx.MIZAN_DYNAMIC_PATTERNS && ctx.MIZAN_DYNAMIC_PATTERNS[lang]) out = out.concat(ctx.MIZAN_DYNAMIC_PATTERNS[lang]);
  if (ctx.MIZAN_SAFE4_DYNAMIC && ctx.MIZAN_SAFE4_DYNAMIC[lang]) out = out.concat(ctx.MIZAN_SAFE4_DYNAMIC[lang]);
  if (lang === 'en') {
    if (ctx.MIZAN_EN_BATCH1_DYNAMIC) out = out.concat(ctx.MIZAN_EN_BATCH1_DYNAMIC);
    if (ctx.MIZAN_EN_SAFE2_DYNAMIC) out = out.concat(ctx.MIZAN_EN_SAFE2_DYNAMIC);
  }
  if (lang === 'fr' && ctx.MIZAN_FR_DYNAMIC) out = out.concat(ctx.MIZAN_FR_DYNAMIC);
  return out;
}
function effectiveChangeCount(file) {
  const perLang = {};
  let total = 0;
  for (const lang of langs) {
    const full = effectiveMap(lang, null);
    const reduced = effectiveMap(lang, file);
    let changed = 0;
    for (const key of Object.keys(full)) {
      if (full[key] !== reduced[key]) changed++;
    }
    perLang[lang] = changed;
    total += changed;
  }
  return { perLang, total };
}

// Transitional unified layer must be an exact semantic snapshot of current Production.
const unifiedPath = 'js/i18n/unified-phrases.js';
if (!fs.existsSync(unifiedPath)) throw new Error('Missing unified i18n compatibility layer.');
vm.runInContext(fs.readFileSync(unifiedPath, 'utf8'), ctx, { filename: 'unified-phrases.js' });
for (const lang of langs) {
  const legacy = effectiveMap(lang, null);
  const unified = ctx.MIZAN_UNIFIED_PHRASES && ctx.MIZAN_UNIFIED_PHRASES[lang];
  if (!unified) throw new Error('Unified static map missing language: ' + lang);
  const legacyJson = JSON.stringify(legacy);
  const unifiedJson = JSON.stringify(unified);
  if (legacyJson !== unifiedJson) throw new Error('Unified static map differs from Production for ' + lang);

  const legacyDyn = effectiveDynamic(lang);
  const unifiedDyn = ctx.MIZAN_UNIFIED_DYNAMIC && ctx.MIZAN_UNIFIED_DYNAMIC[lang];
  if (!unifiedDyn) throw new Error('Unified dynamic list missing language: ' + lang);
  if (JSON.stringify(legacyDyn) !== JSON.stringify(unifiedDyn)) {
    throw new Error('Unified dynamic pattern order/content differs from Production for ' + lang);
  }
}

console.log('PASS: all Production i18n packs exist and are wired.');
console.log('PASS: unified i18n data is byte-for-byte equivalent at the map/pattern level for EN/FR/ID/UR.');
console.log('INFO: active pack count:', active.length);
console.log('INFO: active pack bytes:', totalBytes);
console.log('INFO: detected Arabic source keys:', bySource.size);
console.log('INFO: source keys duplicated across packs:', duplicates.length);
for (const stat of fileStats) {
  const impact = effectiveChangeCount(stat.name);
  console.log('PACK:', stat.name, 'bytes='+stat.bytes, 'keys='+stat.keys, 'unique='+stat.unique, 'duplicated='+stat.duplicated,
    'effective='+impact.total, 'en='+impact.perLang.en, 'fr='+impact.perLang.fr, 'id='+impact.perLang.id, 'ur='+impact.perLang.ur);
}
for (const item of duplicates.slice(0, 40)) {
  console.log('DUP:', JSON.stringify(item.key), '=>', item.files.join(', '));
}
