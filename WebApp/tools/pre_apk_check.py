#!/usr/bin/env python3
"""QiblaAstro ELITE pre-APK release gate.

Read-only validation. It does not modify application files.
"""
from __future__ import annotations

import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
EXPECTED_PACKAGE = "com.qiblalabs"
EXPECTED_APP_NAME = "QiblaAstro ELITE"
EXPECTED_WEB_MANIFEST_NAME = "QiblaAstro ELITE — بوصلة القبلة الفلكية"
EXPECTED_VERSION_NAME = "3.1.1"
EXPECTED_VERSION_CODE = "4"
EXPECTED_GA4 = "G-1D1GKVZB74"
EXPECTED_DOMAIN = "app.qiblalabs.com"
EXPECTED_SW_VERSION = "qiblaastro-v6.20-azkar-native-confirmed"

errors: list[str] = []
notes: list[str] = []

def fail(message: str) -> None: errors.append(message)
def require_file(rel: str) -> pathlib.Path:
    path = ROOT / rel
    if not path.is_file(): fail(f"missing required file: {rel}")
    return path
def read_text(rel: str) -> str:
    path = require_file(rel)
    if not path.is_file(): return ""
    return path.read_text(encoding="utf-8", errors="replace")

identity = read_text("PRE_APK_ANDROID_IDENTITY.md")
for value, label in [(EXPECTED_PACKAGE,"Package ID"),(EXPECTED_APP_NAME,"app name"),(EXPECTED_VERSION_NAME,"version name"),(EXPECTED_VERSION_CODE,"version code"),(EXPECTED_GA4,"GA4 measurement ID")]:
    if value not in identity: fail(f"identity freeze does not contain expected {label}: {value}")

twa_path=require_file("android-twa/twa-manifest.json")
if twa_path.is_file():
    try:
        twa=json.loads(twa_path.read_text(encoding="utf-8"))
        if twa.get("packageId") != EXPECTED_PACKAGE: fail("TWA Package ID mismatch")
        if twa.get("appVersion") != EXPECTED_VERSION_NAME: fail("TWA version name mismatch")
        if str(twa.get("appVersionCode")) != EXPECTED_VERSION_CODE: fail("TWA version code mismatch")
    except Exception as exc: fail(f"android-twa/twa-manifest.json is invalid JSON: {exc}")

cname = read_text("CNAME").strip()
if cname != EXPECTED_DOMAIN: fail(f"CNAME must be exactly {EXPECTED_DOMAIN!r}; found {cname!r}")
manifest_path=require_file("manifest.json"); site_manifest_path=require_file("site.webmanifest")
manifest={}; site_manifest={}
if manifest_path.is_file():
    try: manifest=json.loads(manifest_path.read_text(encoding="utf-8"))
    except Exception as exc: fail(f"manifest.json is invalid JSON: {exc}")
if site_manifest_path.is_file():
    try: site_manifest=json.loads(site_manifest_path.read_text(encoding="utf-8"))
    except Exception as exc: fail(f"site.webmanifest is invalid JSON: {exc}")
if manifest and site_manifest and manifest != site_manifest: fail("manifest.json and site.webmanifest are not identical")
if manifest:
    expected_fields={"name":EXPECTED_WEB_MANIFEST_NAME,"short_name":"QiblaAstro","start_url":"./index.html","scope":"./","display":"standalone","orientation":"portrait"}
    for key,expected in expected_fields.items():
        if manifest.get(key)!=expected: fail(f"manifest {key!r} must be {expected!r}; found {manifest.get(key)!r}")
    icons=manifest.get("icons") or []; icon_map={(i.get("sizes"),i.get("purpose","any")):i.get("src") for i in icons if isinstance(i,dict)}
    for key in [("192x192","any"),("512x512","any"),("192x192","maskable"),("512x512","maskable")]:
        src=icon_map.get(key)
        if not src: fail(f"manifest missing icon {key[0]} purpose={key[1]}")
        elif not (ROOT/src).is_file(): fail(f"manifest icon path does not exist: {src}")
