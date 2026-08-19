# WMM2025 MDECL Runtime Impact Map — A2

Date: 2026-08-14  
Baseline: `aea33d59a21cc8764f2175ddbd36fc7751cde9c6`

## Scope

Replace only the legacy Egypt-oriented magnetic-declination source with the
accepted WMM2025 engine. The Qibla formula (`QT`), digital compass design,
camera, astronomical verification screens, and astronomical verification
engine are outside this change.

## Production source path

`index.html` is the production runtime bundle. It contains embedded copies of
the GNSS and old MDECL modules; the external `js/05-gnss.js` and
`js/10-astronomy.js` files are source mirrors and are not loaded by the page.
Consequently, a runtime-only change to the external files would not affect the
installed application.

## MDECL producer before this change

| Producer | Behavior | Risk |
|---|---|---|
| `index.html` embedded `magDecl()` | Simplified pole approximation plus Egypt-only `+0.30` correction; evaluated immediately from legacy Giza initialization | Publishes a plausible magnetic correction before trusted GNSS and is not globally valid |
| `js/10-astronomy.js` `magDecl()` | Source mirror of the same approximation | Future modular builds could restore the obsolete source |

## Trusted input path

| Input | Allowed | Runtime action |
|---|---:|---|
| Device Geolocation (`gnssSource === 'gps'` and trusted-fix flag) | Yes | Use current latitude, longitude, altitude, and current date |
| IP geolocation | No | Never call or accept it |
| Giza initialization coordinates | No | Never evaluate or publish WMM from them |
| Missing/invalid coordinates | No | Keep MDECL unavailable |

## Direct MDECL and QM consumers

| Consumer group | Files / embedded sections | Dependency | Change policy |
|---|---|---|---|
| GNSS publication | `index.html` embedded GNSS, `js/05-gnss.js` | Recomputes `QM = QT - MDECL` and updates location values | Hook the trusted-fix event to the new source; keep the QT equation unchanged |
| Heading correction | `index.html` inertia/device-orientation sections; mirrors `js/01-inertia.js`, `js/20-device-compass.js`, `js/18-sky-bg.js` | Converts magnetic device heading to true heading using MDECL | Do not alter protected/source mirror files; make MDECL unavailable until the trusted gate succeeds |
| Compass canvas | `index.html` compass canvas; mirror `js/12-compass-canvas.js` | Draws declination arc and `QM` marker | No canvas redesign; values become available only after the producer gate succeeds |
| Prayer/method UI | `index.html`; mirror `js/11-prayer.js` | Displays MDECL/QM as method metadata | Do not change prayer equations |
| Share/settings/help | `index.html`; mirror `js/08-share.js` | Formats QM/MDECL text | No formula changes |
| Qibla calculation | `index.html` `calcQibla()` | Produces `QT` independently of MDECL | Explicitly protected from modification |

## New producer and gate

`js/geomag/wmm2025-runtime.js` will be the only adapter between trusted device
coordinates and `js/geomag/wmm2025.js`. It will:

1. reject an untrusted source or absent trusted-fix flag;
2. validate latitude, longitude, altitude, date, and all returned field values;
3. reject declination outside `[-180, 180]`;
4. classify `H < 2000 nT` as `blackout` and prohibit publication;
5. classify `2000 <= H < 6000 nT` as `caution` and permit publication only with
   the caution state preserved;
6. publish normal values only after all checks pass.

## Files allowed to change in this stage

- `js/geomag/wmm2025-runtime.js` (new adapter)
- `js/05-gnss.js` (trusted-fix hook/source mirror only)
- `js/10-astronomy.js` (remove old MDECL producer/source mirror only)
- `index.html` (load adapter and update its embedded producer/GNSS copy)
- `service-worker.js` (cache version/runtime files)
- tests and this checkpoint

## Protected boundary

The following classes are hash-locked before and after this stage:

- digital compass source mirrors (`js/01-inertia.js`, `js/12-compass-canvas.js`,
  `js/18-sky-bg.js`, `js/20-device-compass.js`);
- camera engine/projection/pose files;
- astronomical verification, solver, observation bridge, session/store,
  celestial detector, gravity reference, and astro-Qibla engine files.

No protected file may change. `index.html` must change because it is the actual
production bundle, but the QT formula and the embedded astronomical verification
logic remain outside the edit regions.
