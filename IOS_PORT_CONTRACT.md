# QiblaAstro iOS Port Contract

## Authoritative baseline
- Source repository: `msdgabr-sudo/q-app-an`
- Source branch: `main`
- Frozen baseline SHA: `cc2d1c2389a3de4d2cb4dbb6329da868dd1e6247`
- Materialized source: `WebApp/`
- Android-only Bubblewrap/TWA workspace is intentionally excluded.

## Protected systems — do not rewrite during iOS porting
- computational Qibla / QT mathematics;
- WMM2025 magnetic-declination mathematics;
- digital-compass mathematics;
- astronomical verification, camera solving, celestial geometry and accepted-record semantics;
- prayer-time calculation equations;
- trusted GNSS security policy;
- Quran/Azkar canonical content unless separately scoped.

## Mandatory separation
The iOS native layer is an adapter for Apple platform services only. It may provide trusted location, motion/heading, camera, notifications, audio/background integration and widgets, but it must not create a second scientific implementation or substitute presentation/native values for protected engine results.

Computational Qibla and astronomical verification remain independent. The astronomical result must never overwrite or be replaced by the computational Qibla result.

## Source update rule
Future synchronization from q-app-an must use an explicitly approved source SHA and a reviewed diff. Never replace `WebApp/` from an older historical Mizan baseline or from an unreviewed branch.
