# QiblaAstro Project Context

## 1. Project Vision
QiblaAstro is an educational astronomical Qibla platform designed to provide a trusted, scientifically grounded experience for determining and understanding the Qibla. It combines an independent GNSS/computational Qibla system with an independent astronomical verification system based on direct observation of the Sun or Moon.

Guiding principles: scientific accuracy, user trust, privacy, educational value, authentic Islamic reference where Islamic guidance is presented, high performance, and a distinctive premium interface. The first three seconds must communicate that QiblaAstro is not a generic compass. The Kaaba is the visual center; Earth, sky, light, celestial bodies, and restrained holographic instruments explain the concept.

## 2. Current Architecture
The project contains two strictly separated engines and one additive presentation layer.

### A. GNSS / Computational Qibla System
- Receives latitude and longitude through browser geolocation with network/manual fallbacks.
- Calculates geographic Qibla bearing from the user to the Kaaba.
- Updates GNSS and computational-Qibla UI values.
- Main runtime: `js/05-gnss.js`.
- Normalized provider: `js/position-provider.js`.
- Future maintenance task: unify both location paths without changing the astronomical system.

### B. Astronomical Verification System
- Uses camera observation of the Sun or Moon.
- Detects and tracks the celestial body.
- Runs the raw astronomical solver.
- Separates celestial/camera heading from solved Qibla bearing.
- Stores solved astronomical Qibla in the canonical verification store.
- Updates the astronomical Qibla card and closes the camera after successful capture.
- Provides an isolated post-verification live Sun/Moon compass.
- Live astronomical deviation is UI-only and never overwrites the raw record.

### C. Horizon Presentation Layer
- Additive presentation only; it must never calculate, overwrite, store, or mutate GNSS or astronomical results.
- Existing live DOM values, IDs, click handlers, stores, active classes, and navigation contracts remain authoritative.
- Existing home cards may be moved into presentation containers but are never cloned or replaced.
- `js/99-misc.js` mounts the Horizon Hero, semantic dashboard grid, and approved-reference home composition using live DOM values only.
- `css/41-horizon-mega-phase4-final-polish.css` remains the authoritative home-screen correction layer.
- `css/42-horizon-mega-phase5-cross-page-finish.css` is the authoritative cross-page visual identity layer.

## 3. Repository Structure
Important paths:

- `index.html` — main application shell and all page markup.
- `PROJECT_CONTEXT.md` — official Single Source of Truth.
- `css/01-variables.css` through `css/28-astronomical-observatory.css` — established application styles.
- `css/29-horizon-design-system.css` — Horizon tokens, optical glass, Hero foundation, Earth, Kaaba, typography, and status semantics.
- `css/30-horizon-compass-instruments.css` — compass canvas and measurement-card presentation.
- `css/31-horizon-home-header.css` — identity, language, dates, and next-prayer styling.
- `css/32-horizon-navigation.css` — floating navigation and safe-area behavior.
- `css/33-horizon-mega-interface.css` — prayer, GNSS, Quran, Azkar, settings, astronomy, calibration, serenity, help, and about styling.
- `css/34-horizon-square-dashboard.css` — first square-card conversion.
- `css/35-horizon-dashboard-grid.css` — semantic CSS Grid dashboard.
- `css/36-horizon-dashboard-polish.css` — card lighting and odd-tile treatment.
- `css/36-horizon-reference-parity.css` — first approved-reference composition.
- `css/37-horizon-reference-home.css` — additional Kaaba/Earth/reference-home rules and compact card rules.
- `css/38-approved-reference-layout.css` — exact styling companion for generated reference markup.
- `css/37-horizon-hero-mega-phase1.css` — Mega Phase 1 Hero reconstruction.
- `css/39-horizon-mega-phase2-dashboard-nav.css` — Mega Phase 2 services matrix, telemetry, and navigation.
- `css/40-horizon-mega-phase3-identity-motion.css` — Mega Phase 3 identity and restrained motion.
- `css/41-horizon-mega-phase4-final-polish.css` — Mega Phase 4 final responsive, geometry, density, Earth/Kaaba, dashboard, status, and dock correction.
- `css/42-horizon-mega-phase5-cross-page-finish.css` — Mega Phase 5 shared visual system for compass, prayer, GNSS, Quran, Azkar, astronomy, calibration, serenity, settings, help, and about pages.
- `css/27-animations.css` — final Horizon import chain.
- `js/05-gnss.js` — GNSS runtime.
- `js/10-astronomy.js` — astronomical calculations and legacy geographic Qibla calculation.
- `js/20-device-compass.js` — device compass runtime.
- `js/99-misc.js` — initialization, Hero, dashboard mounting, approved-reference composition, and live-value mirroring.
- `js/astronomical-verification-session.js` — verification state flow.
- `js/astronomical-verification-store.js` — canonical astronomical record.
- `js/post-verification-live-compass.js` — isolated live celestial compass after verification.
- `service-worker.js` — PWA caching/runtime, currently `qiblaastro-v5.33-mega-phase5-cross-page-finish`.
- `tests/` — astronomical and isolation tests.

