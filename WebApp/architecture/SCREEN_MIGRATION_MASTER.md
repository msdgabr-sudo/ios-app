# QiblaAstro — Four-Screen Migration Master Ledger

Branch: `new`  
Golden scientific reference: `feature/astronomical-solver-foundation`  
Owner: محمد سيد جبر بحيرى — Mohamed SG Behairy  
Status: ACTIVE — presentation migration phase

---

## 0. Mission

Import the four approved replacement screen designs into `new` without changing, duplicating, simplifying, relocating into presentation code, or silently bypassing any scientific/geodesic/astronomical/GNSS/camera calculation.

The four target screens are:

1. **فلكي — Astronomy / educational screen**
2. **البوصلة الرقمية — GNSS computational compass screen**
3. **التحقق الفلكي — Astronomical observation / verification screen**
4. **الرئيسية — Home integration screen**

The work is successful only when the new presentation consumes the validated outputs of the existing engines while the engines preserve their Golden Reference behavior.

---

## 1. Absolute architecture rule

### Engine owns truth
Scientific engines compute and own values.

### Presenter owns appearance
Presentation files may format, label, animate, arrange, or display values. They may not calculate scientific truth.

### Adapter owns translation
Where the new design needs a different UI shape, create a narrow read-only adapter/presenter that translates an existing engine result into a display model.

**Forbidden:** copying an equation from an engine into a screen file because it appears easier.

---

## 2. Migration order

### Stage A — فلكي
Risk: LOW / MEDIUM.

Purpose: establish the new import pattern using the least dangerous screen.

Expected behavior:
- Educational/informational content is presentation-only.
- Live Sun/Moon values may be read from existing astronomy outputs.
- Polaris, when shown, is informational only and must not enter verification, capture, quality gates, or solver inputs.
- No camera start, capture, record, verification decision, or Qibla overwrite originates from this page.

Acceptance:
- New design mounts externally.
- Information loads correctly.
- Live celestial labels are read-only.
- No protected-core blob changes.

### Stage B — البوصلة الرقمية (GNSS computational compass)
Risk: MEDIUM / HIGH.

Purpose: display the final computational/GNSS system without reimplementing it.

The screen may display existing outputs such as:
- computational Qibla true azimuth;
- current device direction where the established system exposes it;
- deviation/difference display;
- GNSS/location quality/source;
- distance or other already-computed presentation values.

Critical rule:
- This page does **not** become a second Qibla calculator.
- It reads the canonical computational result.
- It may never overwrite the astronomical verification record.

Acceptance:
- Same input location => same computational Qibla as Golden Reference/current canonical engine.
- No duplicated geodesic equation in presentation.
- No astronomical verification state mutation.

### Stage C — التحقق الفلكي
Risk: CRITICAL.

This is a presentation replacement around the protected observation system, not a scientific refactor.

Protected runtime order remains:

`permission → camera stream → frames → stable Sun/Moon detection → gravity synchronization → solve → alignment/quality gate → freeze → record → stop`

Protected concepts include, but are not limited to:
- camera permission and lifecycle;
- Sun/Moon target selection;
- target azimuth/altitude;
- centroid/frame measurements;
- camera FOV = 65° unless changed in a separate scientific phase;
- gravity/reference synchronization;
- true-camera-heading solve;
- ±1° alignment/acceptance rules where defined by Golden Reference;
- quality gates;
- freshness/movement rules;
- observation record;
- success/failure state;
- resource cleanup.

The screen may:
- display instruction/state text;
- display observation progress;
- display immutable result fields;
- invoke the existing public start/cancel/accept actions through a controlled adapter.

The screen may **not**:
- reproduce solver math;
- choose a different target through presentation heuristics;
- skip a quality gate;
- write a result directly;
- manufacture a successful result;
- reuse stale verification as fresh;
- use QT/device heading/magnetometer as a hidden raw-solver input.

Acceptance requires a real-phone test after visual import.

### Stage D — الرئيسية
Risk: CRITICAL INTEGRATION.

Home is last because it aggregates the other systems.

Home contracts:

#### Computational Qibla card
Reads only the canonical computational/GNSS result.

#### Astronomical Qibla card
Reads only a valid astronomical observation/result record through its presenter/store contract.
It may display the algorithm/result details selected for the approved design, but display does not become calculation.

#### Astronomical observation / digital-compass entry button
The approved button that starts observation must call the established astronomical verification entry point.
It must not open a decorative camera path or a parallel solver.

After a valid observation, any live compass mode shown by the approved experience must use the established post-verification/live-compass pathway; it must not fabricate a live state from the button itself.

