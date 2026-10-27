# Vox Chime pilot
Objective: create the next hardware-ready amp pilot and calibrate it by listening. Branch: `codex/helix-native-controller`.
Route: inline; model-schema mapping delegated read-only. Runner: `node tests/vox.cjs`, `npm test`. Delivery: ask-on-risk; forecast 120 authored lines excluding generated preset data.

## Specs

- S1: User: "what next? another amp?" followed by "okay." authorizes the proposed "Vox Chime (Essex A30)" pilot with the shared controls and five snapshot roles. Check actual vendor model schema, assignments and snapshots; import acceptance remains live.
- S2: "the tremelo is too strong" and "no just remember it for future presets." Use subtler modulation in this new preset, leaving the accepted Orange untouched.
- S3: "yeah i want to get the levels right before we proceed." Check Vox levels independently before expanding the bank. Starting level is uncalibrated; do not represent it as matched to Orange.

## Tasks

- T1 [S1–S3] inline — complete in `7b5475e`: hardware-ready Vox preset, schema/slot/snapshot tests, full suite and vendor-resource checks passed. Orange unchanged. Risk: none; only new preset data and profile-local label change, no shared engine logic.
- T2 [S1–S3] inline — copied into Wine C drive, label installed with backup and bank Page updated; complete: Native import and all five snapshot levels accepted as a good starting point; Core ~−8 dBFS. User plans personal tweaks; no final tone or exact perceived-loudness match to Orange claimed. Acceptance record follows.

## Log

- L1: User: "what next? another amp?" Assistant proposed Vox Chime (Essex A30), shared controls and five roles, subtler modulation and independent level check. User: "okay."
- L2: Vendor `res/amp.models:4813–4952` confirms HD2_AmpEssexA30, Cut and Presence but no Mid. Vendor `res/cabmicirs.models:1485–1596` confirms modern HD2_CabMicIr_2x12BlueBell. Knob 3 targets Cut in Vox, retaining Mid in Orange; shared display becomes Mid / Cut. Factory-linked cab is Silver Bell; Blue Bell is a deliberate Vox-style alternative.
- L3: Preserve pre-existing dirty controller/navigation/harness/docs changes and Orange presets. Known stale effect LEDs after snapshot recall are deferred/non-blocking. Engram project resolves but reads/writes reject it; mirror pending.
- L4: RED: `node tests/vox.cjs` failed on missing `07 Vox Chime.hlx`. GREEN: focused test and `npm test` passed after creation. Additional check parsed installed vendor amp/cab JSON and verified model-specific parameter keys/ranges. `git diff --check` passed. No native review assessment available: `gentle-ai` executable absent; no review approval claimed.
- L5: Core/Pushed/Drive/Movement/Space gains start at .25/.40/.30/.23/.23. Output block starts at 0 dB, ChVol .74, Master 1.0. Blue Bell uses 121 Ribbon (modern Mic 5), Position .35, Distance 3, cuts 80–8000 Hz. Tremolo depth .18. These are listening starting points, not calibrated claims. Slot 3 maps Cut; all other assignments, shared effects, routing and bypass roles preserved and tested against Orange.
- L6: Copied `C:\07 Vox Chime.hlx` without replacing an existing file; byte comparison passed. Installed label via `python3 tools/install.py`; backup `/home/jsloat/Bitwig Studio/Controller Script Backups/LCXL3 Effects-20261027T204439Z-cdef3e`. Installed profile byte comparison passed. Page https://chatgpt.com/space/page_58abf894e97c819190c488dc28ca02dd updated to pilot-generated/import-and-level-pending with Cut mapping. No push/PR; prior unrelated changes remain uncommitted. Authored changes about 100 lines excluding generated preset data, below chain heuristic.
- L7: Next user check: import into an unused Native slot, keep plugin trims at 0 dB, play Core with the same guitar/strumming as Orange and report peak and relative loudness. Reload controller if the shared label has not refreshed. Then validate the remaining snapshot levels before proceeding to more amps.

- L8 (2026-10-27): User: "around -8 - it sounds good." Response to Core listening check establishes import and Core tone/level acceptance. Leave gain unchanged; check Pushed/Drive/Movement/Space next for unwanted volume jumps. Page updated; Engram mirror still unavailable.

- L9 (2026-10-27): User: "yeah. i'll tweak a bit but they're a good starting spot." Confirms all five snapshots are balanced enough as a starting point. T2 complete; no more gain/sound changes. Preserve user tweaks; obtain a new export before revising their version. Page acceptance status updated. Documentation-only structural check: `git diff --check` passed; no functional rerun needed because preset/code bytes are unchanged. Engram mirror pending.
