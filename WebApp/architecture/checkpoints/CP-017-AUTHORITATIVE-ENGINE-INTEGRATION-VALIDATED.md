# CP-017 — Authoritative Astronomical Engine Integration Validated

Date: 2026-08-09
Branch: `one`
Authoritative source branch: `feature/astronomical-solver-foundation`
Authoritative source commit: `ac2bb57aa4a829d1730a64b657432320c6295da7`
Authoritative handoff: PR #3

## Status

The astronomical verification scientific engine on `one` is restored to the authoritative handoff implementation and kept separate from the modern presentation layer.

## Engine invariant

The following production scientific/runtime files match the authoritative source and are not modified by the modern screen migration:

- `js/astro-verification.js`
- `js/astronomical-trace.js`
- `js/position-provider.js`
- `js/coordinate-frames.js`
- `js/world-orientation.js`
- `js/camera-projection.js`
- `js/camera-pose.js`
- `js/gravity-reference.js`
- `js/astro-qibla-engine.js`
- `js/verification-quality.js`
- `js/celestial-detector.js`
- `js/astronomical-solver.js`
- `js/qibla-alignment-reticle.js`
- `js/astronomical-observation-bridge.js`
- `js/astronomical-observatory-ui.js`
- `js/astronomical-verification-store.js`
- `js/astronomical-verification-session.js`
- `js/compass-cards.js`
- `js/post-verification-live-compass.js`
- `js/qibla-card-runtime.js`

The protected-core SHA gate is aligned with the authoritative source blobs.

## Presentation boundary

Modern screens are mounted through `js/presentation/bootstrap.js` and presentation hosts. The presentation bootstrap does not own or implement astronomical calculations, Solver logic, Store state, GNSS truth, camera pose, gravity, detector, or Qibla calculations.

`index.html` loads the authoritative astronomical gateway as the production entry point, followed by canonical cards/runtime. The gateway loads the scientific stack sequentially in the authoritative order.

## Legacy exclusion

Retired runtime modules remain excluded from the production load path and App Shell, including:

- `js/camera-engine.js`
- `js/celestial-solver.js`
- `js/tracking-lock.js`

## Offline integration

`service-worker.js` uses cache generation `qiblaastro-v5.59-one-engine-restore` and pre-caches:

- the authoritative astronomical production stack,
- the canonical card/runtime modules,
- the modern presentation bootstrap and screen hosts.

## Validation gates

At commit `b3d95e9c66b6aa5ba9f724d2a99cf7695e3ca248` before this documentation-only checkpoint:

- Protected Scientific Core Integrity: SUCCESS
- Prayer UI Contract: SUCCESS
- Astronomical Solver integration: 16 passed / 0 failed
- Canonical Session / Store / capture isolation: PASS
- Astronomical Observation Bridge: 6 passed / 0 failed
- Astronomical semantic mapping: PASS
- Record → Store → CompassCards → authoritative Runtime: PASS
- Canonical CompassCards contract: PASS
- Authoritative Qibla card runtime contract: PASS
- Module boundary and scientific write barrier: PASS through the protected workflow

## Rule after this checkpoint

Do not modify the astronomical scientific engine to accommodate presentation changes. Any further UI work must consume the authoritative engine through presentation/read-only integration boundaries. Scientific behavior changes, if ever requested, must be treated as a separate explicit engineering decision after the restored baseline is field-tested.
