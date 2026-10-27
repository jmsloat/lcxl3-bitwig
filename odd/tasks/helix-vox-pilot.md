# Vox Chime pilot
Objective: create the next hardware-ready amp pilot and calibrate it by listening. Branch: `codex/helix-native-controller`.
Route: inline; model-schema mapping delegated read-only. Runner: `node tests/vox.cjs`, `npm test`. Delivery: ask-on-risk; forecast 120 authored lines excluding generated preset data.

## Specs

- S1: User: "what next? another amp?" followed by "okay." authorizes the proposed "Vox Chime (Essex A30)" pilot with the shared controls and five snapshot roles. Check actual vendor model schema, assignments and snapshots; import acceptance remains live.
- S2: "the tremelo is too strong" and "no just remember it for future presets." Use subtler modulation in this new preset, leaving the accepted Orange untouched.
- S3: "yeah i want to get the levels right before we proceed." Check Vox levels independently before expanding the bank. Starting level is uncalibrated; do not represent it as matched to Orange.

## Tasks

- T1 [S1–S3] inline — pending: generate hardware-ready preset, test model/slot/snapshot invariants and preserve Orange. Work-unit commit pending.
- T2 [S1–S3] inline — pending: copy into Wine C drive, update bank Page and collect import/level listening results. Waiting on user is expected; no sound matching can be proven offline.

## Log

- L1: User: "what next? another amp?" Assistant proposed Vox Chime (Essex A30), shared controls and five roles, subtler modulation and independent level check. User: "okay."
- L2: Vendor `res/amp.models:4813–4952` confirms HD2_AmpEssexA30, Cut and Presence but no Mid. Vendor `res/cabmicirs.models:1485–1596` confirms modern HD2_CabMicIr_2x12BlueBell. Knob 3 targets Cut in Vox, retaining Mid in Orange; shared display becomes Mid / Cut. Factory-linked cab is Silver Bell; Blue Bell is a deliberate Vox-style alternative.
- L3: Preserve pre-existing dirty controller/navigation/harness/docs changes and Orange presets. Known stale effect LEDs after snapshot recall are deferred/non-blocking. Engram project resolves but reads/writes reject it; mirror pending.
