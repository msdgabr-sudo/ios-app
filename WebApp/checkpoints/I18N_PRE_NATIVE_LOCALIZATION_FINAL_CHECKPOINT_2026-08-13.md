# Mizan — Pre-Native Localization Final Checkpoint

Date: 2026-08-13
Branch at freeze: `feature/i18n-rollout`
Baseline head before this checkpoint document: `fa652db664994b5fb38fadf86df6468540aecd9a`

## Purpose

Freeze the current multilingual/PWA/Android-integration state before any localization work is performed on Android-native notifications or the home-screen widget.

## Frozen scope

- Current web i18n runtime and language packs.
- Current RTL/LTR behavior and internal-screen language bridge.
- Current PWA/Service Worker integration and i18n CI gates.
- Current Android/TWA integration, permissions, Azkar reminder plumbing, and widget plumbing.
- Current scientific/calculation/astronomical verification engines exactly as they exist at this checkpoint.

## Explicitly NOT started after this freeze

- Native Android localization of notification titles, channel names/descriptions, and other notification chrome.
- Native Android localization of widget fallback labels and widget chrome.
- Any redesign or refactor of scientific/calculation engines.

## Known localization gap intentionally preserved for the next isolated phase

The Android-native widget and Azkar notification receiver still contain Arabic literals. They are not considered fully multilingual yet. The next phase must localize them through Android resource directories (`values`, `values-en`, `values-fr`, `values-id`, `values-ur`) rather than modifying the stabilized web i18n runtime.

## Safety rule for next phase

Native localization must remain presentation-only. It must not write or alter Qibla, GNSS, prayer calculation, astronomical solver, camera, sensor, verification, observation, or protected-core logic.

## Restore point

A dedicated immutable-style backup branch is created from the checkpoint commit immediately after this document is committed. Use that branch as the rollback source if native localization introduces any regression.