## 4. Completed Features
### Core and product features
- Stable Arabic RTL PWA shell with offline support.
- GNSS/computational Qibla calculation and UI.
- Prayer times, Quran, Azkar, settings, navigation, serenity/audio, astronomy, calibration, help, and about modules.
- Camera-based Sun/Moon astronomical verification.
- Celestial detection and tracking.
- Automatic capture after stable observation.
- Correct separation between celestial/camera heading and solved astronomical Qibla.
- Canonical astronomical record storage and direct DOM update.
- Camera finalization and close after successful capture.
- Isolated post-verification live Sun/Moon compass.
- Live astronomical deviation separated from raw stored verification values.

### Horizon design history
- Phase 1: Kaaba/Earth Hero foundation and mirrored Qibla/GNSS values.
- Phase 2: premium home instrument cards.
- Phase 3: compass instrument framing and semantic measurement-card styling.
- Phase 4: home identity, language, dates, and next-prayer header.
- Phase 5: floating navigation, active states, and safe-area behavior.
- Phase 6: premium cross-page Mega Interface.
- Phase 7: square home cards.
- Phase 8: robust semantic dashboard grid without cloning cards.
- Phase 9: dashboard lighting, per-card accents, and deliberate final odd tile.
- Phase 10: approved-reference home composition.
- Phase 11: exact CSS support for the real generated reference markup.
- Phase 12 / Mega Phase 1: deeper cosmic Hero, astronomical arc, larger bearing, Sun/Moon instruments, Earth horizon, Kaaba, date/prayer panel, and system strip.
- Phase 13 / Mega Phase 2: dense services matrix, compact icon stages, telemetry strip, floating command dock, and navigation refinement.
- Phase 14 / Mega Phase 3: unified identity, calmer sky, refined celestial instruments, stronger bearing hierarchy, guidance beam, Earth atmosphere, Kaaba depth, service-card family, status strip, dock, and restrained motion.
- Phase 15 / Mega Phase 4: completed the final home-screen correction layer with tighter viewport rhythm, directional arc labels and ticks, stronger central guidance geometry, larger atmospheric Earth, larger Kaaba anchor, compact date/prayer panel, consistent four-column services matrix, deliberate narrow-phone three-column fallback, compact telemetry strip, floating command dock, performance safeguards, reduced-motion support, and Service Worker v5.32 caching.
- Phase 16 / Mega Phase 5: extended the finalized Horizon identity across all secondary pages. Added shared cosmic page atmosphere, premium hero surfaces, compact section dividers, unified optical cards, stronger compass instrument framing, prayer-state hierarchy, Quran-only reading typography, Azkar single-card treatment, settings/GNSS control styling, astronomy/calibration/serenity media surfaces, responsive phone tuning, accessibility focus states, reduced-motion support, slow-update fallbacks, and Service Worker v5.33 caching. No engine, solver, store, or calculation code was changed.

### Ownership
Copyright attribution preserved:
- `محمد سيد جبر بحيرى`
- `Mohamed SG Behairy`

## 5. Pending Features
Priority order:
1. Real-phone screenshot validation of the home screen and all major secondary pages.
2. One measured pixel-correction pass based on real screenshots, especially Hero height, Earth crop, Kaaba position, Arabic label fit, dock clearance, compass cards, Quran list density, and Azkar counter scale.
3. Complete the dedicated QiblaAstro icon system and replace remaining generic symbols where necessary.
4. Consolidate historical Horizon CSS layers only after visual approval and regression testing.
5. Refactor GNSS independently: unify location paths, add accuracy/freshness/stability gates, separate device/network/manual/default sources, and correct stale-position and magnetic-declination behavior.
6. Repair or retire obsolete GitHub Actions workflows.
7. Complete real-device regression validation of astronomical capture, record, live compass, and deviation.

