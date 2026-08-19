# CP-010 — Azkar Stable Transfer Baseline

Source of truth: `azkar-stable` at commit `37c9dc9ea4a851c1561e2ea6bfce4b88f470b4eb`.

Transfer scope only:
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
- entire `assets/audio/azkar-alerts/` directory

Integration rule: keep the Azkar screen standalone. `index.html` must contain only the Azkar route host, not copied Azkar screen markup. The approved page is mounted using the same iframe-host pattern already used by the external Falaki page.

Protected territory: no scientific, GNSS, compass, astronomical verification, camera, solver, session or store files may change during this transfer.

Manual device acceptance is deferred to the final whole-app test batch by user decision.
