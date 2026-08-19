# QiblaAstro — Protected Scientific Core Constitution

Branch: `new`
Golden reference: `feature/astronomical-solver-foundation`
Owner: محمد سيد جبر بحيرى — Mohamed SG Behairy

## Purpose

`new` is a conservative architectural rebuild. Its first obligation is behavioral and numerical equivalence with the validated astronomical-verification system in `feature/astronomical-solver-foundation`.

## Non-negotiable rules

1. No astronomical/geodesic equation may be rewritten, simplified, optimized, reordered, or replaced during the structural migration.
2. No scientific constant, threshold, tolerance, FOV, Kaaba coordinate, quality gate, timing gate, freshness rule, or GNSS constraint may be changed as part of a move/refactor.
3. Move and improvement are separate operations. A migration commit may move/rename/wrap code, but it may not change its mathematical behavior.
4. `feature/astronomical-solver-foundation` is the Golden Reference. If `new` produces a different scientific output for identical inputs, the migration step fails.
5. Presentation code must never calculate or overwrite astronomical truth. UI may consume immutable results through an adapter/presenter only.
6. The raw solver must remain independent of compass heading, magnetometer, QT state, and magnetic declination.
7. Camera capture order remains: permission -> stream -> frames -> stable detection -> gravity synchronization -> solve -> alignment/quality gate -> freeze -> record -> stop.
8. A successful/rejected result may not be silently substituted by stale persisted data.
9. Computational Qibla and astronomical observation remain distinct data products. Updating one may not overwrite the other.
10. Any change that touches a protected core file requires an explicit scientific-change phase and new regression evidence. It is forbidden during presentation import or file-size cleanup.

## Protected migration constants

- Horizontal camera FOV: 65 degrees unless the Golden Reference itself is intentionally changed in a separate scientific phase.
- Qibla-axis alignment tolerance: ±1 degree.
- Sun/Moon selection and quality profiles: preserve Golden Reference values.
- Astronomical record freshness and movement limits: preserve Golden Reference values.

## Stop conditions

Stop the current migration step immediately if any of the following occurs:

- Qibla bearing changes for the same location.
- Sun/Moon azimuth or altitude changes for the same time/location.
- solved true-camera heading changes beyond normal numerical identity.
- verification offset changes unexpectedly.
- camera capture succeeds/fails differently from Golden Reference without an explained environment cause.
- a UI commit changes a protected-core blob.
- magnetometer/device-heading/QT becomes an input to the raw astronomical solver.

## Migration acceptance rule

A refactor is accepted only when:

`Golden Reference input -> Golden Reference output`

is equivalent to:

`new input -> new output`

and camera/resource lifecycle behavior remains equivalent.

This constitution intentionally favors correctness and traceability over speed of refactoring.
