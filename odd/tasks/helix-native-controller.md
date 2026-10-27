# Helix Native controller support
Objective: validate the LCXL3 workflow on the accepted Orange pilot before expanding the bank.
Branch: `codex/helix-native-controller`. Route: inline implementation, independent verification. Runner: `npm test`. Delivery: ask-on-risk; forecast approximately 380 authored lines, excluding generated preset data.

## Specs

- S1: "okay. lets get going ." authorizes the recommended hardware-support-first work: five snapshot buttons, a consistent continuous-control layout, effect toggles and feedback. Acceptance: captured host IDs, an explicit bank mapping, guarded hardware writes, and tests of existing behavior.
- S2: "for each amp - i'd like to have 5 or so snapshots of varying combinations of gain, distortion, effects, etc. for easy changing of sound within a core amp sound." This unit implements the five known Orange snapshots as fixed-value selectors, not toggles; broader bank generation remains out of scope.
- S3: "the tremelo is too strong, but we're not married to that modulation source anyway. i think the levels sound good, the switching works." and "no just remember it for future presets." Preserve the accepted pilot's sound, snapshot values and output gain. Generate a separate hardware-ready copy by adding automation assignments only.
- S4: "make a page in my space with the list of amps and places for notes and such" keeps the existing bank Page as the user-facing tracker. Update it with the actual controls and pending live checks.

Implementation assumptions: top-row buttons 1–5 select Core/Pushed/Drive/Movement/Space in both normal and Shift layers; bottom-row buttons 1–5 toggle compressor/drive/modulation/delay/reverb. Two encoder rows cover the 16 Native knob slots; unused controls remain unassigned. Faders duplicate useful controls with pickup, plus Native master output. The fixed layout applies to generated bank presets, not arbitrary Native presets. Snapshot Index uses eight states in the full Helix preset mode; only states 1–5 receive selector buttons.

## Tasks

- T1 [S1–S3] inline — implemented; RED observed for missing Helix IDs, focused test and full suite GREEN. Declarative selectors, captured-ID profile, assignment-only hardware copy and regressions are complete. Risk: items 3 and 4 (shared profile contract and snapshot/feedback ordering). Independent verification and commit pending.
- T2 [S1–S4] inline + independent verification — pending: documentation, isolated verifier, local install with backup, Page update, then live user acceptance. Native review unavailable because `gentle-ai` is not installed. Commit: pending.

## Log

- L1: "okay. lets get going ."
- L2: "okay, should be good to go" followed by "oh. i removed it. try now". Live inspector capture succeeded after the latter: Helix Native exposes 35 parameters. Knob 01–16 are `CONTENTS/PID0`–`PIDf`, Switch 01–16 are `PID10`–`PID1f`, Master Input/Output are `PID20`/`PID21`, Snapshot Index is `PID24`. Capture remains local at `/tmp/lcxl3-selected-parameters.json`.
- L3: Existing navigation/controller/harness modifications and generated presets predate this feature. Preserve them and do not absorb their unrelated changes into feature commits. Original branch was `codex/pigments-profile`; prior controller bytes and diff are saved under `/tmp/lcxl3-helix-before/` for precise staging and comparison.
- L4: The repository has no project skill registry. Applicable explicit skills loaded: work-unit-commits and cognitive-doc-design. Engram resolves the correct project but rejects reads/writes as unknown/unbacked; recovery mirror is pending, not saved.
- L5: Read-only explorer mapped action dispatch, observation, exclusive LEDs and pickup reset seams. No writer delegation reason applies; parent implements inline. Shared behavior requires an independent verifier after focused tests and suite.
- L6: `node tests/helix.cjs` failed before implementation on the missing captured-ID map, then passed after implementation. `npm test` passed all existing and new tests. Hardware copy adds 16 knob and five switch assignments without changing the accepted sound/snapshots, output +12 dB, original two assignments or tremolo. Native import and physical control checks remain pending. The existing Orange Five file is included solely as the regression source fixture, not other prior preset versions.
- L7: Independent verifier passed S1–S3 offline in isolated scratch copies, including all eight faders, guard-state hashes, actual capture IDs and assignment-only preservation. No confirmed new blocker. Advisory: rapid snapshot→encoder movement before host value feedback can encounter the pre-existing cached-value behavior; explicitly test this live. Documentation now distinguishes device/profile selection (no writes) from intentional snapshot recall. Native review remains unavailable, not approved.
