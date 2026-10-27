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
| Top encoders | Amp Gain, Bass, Mid / Cut, Treble, Presence, Amp Master, Amp Level, Comp Threshold |
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

## Vox Chime pilot

Import `C:\07 Vox Chime.hlx` into an unused slot. It uses Essex A30 with a modern
2x12 Blue Bell cab and 121 Ribbon mic. Knob 3 is Cut on Vox and Mid on Orange;
the shared display reads Mid / Cut. All other automation slots and five snapshot
roles stay in the same places. Orange is unchanged.

This is an uncalibrated listening pilot: amp Channel Volume starts at 7.4 and
the preset output block at 0 dB, not Orange's +12 dB. Keep Native's master input
and output trims at 0 dB for comparison. First check Core with the same guitar
and strumming used for Orange, then compare all five snapshots for perceived
level and unwanted clipping. No level matching is claimed before that check.
Movement retains the shared tremolo but reduces depth from 0.73 to 0.18.

## Known issue: stale effect-toggle LEDs after snapshot recall

Status: deferred; not a blocker for continuing the amp bank.

In the user's Core → Drive test, Bitwig's exposed Switch 02 value does not
change, although the preset stores drive bypass off in Core and on in Drive.
The Drive toggle LED follows that exposed value and can therefore remain stale.
Other snapshot-dependent effect toggles may have the same limitation; they have
not been individually confirmed. Check bypass in Native rather than relying on
effect-toggle colors after snapshot changes. No predicted-state workaround is
being implemented. The boundary between Native and Bitwig remains undiagnosed.

## Verification

Run `node tests/helix.cjs` and `npm test`. Tests cover fixed-value writes, exclusive
snapshot LEDs, host feedback, pickup resets, Shift, guards, toggles, slot IDs and
the assignment-only preset difference. Existing profile regressions remain in
the suite. Live checks must confirm five snapshot buttons, sixteen encoders,
five toggles and pickup before generating the remaining bank. Also test recalling
a snapshot then immediately turning an encoder: cached values must catch up with
Native's feedback. Delayed-feedback behavior has not been validated live.
