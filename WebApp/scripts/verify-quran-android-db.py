#!/usr/bin/env python3
"""Compare QiblaAstro's 6236 ayat with Quran for Android's Uthmani Hafs DB.

The official app downloads `quran.ar.uthmani.v2.db.zip` from its Madani
`databases/` base URL, then opens the extracted SQLite database. This verifier
follows the same flow and compares local verse text against `share_text` and
`arabic_text` when available.

PASS levels:
- EXACT PASS: all 6236 local verses are byte-for-byte equal to one DB table.
- LETTER PASS: exact Unicode marks/typographic spacing differ, but Quranic
  letters match for all verses. This is diagnostic only and is not final
  certification of a particular Unicode encoding.
"""
from __future__ import annotations

import io
import json
import re
import sqlite3
import sys
import tempfile
import unicodedata
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QURAN_DIR = ROOT / "quran"
DB_NAME = "quran.ar.uthmani.v2.db"
DB_ZIP_URL = f"https://android.quran.com/data/databases/{DB_NAME}.zip"
EXPECTED = 6236
TABLES = ("share_text", "arabic_text")

MARKS_RE = re.compile(r"[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]")
QURANIC_ORNAMENT_RE = re.compile(r"[\u06dd\u06de\u06e9]")
# Thin/hair/zero-width spaces and word-joiner are typography, not Quranic letters.
TYPO_SPACE_RE = re.compile(r"[\u2000-\u200b\u202f\u2060\ufeff]")
SPACE_RE = re.compile(r" +")


def norm_letters(text: str) -> str:
    text = unicodedata.normalize("NFC", text)
    text = MARKS_RE.sub("", text)
    text = QURANIC_ORNAMENT_RE.sub("", text)
    text = TYPO_SPACE_RE.sub("", text)
    text = text.replace("ـ", "")
    return SPACE_RE.sub(" ", text).strip()


def load_local() -> dict[tuple[int, int], str]:
    out: dict[tuple[int, int], str] = {}
    for s in range(1, 115):
        data = json.loads((QURAN_DIR / f"{s}.json").read_text(encoding="utf-8"))
        for verse in data.get("verses", []):
            key = (s, int(verse["id"]))
            if key in out:
                raise RuntimeError(f"duplicate local verse {key}")
            out[key] = str(verse["text"])
    if len(out) != EXPECTED:
        raise RuntimeError(f"local corpus has {len(out)} verses, expected {EXPECTED}")
    return out


def download_db(path: Path) -> None:
    req = urllib.request.Request(DB_ZIP_URL, headers={"User-Agent": "QiblaAstro-Quran-Verification/1.0"})
    with urllib.request.urlopen(req, timeout=60) as response:
        payload = response.read()
    if len(payload) < 100_000 or not payload.startswith(b"PK"):
        raise RuntimeError(f"unexpected database zip download ({len(payload)} bytes)")
    with zipfile.ZipFile(io.BytesIO(payload)) as zf:
        candidates = [n for n in zf.namelist() if n.endswith(DB_NAME)]
        if not candidates:
            raise RuntimeError(f"{DB_NAME} not found in downloaded zip: {zf.namelist()[:10]}")
        data = zf.read(candidates[0])
    if len(data) < 500_000 or not data.startswith(b"SQLite format 3\x00"):
        raise RuntimeError(f"unexpected extracted database ({len(data)} bytes)")
    path.write_bytes(data)


def read_table(conn: sqlite3.Connection, table: str) -> dict[tuple[int, int], str] | None:
    names = {row[0] for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    if table not in names:
        return None
    cols = {row[1] for row in conn.execute(f"PRAGMA table_info({table})")}
    needed = {"sura", "ayah", "text"}
    if not needed.issubset(cols):
        raise RuntimeError(f"{table} is missing columns {sorted(needed - cols)}")
    rows = conn.execute(f"SELECT sura, ayah, text FROM {table} ORDER BY sura, ayah").fetchall()
    return {(int(s), int(a)): str(t) for s, a, t in rows}


def compare(local: dict[tuple[int, int], str], ref: dict[tuple[int, int], str], table: str) -> tuple[int, int]:
    exact = letters = missing = 0
    unicode_samples: list[tuple[tuple[int, int], str, str]] = []
    letter_mismatches: list[tuple[tuple[int, int], str, str, str, str]] = []
    for key, text in local.items():
        other = ref.get(key)
        if other is None:
            missing += 1
            continue
        if text == other:
            exact += 1
            letters += 1
            continue
        left_norm = norm_letters(text)
        right_norm = norm_letters(other)
        if left_norm == right_norm:
            letters += 1
            if len(unicode_samples) < 8:
                unicode_samples.append((key, text, other))
        else:
            letter_mismatches.append((key, text, other, left_norm, right_norm))
    print(f"\nTABLE {table}")
    print(f"  rows:                    {len(ref)}")
    print(f"  exact matches:           {exact}/{EXPECTED}")
    print(f"  normalized-letter match: {letters}/{EXPECTED}")
    print(f"  true letter mismatches:  {len(letter_mismatches)}")
    print(f"  missing keys:            {missing}")
    if unicode_samples:
        print("  Unicode/mark-only examples:")
        for (s, a), left, right in unicode_samples:
            print(f"    {s}:{a}\n      LOCAL: {left}\n      QFA:   {right}")
    if letter_mismatches:
        print("  TRUE LETTER-LEVEL DIFFERENCES:")
        for (s, a), left, right, left_norm, right_norm in letter_mismatches[:20]:
            print(f"    {s}:{a}")
            print(f"      LOCAL:       {left}")
            print(f"      QFA:         {right}")
            print(f"      LOCAL_NORM:  {left_norm}")
            print(f"      QFA_NORM:    {right_norm}")
    return exact, letters


def main() -> int:
    local = load_local()
    print(f"Local corpus: {len(local)} ayat")
    print(f"Reference zip: {DB_ZIP_URL}")
    best_exact = best_letters = 0
    best_table = None
    with tempfile.TemporaryDirectory(prefix="qibla-quran-verify-") as td:
        db_path = Path(td) / DB_NAME
        download_db(db_path)
        print(f"Downloaded/extracted Quran for Android DB: {db_path.stat().st_size} bytes")
        conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        try:
            for table in TABLES:
                ref = read_table(conn, table)
                if ref is None:
                    print(f"TABLE {table}: not present")
                    continue
                exact, letters = compare(local, ref, table)
                if (exact, letters) > (best_exact, best_letters):
                    best_exact, best_letters, best_table = exact, letters, table
        finally:
            conn.close()
    print("\nBEST RESULT")
    print(f"  table: {best_table}\n  exact: {best_exact}/{EXPECTED}\n  letters: {best_letters}/{EXPECTED}")
    if best_exact == EXPECTED:
        print("QURAN ANDROID INDEPENDENT EXACT VERIFICATION: PASS")
        return 0
    if best_letters == EXPECTED:
        print("QURAN ANDROID LETTER-LEVEL VERIFICATION: PASS (Unicode/marks review still required)")
        return 2
    print("QURAN ANDROID VERIFICATION: FAIL")
    return 1


if __name__ == "__main__":
    sys.exit(main())
