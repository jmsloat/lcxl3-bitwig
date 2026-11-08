# Augmented instrument controls

Select any verified instrument below in Bitwig to activate the shared
**AUGMENTED** profile:

- Augmented GRAND PIANO
- Augmented STRINGS
- Augmented MALLETS
- Augmented VOICES
- Augmented YANGTZE
- Augmented WOODWINDS
- Augmented BRASS

Live captures from all seven instruments expose the same 761 parameter names and
IDs. This profile uses 86 uniquely named parameters, with one layout and shared
page memory across the family. The existing parameter-signature guard remains
required; names outside this explicit list use generic Remote Controls.

## Encoder pages

Each cell lists eight encoders, left to right. ADSR means Attack, Decay, Sustain,
Release. Page up/down changes pages; Shift gives fine adjustment.

| Page | Top row | Middle row | Bottom row |
|---|---|---|---|
| Performance | Color, Time, Motion, FX A, FX B, Delay, Reverb, unassigned | Layer A cutoff, resonance, filter-envelope amount, spread; then the same four for Layer B | Sampler 1 attack/release, Sampler 2 attack/release, Synth 1 attack/release, Synth 2 attack/release |
| Envelopes | Sampler 1 ADSR; Synth 1 VCA ADSR | Sampler 2 ADSR; Synth 2 VCA ADSR | Layer A filter ADSR; Layer B filter ADSR |
| Sources + FX | Sampler 1/2 close-far mix, Sampler 1/2 width, Sampler 1/2 velocity amount, Synth 1/2 VCA velocity amount | Layer A FX1/FX2 dry/wet, Layer B FX1/FX2 dry/wet, master delay/reverb dry/wet, master delay/reverb send levels | Master reverb size, predelay, decay, damping, input/output volume; arpeggiator unsynced rate, swing |

The first seven encoders on Performance are the exposed performance macros,
not independently chosen effect parameters. Their sound depends on the loaded
preset's assignments. The eighth encoder is unassigned. Morph and source, layer,
and master volumes remain on the fixed faders, without encoder duplicates in
this layout. Attack/release shortcuts intentionally remain on Performance as well
as Envelopes. No source, algorithm, routing mode, preset, or macro assignment is
forced.

## Faders

1. Sampler 1 Volume
2. Sampler 2 Volume
3. Synth 1 Volume
4. Synth 2 Volume
5. Layer A Volume
6. Layer B Volume
7. Morph
8. Master Volume

All faders use pickup, including after external edits or device changes.

## Buttons

| Position | Top row | Bottom row |
|---|---|---|
| 1 | Sampler 1 bypass | Layer A FX1 on/off |
| 2 | Sampler 2 bypass | Layer A FX2 on/off |
| 3 | Synth 1 bypass | Layer B FX1 on/off |
| 4 | Synth 2 bypass | Layer B FX2 on/off |
| 5 | Layer A filter bypass | Arpeggiator on/off |
| 6 | Layer B filter bypass | Chord mode on/off |
| 7 | Master delay on/off | FX section on/off |
| 8 | Master reverb on/off | Unassigned |

Both Shift layers use the same buttons. Bypass buttons light when **bypassed**;
on/off buttons light when **enabled**. Presses display the host control name and
state. There are no unverified preset-navigation MIDI commands.

## Compatibility and verification

The profile requires both the exact device name (case-insensitive) and a captured
parameter signature. Incomplete signatures and other instruments use generic
Remote Controls. Native value text is displayed without guessed physical units.

The capture contains repeated names for algorithm-specific delay and other
controls. These ambiguous parameters are deliberately excluded. Detailed effect
controls may only be audible when that effect is active; the unsynced arpeggiator
rate applies when its clock is unsynced. Changing profiles does not change sound.

Run `node tests/augmented.cjs` and `npm test` for automated checks.
Matching automation interfaces do not imply identical sounds or macro assignments.
Physical acceptance remains separate for each instrument: check macro feedback,
page changes, all eight faders, bypass polarity, effect toggles, and changes across
several presets.
