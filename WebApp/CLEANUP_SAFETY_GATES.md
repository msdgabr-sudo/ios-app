# QiblaAstro — Cleanup Safety Gates

Branch: `home`
Safe reference branch: `klir`

## Primary rule
Application behavior and current screens take priority over reducing file size. No deletion is allowed merely because a block, selector, function, or file looks old.

## Protected areas — DO NOT MODIFY during cleanup
- Home screen and its presentation/runtime wiring.
- Digital compass screen and canonical compass anchors.
- Astronomical verification screen and controls.
- Camera / solver / celestial detection / verification engines.
- Qibla, astronomical, GNSS, sensor, observation, and verification calculation engines.
- GNSS inline screen and its runtime DOM.
- Serenity / راحة وسكينة while it is under independent development.
- Current presentation hosts for Prayer, Azkar, Quran, Falaki, and Compass.

## Gate 1 — Full-read gate
Before deleting any file or block:
1. Read the full target code, not only its filename or heading.
2. Identify every ID, class, function, event handler, global variable, canvas, storage key, and external asset it contains.
3. Check whether apparently screen-specific code contains shared application behavior.

Failure => NO DELETE.

## Gate 2 — Dependency gate
For every candidate DOM ID / selector / function:
- Find all reads and writes from JavaScript.
- Find all CSS selectors that style it.
- Find all navigation paths and presentation hosts that require it.
- Check bootstrap, service worker, page loader, registry, and shared runtime files where relevant.

Any unresolved reference => NO DELETE.

## Gate 3 — Null-safety gate
If existing runtime code accesses the candidate DOM without a null guard, the DOM cannot be removed until that runtime dependency is safely eliminated in a separately reviewed change.

Example discovered during audit:
`page-cal` contains `#err-table`, while the main update loop accesses `gel('err-table').children.length` without a null check. Therefore `page-cal` is NOT currently safe to remove.

## Gate 4 — Protected-zone gate
Before every write, verify that the diff does not touch protected files or protected DOM/runtime contracts.

Any protected-area change => STOP.

## Gate 5 — Single-change gate
One cleanup unit per commit. No bulk deletion. The commit should change the smallest practical surface area.

## Gate 6 — Diff gate
After every write:
- Re-read the changed file from the current `home` head.
- Review the exact diff.
- Confirm no unrelated concurrent work was overwritten.

Unexpected change => REVERT / STOP.

## Gate 7 — Test gate
After every cleanup commit:
- Provide a SHA-pinned RawGitHack URL.
- Test Home navigation first.
- Test Prayer, Azkar, Quran, Falaki.
- Confirm GNSS and Serenity still open without modification.
- Confirm Digital Compass and Astronomical Verification remain unchanged.
- Only after successful acceptance may the next cleanup commit begin.

## Current audit result — Calibration (`page-cal`)
Status: **KEEP / NOT SAFE TO DELETE**.

Reason: `page-cal` is actively updated by the main runtime. The main update path writes to calibration IDs and calls calibration drawing/build functions. In addition, `#err-table` is accessed without a null guard. Removing only the HTML would risk a runtime exception affecting the wider application.

No calibration HTML/CSS/JS is to be deleted in the current cleanup stage.

## Stop condition
If there is any visual regression, dead navigation button, missing screen, runtime error, layout-width regression, or unexpected behavior: stop cleanup immediately and compare against `klir` before any further change.
