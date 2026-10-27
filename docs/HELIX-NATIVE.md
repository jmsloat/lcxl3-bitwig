# Helix Native bank controls

Import `C:\17 Orange Hardware.hlx` into an unused Native slot, then select the
Helix Native device header in Bitwig. This is a new assignment-only copy of the
accepted Orange Five pilot: sound settings, snapshots, output gain and strong
tremolo are unchanged. Future presets should use subtler modulation.

## Layout

| Controls, left to right | Bindings |
|---|---|
| Top buttons 1–5 | Core, Pushed, Drive, Movement, Space |
| Bottom buttons 1–5 | Compressor, drive, modulation, delay, reverb on/off |
| Top encoders | Amp Gain, Bass, Mid, Treble, Presence, Amp Master, Amp Level, Comp Threshold |
| Middle encoders | Drive Gain, Drive Tone, Drive Level, Mod Depth, Delay Time, Delay Feedback, Delay Mix, Reverb Mix |
| Faders | Comp Threshold, Drive Gain, Drive Level, Mod Depth, Delay Mix, Reverb Mix, Amp Level, Master Output |

Other buttons and the bottom encoder row are unassigned. Shift gives fine encoder
adjustment; snapshot buttons select the same sounds with or without Shift.
Selected snapshot LEDs are bright; the other four are dim. Native states 6–8
have no selector here. Faders use pickup and rearm after local or host snapshot
changes. Master Output is Native's per-instance master trim, not the preset's
accepted +12 dB output-block setting; leave its fader alone during initial checks.

## Important limits

- Use this layout with the hardware-ready bank copy. Helix exposes generic slots,
  so the script cannot identify what arbitrary presets assign to each slot.
- Native has 16 continuous automation slots. The first two encoder rows address
  those slots; faders duplicate selected roles. No hidden block parameters are
  exposed by the controller script.
- The pilot uses Tone Sovereign's first-stage Gain/Tone/Level controls; its second
  stage is not mapped. Delay Time is limited to 50–1000 ms, compressor Threshold
  to −40 through −10 dB, and Amp Gain retains the tested 1.8–7.9 assignment.
- Existing snapshot parameter assignments and both original automation assignments
  are preserved. Snapshot recall and DAW automation can both affect these controls;
  first test without automation playback overriding them.
- Host-reported value text is displayed as supplied. Meaningful units and physical
  control feedback still need live verification; do not infer units from slot names.
- Snapshot selection uses host Snapshot Index, not MIDI routing. No extra preset
  control track is required. Device/profile selection performs no sound writes;
  snapshot selection intentionally recalls its gain and effect settings.

## Verification

Run `node tests/helix.cjs` and `npm test`. Tests cover fixed-value writes, exclusive
snapshot LEDs, host feedback, pickup resets, Shift, guards, toggles, slot IDs and
the assignment-only preset difference. Existing profile regressions remain in
the suite. Live checks must confirm five snapshot buttons, sixteen encoders,
five toggles and pickup before generating the remaining bank. Also test recalling
a snapshot then immediately turning an encoder: cached values must catch up with
Native's feedback. Delayed-feedback behavior has not been validated live.
