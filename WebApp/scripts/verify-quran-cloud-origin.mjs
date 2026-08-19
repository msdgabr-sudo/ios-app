#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = process.cwd();
const QURAN_DIR = path.join(ROOT, 'quran');
const REF_URL = 'https://cdn.jsdelivr.net/npm/quran-cloud@1.0.0/dist/quran.json';
const EXPECTED_SURAHS = 114;
const EXPECTED_AYAT = 6236;

function sha256(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}
function fail(msg) { console.error('FAIL:', msg); process.exitCode = 1; }
function ok(msg) { console.log('OK:', msg); }

console.log('QiblaAstro Quran exact Arabic corpus verification');
console.log('Pinned reference:', REF_URL);
console.log('Verification scope: Arabic Quran text, surah identity/type/counts, and ayah ids/order.');
console.log('Source chain documented in QURAN_SOURCES.md: quran-cloud@1.0.0 declares its Uthmani Arabic source as QuranEnc / The Noble Qur\'an Encyclopedia.');

let response;
try {
  response = await fetch(REF_URL, { headers: { 'user-agent': 'QiblaAstro-Quran-Verification/2.1' } });
} catch (e) {
  fail(`cannot fetch pinned reference: ${e.message}`);
  process.exit(1);
}
if (!response.ok) {
  fail(`reference HTTP ${response.status}`);
  process.exit(1);
}

const referenceRaw = await response.text();
const referenceDownloadSha = sha256(referenceRaw);
let ref;
try { ref = JSON.parse(referenceRaw); }
catch (e) { fail(`reference JSON parse failed: ${e.message}`); process.exit(1); }

const surahs = Array.isArray(ref) ? ref : (Array.isArray(ref?.chapters) ? ref.chapters : Array.isArray(ref?.data) ? ref.data : null);
if (!surahs || surahs.length !== EXPECTED_SURAHS) {
  fail(`unexpected reference surah count: ${surahs?.length ?? 'unknown'}, expected ${EXPECTED_SURAHS}`);
  process.exit(1);
}

let verses = 0;
let textMismatches = 0;
let metadataMismatches = 0;
const localTextLines = [];
const referenceTextLines = [];

for (let s = 1; s <= EXPECTED_SURAHS; s++) {
  const localPath = path.join(QURAN_DIR, `${s}.json`);
  let local;
  try { local = JSON.parse(await fs.readFile(localPath, 'utf8')); }
  catch (e) { fail(`cannot read/parse quran/${s}.json: ${e.message}`); continue; }

  const remote = surahs[s - 1];
  for (const field of ['id', 'name', 'type', 'total_verses']) {
    if ((local?.[field] ?? null) !== (remote?.[field] ?? null)) {
      metadataMismatches++;
      if (metadataMismatches <= 20) console.error(`METADATA MISMATCH surah ${s} ${field}: LOCAL=${JSON.stringify(local?.[field])} REF=${JSON.stringify(remote?.[field])}`);
    }
  }

  if (!Array.isArray(local?.verses) || !Array.isArray(remote?.verses)) {
    fail(`surah ${s}: missing verses array`);
    continue;
  }
  if (local.verses.length !== remote.verses.length) {
    metadataMismatches++;
    console.error(`VERSE COUNT MISMATCH surah ${s}: LOCAL=${local.verses.length} REF=${remote.verses.length}`);
  }

  const n = Math.min(local.verses.length, remote.verses.length);
  for (let i = 0; i < n; i++) {
    const a = local.verses[i];
    const b = remote.verses[i];
    const ayah = i + 1;
    verses++;

    if (a?.id !== b?.id || a?.id !== ayah) {
      metadataMismatches++;
      if (metadataMismatches <= 20) console.error(`AYAH ID MISMATCH ${s}:${ayah}: LOCAL=${a?.id} REF=${b?.id}`);
    }

    const localText = String(a?.text ?? '');
    const refText = String(b?.text ?? '');
    localTextLines.push(`${s}|${ayah}|${localText}`);
    referenceTextLines.push(`${s}|${ayah}|${refText}`);

    if (localText !== refText) {
      textMismatches++;
      if (textMismatches <= 20) console.error(`TEXT MISMATCH ${s}:${ayah}\nLOCAL: ${localText}\nREF:   ${refText}\n`);
    }
  }
}

const localCanonical = localTextLines.join('\n') + '\n';
const refCanonical = referenceTextLines.join('\n') + '\n';
const localTextSha = sha256(localCanonical);
const referenceTextSha = sha256(refCanonical);

console.log('\nVerification summary');
console.log(`SURAHS_COMPARED=${EXPECTED_SURAHS}`);
console.log(`AYAT_COMPARED=${verses}`);
console.log(`TEXT_MISMATCHES=${textMismatches}`);
console.log(`METADATA_MISMATCHES=${metadataMismatches}`);
console.log(`REFERENCE_DOWNLOAD_SHA256=${referenceDownloadSha}`);
console.log(`LOCAL_QURAN_TEXT_SHA256=${localTextSha}`);
console.log(`REFERENCE_QURAN_TEXT_SHA256=${referenceTextSha}`);
console.log('TRANSLITERATION_CHECK=OUT_OF_RELEASE_SCOPE');

if (verses !== EXPECTED_AYAT) fail(`compared ${verses} ayat, expected ${EXPECTED_AYAT}`);
if (textMismatches) fail(`${textMismatches} exact Quran text mismatches`);
if (metadataMismatches) fail(`${metadataMismatches} metadata/id/count mismatches`);
if (localTextSha !== referenceTextSha) fail('canonical Quran text SHA-256 differs despite comparison pass');

if (!process.exitCode) {
  ok(`all ${EXPECTED_SURAHS} surahs / ${EXPECTED_AYAT} ayat match the pinned Arabic reference exactly`);
  console.log('\nQURAN EXACT TEXT CHECK: PASS');
  console.log('QURAN PROVENANCE CHECK: PASS');
}