#### Separation invariant
Computational Qibla and Astronomical Qibla remain two distinct data products.
Updating the astronomical result never overwrites the computational Qibla card.

---

## 3. Four-screen data contracts

| Screen | Allowed inputs | Allowed outputs/actions | Forbidden responsibility |
|---|---|---|---|
| فلكي | existing Sun/Moon/Polaris informational data | render educational/live information | verification, capture, solver, Qibla mutation |
| البوصلة الرقمية | canonical GNSS/computational Qibla + established heading/location display values | render computational compass | re-calculate Qibla; write astronomical result |
| التحقق الفلكي | verification/session/store public state + controlled commands | start/cancel/accept via adapter; render status/result | solver math; gate bypass; direct record fabrication |
| الرئيسية | read-only cards + official verification entry action | aggregate/navigation/display | duplicate engines; cross-overwrite computational/astronomical truth |

---

## 4. Files classification policy

Every touched file must be assigned exactly one class before modification:

- **PRESENTATION** — HTML/CSS/icons/layout/text/animation.
- **PRESENTER / ADAPTER** — read-only translation of existing state into UI fields, or controlled invocation of existing public actions.
- **APPLICATION WIRING** — loader/registry/navigation/module loading only.
- **PROTECTED SCIENTIFIC CORE** — solver, camera, capture, gravity, quality, observation, astronomical/geodesic/GNSS equations, verification session/store rules.

A design-import commit may touch only the first three classes.

If a requested screen design appears to require changing class 4, stop the screen migration and open a separate scientific-change phase.

---

## 5. No-conversation-loss protocol

The repository is the source of continuity, not chat history.

After each production batch update this file with a checkpoint containing:

- checkpoint number;
- target screen;
- exact branch;
- last accepted commit SHA;
- files added;
- files modified;
- protected files changed: MUST be `NONE` for design migration;
- tests performed;
- real-phone tests pending/passed;
- known defects;
- exact next action.

A new conversation must begin by reading this file and the last accepted commit before editing anything.

Never continue from memory alone.

---

## 6. Commit discipline

Use narrow commits by responsibility:

1. `docs(...)` / inventory checkpoint
2. `feat(presentation/...)` for external screen markup
3. `style(presentation/...)` for visual implementation
4. `feat(presenter/...)` for read-only binding
5. `test(...)` for contracts/write barriers
6. `chore(pwa)` for cache/version updates

Do not mix a protected scientific change into any of those commits.

---

## 7. Mandatory guards before every screen acceptance

1. Compare `new` against the last accepted checkpoint and inspect every changed filename.
2. Compare protected-core blobs/hashes against the baseline where applicable.
3. Search the imported presentation files for forbidden scientific symbols/functions.
4. Confirm no duplicated scientific formula appears in the screen/presenter.
5. Confirm every interactive button maps to a real public action or is explicitly presentation-only.
6. Confirm failure/cancel/back paths clean up their resources where the protected system requires it.
7. Confirm cached assets are versioned so the phone cannot silently show an older screen.
8. Create an immutable RawGitHack commit link for phone acceptance when the stage requires runtime testing.

---

## 8. Stop conditions

Immediately stop the current batch if any of these occurs:

- a protected-core file must be changed merely to make the design fit;
- Qibla output differs for identical input;
- Sun/Moon output differs for identical time/location;
- camera start/stop/cancel lifecycle changes unexpectedly;
- verification succeeds without the established gates;
- stale observation is presented as a new observation;
- computational Qibla is overwritten by astronomical result or vice versa;
- a button has no traceable action contract;
- presentation contains copied solver/geodesic/astronomy math;
- the migration state cannot be reconstructed from this ledger and Git commits.

---

## 9. Initial checkpoint — CP-000

Date: 2026-08-08  
Branch: `new`  
Golden reference: `feature/astronomical-solver-foundation`  
State: preparation complete; no new four-screen design imported yet.

Existing protected constitution verified at:
`architecture/PROTECTED_CORE_CONSTITUTION.md`

Current migration order locked:

`فلكي → البوصلة الرقمية GNSS → التحقق الفلكي → الرئيسية`

Reason:
- begin with the least dangerous display-only contract;
- prove the external-screen/presenter pattern;
- then bind computational data;
- then perform the critical camera/verification presentation migration;
- integrate Home only after all downstream contracts are stable.

Protected scientific files changed in CP-000: **NONE**.

Next action:
**Import and inventory the approved design files for شاشة فلكي without altering scientific code.**

---

## 10. Ownership / IP

© 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
