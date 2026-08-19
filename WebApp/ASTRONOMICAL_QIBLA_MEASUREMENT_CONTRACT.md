# QiblaAstro — Astronomical Qibla Measurement Contract

Branch: `feature/i18n-rollout`

© 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.

## IMPORTANT — REVIEWER / MAINTAINER NOTE

This document is a **documentation note only**. It must not be interpreted as an instruction to refactor, repair, replace, simplify, or otherwise modify any scientific engine, verification engine, astronomical solver, camera-pose logic, celestial calculation, or raw Qibla equation.

The current scientific implementation and its protected engines are authoritative and must remain untouched unless an explicit, separately approved engineering task requires a scientific-core change.

In particular:

- **Do not modify the raw Qibla equation or its engine.**
- **Do not modify the astronomical verification engines or solver pipeline.**
- **Do not substitute GNSS `QT`, compass/magnetometer heading, UI/card text, or any presentation-layer value into the astronomical result.**
- **Do not change scientific behavior merely to make older documentation appear consistent.**
- A reviewer who finds historical wording that differs from the current protected implementation must treat that wording as stale documentation, not as permission to change the scientific core.

## Current authoritative result flow

The astronomical verification path is independent from the normal GNSS `QT` display path.

The protected astronomical solver produces its own result object. Within that result, `result.qibla.qiblaBearingDeg` is produced by the independent astronomical Qibla engine from the solver's location input and the Kaaba coordinates. That engine does not read or reuse the normal GNSS `QT`, compass/magnetometer heading, device-heading display, or Qibla card text.

The Sun/Moon observation, celestial geometry, camera projection, gravity and camera-pose solution produce `trueCameraHeadingDeg`. The solver compares that observed camera orientation with its independent raw Qibla-bearing result to determine relative direction/deviation and verification quality.

Only after the astronomical verification flow is successfully accepted is the canonical verified record stored. The **Astronomical Qibla** UI reads the accepted canonical astronomical record; it must not copy its value from the normal computational/GNSS Qibla card.

Therefore, the verified astronomical result is based only on the protected solver output and the accepted astronomical-verification process. Presentation code may read and display the result, but must never recompute, overwrite, substitute, or mutate the scientific result.

## Protected semantic fields

- `result.qibla.qiblaBearingDeg`
  - Independent raw Qibla bearing produced inside the protected astronomical solver path.
  - Must not be sourced from the normal GNSS `QT` state or UI.

- `trueCameraHeadingDeg`
  - Camera true heading solved from the accepted celestial observation / camera-pose path.
  - Kept separate from the Qibla bearing.

- `observedQiblaBearingDeg`
  - Canonical stored/displayed astronomical Qibla bearing after successful verification under the current runtime contract.
  - In the current implementation this maps to the solver's independent `result.qibla.qiblaBearingDeg`; it is not a copy of the normal GNSS `QT` card value.

- `referenceQiblaBearingDeg`
  - Reference bearing retained by the verification record for comparison and traceability.

- `verificationOffsetDeg`
  - Verification difference retained separately from the Qibla bearing itself.

- `celestialBodyAzimuthDeg` / `celestialBodyAltitudeDeg`
  - True celestial coordinates used by the observation pipeline at capture time.

## Scientific-core invariants

The following separation is mandatory:

1. The normal computational/GNSS Qibla path remains independent.
2. The astronomical solver and its raw Qibla equation remain independent and protected.
3. The Sun/Moon verification path validates the astronomical result using the observation/camera/gravity pipeline.
4. The accepted result is stored in the astronomical verification record.
5. The Astronomical Qibla UI is read-only with respect to scientific state: it displays the canonical accepted record and does not create or alter the result.

## Forbidden substitutions and modifications

The normal GNSS `QT`, GNSS card text, magnetic heading, device compass heading, sensor bias, presentation-layer values, or legacy fallback records must never be used as a replacement for the protected astronomical solver result.

No reviewer, cleanup task, UI refactor, translation task, or documentation-alignment task is authorized by this document to modify:

- the raw Qibla equation;
- `astro-qibla-engine.js` scientific behavior;
- `astronomical-solver.js` scientific behavior;
- camera projection / camera pose calculations;
- celestial observation calculations;
- gravity/quality gates;
- astronomical verification/session/store semantics;
- scientific acceptance tolerances or scientific-core contracts.

Any future change to those components requires an explicit scientific-core task, separate review, and regression testing. This documentation update itself changes **no equation, no engine, no verification logic, and no runtime behavior**.
