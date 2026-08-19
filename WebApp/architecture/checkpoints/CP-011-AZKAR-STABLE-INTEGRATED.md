# CP-011 — Approved Azkar Stable Integrated

Source of truth transferred: `azkar-stable` @ `37c9dc9ea4a851c1561e2ea6bfce4b88f470b4eb` (`fix: force fresh Azkar assets after audio and UI update`).

Integrated into `new` as an independent external screen using the same iframe-host pattern used by Falaki.

Transferred byte-for-byte from the approved source:
- `pages/azkar.html`
- `css/azkar-new.css`
- `css/azkar-home-tuning.css`
- `css/azkar-reader-tuning.css`
- `css/azkar-listen.css`
- `css/azkar-final-tuning.css`
- `js/azkar-data.js`
- `js/azkar-verified-overlay.js`
- `js/azkar-dua-overlay.js`
- `js/azkar-alert-audio-map.js`
- `js/azkar-new.js`
- `js/azkar-final-ui.js`
- complete `assets/audio/azkar-alerts/` directory (10 MP3 files)

Application-only integration:
- `index.html`: legacy Azkar body removed; `page-azkar` is now a route host only.
- `js/presentation/azkar/host.js`: loads `pages/azkar.html?v=20260809-0132` in an iframe and allows audio playback.
- `js/qibla-card-runtime.js`: loads the Azkar host without changing Azkar behavior.
- `service-worker.js`: cache version `qiblaastro-v5.57-azkar-stable`; approved Azkar files and all 10 MP3 alert files included.

Automated acceptance passed:
- exact source hashes for all 12 approved page/CSS/JS files;
- 10 local MP3 files present;
- all 10 audio-map targets exist and are cached;
- external route host present and legacy inline Azkar presentation removed;
- Protected Scientific Core Integrity PASS;
- astronomical module boundary PASS;
- presentation scientific write barrier PASS;
- astronomical solver regression PASS.

Manual UI/audio/device testing is intentionally deferred to the final whole-app acceptance batch, per user decision.
