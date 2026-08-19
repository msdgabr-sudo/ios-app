#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const QURAN_DIR = path.join(ROOT, 'quran');
const EXPECTED_SURAH_COUNTS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];

function fail(msg){ console.error('FAIL:', msg); process.exitCode = 1; }
function ok(msg){ console.log('OK:', msg); }

let total = 0;
for (let s = 1; s <= 114; s++) {
  const file = path.join(QURAN_DIR, `${s}.json`);
  let data;
  try { data = JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (e) { fail(`cannot read/parse ${file}: ${e.message}`); continue; }

  if (data.id !== s) fail(`surah ${s}: id=${data.id}`);
  if (!Array.isArray(data.verses)) { fail(`surah ${s}: verses missing`); continue; }
  if (data.verses.length !== EXPECTED_SURAH_COUNTS[s-1]) fail(`surah ${s}: ${data.verses.length} verses, expected ${EXPECTED_SURAH_COUNTS[s-1]}`);
  if (data.total_verses !== EXPECTED_SURAH_COUNTS[s-1]) fail(`surah ${s}: total_verses=${data.total_verses}, expected ${EXPECTED_SURAH_COUNTS[s-1]}`);
  data.verses.forEach((v, i) => {
    if (v.id !== i + 1) fail(`surah ${s}: verse id sequence broken at ${i+1}`);
    if (typeof v.text !== 'string' || !v.text.trim()) fail(`surah ${s}:${i+1}: empty text`);
  });
  total += data.verses.length;
}

if (total !== 6236) fail(`total verses=${total}, expected 6236`); else ok('structural count is 114 surahs / 6236 ayat');

const refArg = process.argv[2];
if (!refArg) {
  console.log('\nREFERENCE COMPARISON NOT RUN.');
  console.log('Usage: node scripts/verify-quran-text.mjs path/to/official-reference.txt');
  console.log('Reference format: one line per ayah as surah|ayah|text.');
  console.log('Final release must NOT be marked Quran-text-verified until this exact comparison passes.');
  process.exit(process.exitCode || 2);
}

const refText = await fs.readFile(path.resolve(refArg), 'utf8');
const ref = new Map();
for (const raw of refText.split(/\r?\n/)) {
  const line = raw.trimEnd();
  if (!line || line.startsWith('#')) continue;
  const m = line.match(/^(\d+)\|(\d+)\|(.*)$/);
  if (!m) continue;
  ref.set(`${Number(m[1])}:${Number(m[2])}`, m[3]);
}
if (ref.size !== 6236) fail(`reference has ${ref.size} ayat, expected 6236`);

let mismatches = 0;
for (let s = 1; s <= 114; s++) {
  const data = JSON.parse(await fs.readFile(path.join(QURAN_DIR, `${s}.json`), 'utf8'));
  for (const v of data.verses) {
    const key = `${s}:${v.id}`;
    const expected = ref.get(key);
    if (expected === undefined) { fail(`reference missing ${key}`); mismatches++; continue; }
    if (v.text !== expected) {
      mismatches++;
      if (mismatches <= 20) {
        console.error(`MISMATCH ${key}\nLOCAL: ${v.text}\nREF:   ${expected}\n`);
      }
    }
  }
}
if (mismatches) fail(`${mismatches} exact text mismatches`); else ok('all 6236 ayat exactly match the supplied official reference');

if (!process.exitCode) console.log('\nQURAN TEXT VERIFICATION: PASS');