index_html=read_text("index.html"); home_final=read_text("js/home-final.js"); tracker=read_text("js/analytics/privacy-safe-screen-tracker.js"); navigation=read_text("js/06-navigation.js"); service_worker=read_text("service-worker.js")
if f"gtag/js?id={EXPECTED_GA4}" not in index_html: fail("index.html does not load the approved GA4 measurement ID")
if f"GA_ID='{EXPECTED_GA4}'" not in home_final and f'GA_ID="{EXPECTED_GA4}"' not in home_final: fail("home-final.js does not initialize the approved GA4 measurement ID")
for forbidden in ["latitude","longitude","coords.latitude","coords.longitude","camera frame"]:
    marker="Google Analytics 4"; ga_block=home_final[home_final.find(marker):] if marker in home_final else ""
    if forbidden.lower() in ga_block.lower(): fail(f"GA telemetry block contains sensitive-location/camera token: {forbidden}")
for required in ["page_view","screen_engagement","engagement_time_msec","app_screen","app_surface"]:
    if required not in tracker: fail(f"screen analytics tracker missing required field/event: {required}")
for screen in ["home","digital_qibla","astronomical_verification","prayer","quran","azkar","serenity","falaki","gnss","settings"]:
    if screen not in tracker: fail(f"screen analytics tracker missing stable screen name: {screen}")
for forbidden in ["navigator.geolocation","getUserMedia","deviceHeading","coords.latitude","coords.longitude","user_id","prayer_time","surah","dhikr_text"]:
    if forbidden.lower() in tracker.lower(): fail(f"screen analytics tracker contains disallowed sensitive/personal token: {forbidden}")
if "page_location:syntheticPageLocation(screen)" not in tracker.replace(" ",""): fail("screen analytics must use a synthetic page_location without live query/hash values")
if "privacy-safe-screen-tracker.js" not in navigation: fail("navigation shell does not load the isolated screen analytics tracker")
if "./js/analytics/privacy-safe-screen-tracker.js" not in service_worker: fail("service worker does not precache the screen analytics tracker")
if "./js/i18n/prayer-phrases.js" not in service_worker: fail("service worker does not precache the production prayer translation pack")
if "./js/presentation/quran/back-history.js" not in service_worker: fail("service worker does not precache the modern Quran nested Back bridge")
if "./js/presentation/azkar/back-history.js" not in service_worker: fail("service worker does not precache the modern Azkar nested Back bridge")
if "./js/presentation/prayer/native-plan.js" not in service_worker: fail("service worker does not precache the native prayer date-plan bridge")
if "./js/azkar-native-reminders.js" not in service_worker: fail("service worker does not precache the confirmed native Azkar bridge")
if "azkar-native-confirmed-20260818-v1" not in service_worker: fail("service worker does not expose the confirmed native Azkar release marker")
if EXPECTED_SW_VERSION not in service_worker: fail(f"service worker version must be {EXPECTED_SW_VERSION}")
notes.append("GA4 screen analytics is non-essential and limited to stable screen names, surface type, views and active-screen duration")
notes.append("Application functionality must remain independent of analytics/cookie consent")
notes.append("This web/TWA tracker adds no Firebase SDK, AD_ID permission or new Android runtime permission dialog")
scan_ext={".html",".js",".json",".xml",".gradle",".kts"}; ad_markers=["com.google.android.gms.ads","google_mobile_ads_app_id","ca-app-pub-","android.permission.ad_id","android.permission.AD_ID"]
for path in ROOT.rglob("*"):
    if not path.is_file() or path.suffix.lower() not in scan_ext: continue
    if any(part in {"node_modules",".git","build",".gradle"} for part in path.parts): continue
    try: text=path.read_text(encoding="utf-8",errors="ignore")
    except OSError: continue
    low=text.lower()
    for marker in ad_markers:
        if marker.lower() in low: fail(f"first-release ad-free gate: found {marker!r} in {path.relative_to(ROOT)}")
assetlinks=ROOT/".well-known"/"assetlinks.json"
if assetlinks.exists():
    text=assetlinks.read_text(encoding="utf-8",errors="replace")
    if any(token in text for token in ["PLACEHOLDER","YOUR_SHA","SHA256_HERE","TODO"]): fail("production .well-known/assetlinks.json contains a placeholder fingerprint")
    if EXPECTED_PACKAGE not in text: fail("assetlinks.json does not contain the approved Package ID")
    notes.append("assetlinks.json exists: certificate fingerprints still require external HTTPS verification")
else: notes.append("assetlinks.json absent")
print("QiblaAstro ELITE — Pre-APK Gate"); print("="*36)
for note in notes: print(f"NOTE: {note}")
if errors:
    for error in errors: print(f"ERROR: {error}",file=sys.stderr)
    print(f"FAILED: {len(errors)} issue(s)",file=sys.stderr); raise SystemExit(1)
print("PASS: repository-side pre-APK checks succeeded")