## 6. Current Working Task
Validate Mega Phase 5 visual consistency on branch `feature/astronomical-solver-foundation` only.

Current checks:
- compare the home screen against the approved reference image;
- inspect compass, prayer, GNSS, Quran, Azkar, astronomy, calibration, serenity, settings, help, and about pages on a real Android phone;
- verify long Arabic labels, cards, forms, canvases, lists, audio controls, and safe-area clearance;
- verify every original handler, live value, page route, store, and engine remains functional;
- preserve all calculation and verification contracts.

## 7. Last Changes
- Created `css/42-horizon-mega-phase5-cross-page-finish.css`.
- Imported it last through `css/27-animations.css`, making it authoritative for secondary-page presentation.
- Unified the visual identity across compass, prayer, GNSS, Quran, Azkar, astronomy, calibration, serenity, settings, help, and about pages.
- Added shared page backgrounds, premium page heroes, optical panels, compact section headers, responsive layouts, interaction states, accessibility focus rings, reduced-motion support, and slow-update performance fallbacks.
- Kept Quran typography scoped to Quran reading elements.
- Updated `service-worker.js` to `qiblaastro-v5.33-mega-phase5-cross-page-finish` and pre-cached the new stylesheet.
- No GNSS, astronomical, solver, verification, store, compass calculation, or raw equation file was changed.

## 8. Important Decisions
1. Work only on `feature/astronomical-solver-foundation`.
2. GNSS/computational Qibla and astronomical verification remain independent.
3. Raw astronomical results are protected from UI writes.
4. Celestial heading is not Qibla bearing.
5. Live deviation is UI-only.
6. Design changes preserve runtime contracts.
7. Existing dynamic DOM remains authoritative.
8. Dashboard code may move existing cards but never clone or replace them.
9. Navigation state remains owned by the existing runtime.
10. Large visible design batches are preferred.
11. The approved reference image is the visual target, not merely an inspiration.
12. The Kaaba and Earth are the primary visual story; cards are compact supporting instruments.
13. Mega phases are presentation-only unless the owner explicitly starts a separate engine task.
14. Navigation routes remain accessible until a product decision authorizes route reduction.
15. Motion must remain restrained, performance-safe, and fully disabled when reduced motion is requested.
16. Mega Phase 4 is implementation-complete but not visually accepted until a real-device screenshot is compared.
17. Mega Phase 5 establishes one shared visual language across the product without modifying application logic.

## 9. Constraints
- Do not work on `astro1`, `main`, or any other branch.
- Do not modify the raw astronomical equation through UI code.
- Do not allow GNSS and astronomical values to overwrite each other.
- Do not reintroduce retired camera, celestial-solver, or tracking-lock logic.
- Do not secretly use magnetic compass data inside astronomical verification.
- Preserve working IDs, handlers, stores, and active-state contracts.
- Preserve copyright attribution.
- Maintain PWA and Android compatibility and acceptable mid-range-device performance.
- Respect `prefers-reduced-motion` and safe areas.
- Keep Quran typography scoped to Quran content.
- Update this file after every task or architectural change.

## 10. Known Issues
- Mega Phases 4 and 5 require real-device screenshot validation.
- Older high-specificity and inline styles may still cause local cascade conflicts.
- Multiple historical reference styles remain in the import chain; consolidation should occur only after visual approval.
- Long Arabic labels may need device-specific final tuning.
- Generated CSS Earth/Kaaba assets remain approximations until dedicated production assets are generated and approved.
- Some secondary-page class names may differ from the broad Phase 5 selector set and require screenshot-led targeted corrections.
- The navigation dock contains all existing routes and may need later product prioritization.
- GNSS remains split between `js/05-gnss.js` and `js/position-provider.js`.
- Obsolete workflows may still fail.

## 11. Next Step
Open the latest commit through RawGitHack on the real phone. Capture the full home screen plus compass, Quran, Azkar, prayer, and GNSS screenshots. Compare against the approved identity and apply one consolidated measured correction pass before visual acceptance.

## 12. Session Handoff
The GNSS and astronomical engines remain unchanged and protected. Mega Phases 1–5 are implemented on `feature/astronomical-solver-foundation` as presentation-only layers.

The current authoritative home layer is `css/41-horizon-mega-phase4-final-polish.css`. The current authoritative cross-page layer is `css/42-horizon-mega-phase5-cross-page-finish.css`. Both are imported through `css/27-animations.css` and cached by Service Worker v5.33. Continue with real-device screenshot validation and measured presentation corrections only; do not touch calculation engines.
