# Helix Native controller

The LCXL3 profile controls Helix Native through its exposed automation slots.
This repository supplies the controller profile and captured parameter IDs, not
sound presets. Keep `.hlx` files and preset-generation work outside version control.
The installer does not load or copy them.

## Setup

Configure Native's automation assignments to match the roles below, then select
its device in Bitwig. The script recognizes the exposed slot IDs, not the blocks
assigned inside a preset: it cannot verify that an arbitrary preset matches.
Changing device or profile does not write sound settings. Snapshot buttons
intentionally recall the selected snapshot's settings.

## Control layout

| Controls, left to right | Bindings |
|---|---|
| Top buttons 1–5 | Core, Pushed, Drive, Movement, Space (snapshot states 1–5) |
| Bottom buttons 1–5 | Compressor, drive, modulation, delay, reverb on/off |
| Top encoders (Knob 01–08) | Amp Gain, Bass, Mid / Cut, Treble, Presence, Amp Master, Amp Level, Comp Threshold |
| Middle encoders (Knob 09–16) | Drive Gain, Drive Tone, Drive Level, Mod Depth, Delay Time, Delay Feedback, Delay Mix, Reverb Mix |
| Faders | Comp Threshold, Drive Gain, Drive Level, Mod Depth, Delay Mix, Reverb Mix, Amp Level, Master Output |

Assign Switch 01–05 to compressor, drive, modulation, delay and reverb power,
respectively. Master Output uses Native's exposed per-instance master output
parameter, not a preset block's output level. Choose block targets and assignment
ranges in Native; the controller does not create or modify those assignments.

Other buttons and the bottom encoder row are unassigned. Shift gives fine encoder
adjustment; snapshot buttons select the same states with or without Shift.
Selected snapshot LEDs are bright; the other four are dim. Native snapshot states
6–8 have no selector here. Faders use pickup and rearm after local or host-reported
snapshot changes.

## Limits and feedback

- Native exposes 16 continuous automation slots. Faders duplicate selected roles;
  the script does not expose hidden block parameters.
- Snapshot selection uses the host Snapshot Index parameter, not routed MIDI.
  No extra preset-control track is required.
- Host-reported value text is displayed as supplied. Do not infer physical units
  from slot names. DAW automation can override recalled or manually changed values.
- Effect-toggle LEDs follow host switch feedback. In the reported Core → Drive
  case, Bitwig's Switch 02 did not change even though the stored drive bypass
  state did. Its LED can therefore remain stale after snapshot recall. Other
  toggles may have the same limitation; check bypass in Native. The Native/Bitwig
  boundary remains undiagnosed; no predicted-state workaround is implemented.

## Verification

Run `node tests/helix.cjs` and `npm test`. Tests cover profile recognition, captured
slot mappings, fixed snapshot actions, exclusive snapshot LEDs, host feedback,
pickup resets, Shift, mode/handoff guards, effect toggles and shared action
validation. Tests do not require sound-preset files.

Physical checks remain separate: confirm five snapshot selectors, sixteen
encoders, five toggles and fader pickup with a compatible slot layout. Also test
recalling a snapshot then immediately turning an encoder: cached values must
catch up with Native's feedback. Delayed-feedback behavior has not been validated
live.
