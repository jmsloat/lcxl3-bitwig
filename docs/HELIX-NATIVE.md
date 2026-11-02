# Helix Native bank controls

## Bulk editing workflow

As agreed October 29, 2026, `C:\Helix Amp Bank` is the current 18-preset import
folder. For future edits, replace the affected files **in place**, keeping their
existing filenames and Native preset names stable. Do not create new `v2`, `v3`
or other renamed revision copies. Keep the active repository mirror in
`presets/helix-native/current-bank` synchronized with the import-folder files, and verify
that their bytes match after updates.

Collect listening notes and apply requested changes as a batch so the user can
reimport the bank together. Replacing disk files does not itself update presets
already imported into Native. Keep historical files outside the import folder;
no historical deletion or sound change is implied by this workflow agreement.
The new-copy instructions in the pilot history below describe earlier work and
do not govern future revisions.

## Separate amp and cabinet blocks

The active bank uses separate Amp and Cab blocks, with every existing amp/cab
pairing and cab parameter preserved. Amp remains `block2` (now type 1 at position
2); the standalone modern Cab is `block6` (type 2 at position 3). The former
combined block's `@cab` reference and auxiliary `cab0` object are removed.
The signal order is compressor → Teemah → Amp → Cab → modulation → delay →
Dynamic Plate. Snapshot cab bypass states preserve the combined block's previous
behavior; all amp/effect controller paths and all other sound settings remain
unchanged. Cab controls are separately editable in Native, not newly assigned
to hardware knobs.

The active source files are in `presets/helix-native/current-bank`, mirrored to
`C:\Helix Amp Bank` with the same 18 filenames. Root-level repository presets
remain historical combined-block generation baselines for regression tests;
older files/ZIPs outside the current import folder are not the active bank.
Serialization follows an installed Native factory preset with separate type-1
amp and type-2 modern cab blocks. Structural regression checks compare the
entire bank against the combined baselines. Live Native import, audio equivalence
and controller behavior still require confirmation after reimport.

## Current bank defaults

Use Teemah and **Dynamic Plate**, not legacy Plate, for future bank presets unless a specific amp calls
for an explicitly agreed exception. The table below records the original Dynamic Plate migration. For ongoing
revisions use the bulk editing workflow above, then select the Helix Native
device header in Bitwig:

| New file in Wine C drive | Accepted source retained unchanged |
|---|---|
| `04 Modern Clean Dynamic Plate.hlx` | `04 Modern Clean Bank.hlx` |
| `07 Vox Chime Dynamic Plate.hlx` | `07 Vox Chime Bank.hlx` |
| `17 Orange Edge Dynamic Plate.hlx` | `17 Orange Edge Bank.hlx` |
| `12 Trainwreck Edge Dynamic Plate v2.hlx` | `12 Trainwreck Edge Dynamic Plate.hlx` |

Teemah starts with Gain 2.0, Bass Cut 1.5, Treble Cut 1.0, Clipping 0 and Level
6.25, as auditioned on Archetype. The drive knobs address Gain / Treble Cut /
Level, and increasing Drive Tone cuts more highs. Bass Cut and Clipping remain
editable in Native. Hardware slot order and all five snapshot roles are retained.

Dynamic Plate uses `VIC_DynPlate`: Decay 2.0 seconds, `PreDelay` 20 ms, Damping
6000 Hz, Low Cut 120 Hz, High Cut 8000 Hz, Level 0 dB, stereo and trails on.
Motion Rate starts at 0.25 and Motion Range at 0.15; Low Freq is 100 Hz with
Low Gain 0 dB. Mix retains 12% for Core/Pushed/Drive, 15% for Movement and 28%
for Space. Unlike legacy Plate, Decay is in seconds and the exact parameter key
is `PreDelay`, not `Predelay`. Model keys/types/ranges were checked against the
installed vendor JSON; see the [official Dynamic Plate introduction](https://kb.line6.com/helix-3-15-release-notes).

Amp/cab, amp EQ, snapshot gain/Channel Volume, output gain, compressor, delay
and modulation are unchanged from each source. In particular, Orange retains
its +12 dB output block and existing strong tremolo; Vox/Archetype retain 0 dB
output and subtler modulation. Trainwreck retains v3's cleaner snapshot set;
its latest Dynamic Plate v2 copy reduces final output from +8 to +5 dB (−3 dB)
at the user's request. The user likes Dynamic Plate, but clip-free headroom for
the output revision still needs live checking. Originals and earlier experiments
are untouched.
No controller reinstall is needed. Offline tests pass; new effect character and
pedal-on/off volume require listening, especially on Orange and Vox. A shared
pedal Level value is not proof of equal perceived loudness across amps.

Earlier Bank copies used legacy Plate, which the user rejected. They remain as
historical references, not the default. Initial Dynamic Plate copies changed only
reverb; Trainwreck Dynamic Plate v2 changes only output gain from its listed
source. The pilot/revision sections below document
the earlier sequence; use the table above for the current reverb default.

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
- The original Orange pilot used Tone Sovereign's first-stage controls. Current
  Bank copies use Teemah Gain/Treble Cut/Level. Delay Time is limited to
  50–1000 ms, compressor Threshold
  to −40 through −10 dB. Amp Gain normally uses the tested 1.8–7.9 assignment;
  the cleaner Trainwreck v2 extends its lower end to 0.0 so Core 1.0 is in range.
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

## Archetype Clean pilot

Import `C:\04 Modern Clean.hlx` into an unused slot. Archetype Clean uses its
vendor-linked modern 4x12 Cali V30 cab, with the shared 121 Ribbon mic setup.
The five snapshot roles, effect blocks and hardware slots match Vox; knob 3
controls Mid here. Depth and Bright are retained as amp settings but are not
additional hardware controls. Orange and Vox files are unchanged.

This starts with the vendor's Channel Volume 6.7, Master 6.0 and a 0 dB preset
output block. Core/Pushed/Drive/Movement/Space amp gains start at
3.0/5.0/3.5/2.8/2.8. Movement retains the gentler tremolo depth of 0.18.
Import and sound/level acceptance are pending: keep Native input/output trims
at 0 dB, check Core first, then compare all five snapshots for unwanted jumps.

### Archetype EQ comparisons

The original pilot's level is accepted, but the user reports boxy/muddy tone
even with compressor and reverb bypassed. Keep the original as a reference.
Import the following into separate unused slots; each retains all five roles.

| File in Wine C drive | Bass | Mid | Treble | Presence | Depth | Bright |
|---|---|---|---|---|---|---|
| `04 Modern Clear.hlx` | 4.0 | 5.0 | 5.5 | 5.5 | 2.0 | Off |
| `04 Modern Glass.hlx` | 3.0 | 3.5 | 6.0 | 5.5 | 1.0 | On |

These are experimental adaptations to the listening feedback, not published
PRS recipes. [Line 6 identifies Archetype Clean as the PRS Archon clean channel](https://cdn.line6.com/helix-models/).
The [PRS manual](https://support.prsguitars.com/hc/en-us/article_attachments/11297664632475)
describes Depth as power-amp low frequencies and Bright as added clean-channel
high frequencies. [Firsthand owner examples](https://forums.prsguitars.com/threads/new-amp-day-archon-100watt.14561/page-2)
use roughly noon EQ with different Bright and Depth choices; this is not a
universal setting or a guaranteed translation from hardware to the model.

Only Bass/Mid/Treble/Presence/Depth/Bright change. Cab, mic, cuts, gain, master,
channel/output levels, effects, snapshots and automation are unchanged. EQ may
still change measured/perceived loudness; unchanged level controls do not prove
loudness matching. Compare Core first with the same playing, trims and effect
bypass state. Neither trial has listening acceptance yet.

### Clear v2 gain and level trial

The user prefers Clear EQ and requested Core at the old Pushed setting, with
Pushed going further, combining more breakup and output volume. Import the
separate `C:\04 Modern Clear v2.hlx` into an unused slot.

| Snapshot | Amp Drive | Channel Volume |
|---|---|---|
| Core | 5.0 (old Pushed gain) | 7.0 |
| Pushed | 6.5 | 7.2 |
| Drive | 3.5 (unchanged) | 6.7 |
| Movement | 2.8 (unchanged) | 6.7 |
| Space | 2.8 (unchanged) | 6.7 |

Channel Volume is now snapshot-assigned for all five roles, so returning to the
other three restores their original level setting. Gain/level values are trial
settings, not a calibrated dB lift. Clear EQ, cab/mic, effects, all other snapshot
data, master/output trim and hardware assignments are preserved. Original files
are untouched. Check Core → Pushed and then return to the other roles by ear.

### Clear Teemah trial

The user accepts Clear v2's Core/Pushed revision, but finds Tone Sovereign
changes the amp character too much. The separate `C:\04 Clear Teemah.hlx` is
now the accepted Archetype starting point: the user reports the Teemah version
is much better and likes it a lot. Preserve this version; Vox and Orange are
not changed by this preference.
[Line 6 identifies Teemah as a Paul Cochrane Timmy model](https://line6.com/helix-models/?locale=en_US).
This is a low-gain listening trial, not a claim of guaranteed transparency or
unity volume: Gain 2.0, Bass Cut 1.5, Treble Cut 1.0, Clipping 0 and Level 6.25
(the vendor default Level value).

The three drive knobs now target Gain, Treble Cut and Level. Drive Tone therefore
cuts more treble as it increases; it is not Tone Sovereign's tone control.
Bass Cut and Clipping remain editable inside Native. The drive bypass slot and
five snapshot bypass states are unchanged: only Drive engages the pedal by
default. All snapshot gain/Channel Volume settings, amp/Clear EQ, cab/mic,
compressor, modulation, delay and reverb remain exactly as in Clear v2.
No existing preset is overwritten. Check pedal-on/off character and volume by
ear on the same snapshot; the deferred LED issue still applies after recalls.

## Trainwreck Edge pilot

Import `C:\12 Trainwreck Edge Bank.hlx` into an unused slot; Native's preset
name is `12 Trainwreck`. Derailed Ingrid uses its vendor-linked modern 4x12 Cali
V30 cab with a 57 Dynamic mic, Position 0.30, Distance 1 inch and cuts 80–8000 Hz.
The shared Teemah, Plate, effects, controller assignments and five roles remain
intact. Earlier presets are untouched.

Core/Pushed/Drive/Movement/Space amp gains start at 2.2/3.8/2.8/2.0/2.0. Channel
Volume recalls 6.0 in all five roles; Master starts at the vendor's 8.5 and the
output block stays at 0 dB. Bass 4.0, Mid 5.5, Treble 5.5, Presence 4.8 and
Bright 0 are audition settings, not a measured loudness match or guaranteed
breakup threshold. Bright is an integer 0–2 in this model, not Archetype's
boolean Bright control; Archetype-only Depth and BrightSW are not carried over.

[Trainwreck's manual](https://www.trainwreck.com/brochure.html) recommends starting
tone controls near noon, then adjusting volume and tone by ear. These settings
are adaptations, not a copied recipe. Leave Native input/output trims at 0 dB,
check Core's peak and character first, then compare all five snapshots. Tests
and installed vendor-schema checks pass; Native import and listening are pending.

### Cleaner Trainwreck Core revision

The original pilot's levels are acceptable, but the user finds it dirtier than
expected and wants Core mostly clean, breaking up on harder playing. Import
the separate `C:\12 Trainwreck Edge Bank v2.hlx` (`12 Trainwreck v2` in Native).
Core now uses Drive 1.0, Master 4.5 and Channel Volume 8.0. This is a cleaner
gain-staging trial with an unmeasured volume compensation, not a guaranteed
clean threshold or loudness match.

Pushed/Drive/Movement/Space keep their original Drive/Channel Volume settings;
all four explicitly recall the original Master 8.5. Master is now assigned to
snapshots in all five roles, preventing Core's lower Master from carrying into
Pushed. Amp Gain's automation minimum is 0.0 for this copy only, so the hardware
range includes Core's new 1.0 setting. Cab/mic, EQ, Teemah/Plate, other effects,
output gain, remaining assignments and originals are unchanged. Check Core's
cleanliness and level first, then Core → Pushed. Live acceptance is pending.

### Trainwreck v3 whole-set rebasing and output lift

Use the separate `C:\12 Trainwreck Edge Bank v3.hlx` (`12 Trainwreck v3` in
Native) for the next audition. The user reports v2's cleaner Core peaks around
−18 dBFS and correctly expects the other snapshots to follow its new foundation,
rather than returning to the original dirtier gain staging.

All five snapshots now recall Master 4.5 and Channel Volume 8.0. Core, Drive,
Movement and Space share amp Drive 1.0; Pushed steps up to 2.0. Drive adds the
same Teemah; Movement and Space retain their existing effects/bypass/mix settings.
EQ, cab/mic and all other sound and hardware data are unchanged from v2.

The final output block adds +8 dB, rather than increasing amp gain to fix volume.
For identical playing, v2 Core's reported −18 dBFS would become approximately
−10 dBFS. This is not measured proof: new Pushed, pedal-on and effect-heavy peaks
still need checking. Lower monitor volume before importing into an unused slot;
leave Native plugin trims at 0 dB. Originals and v2 remain untouched.

## Black Parade inspired pilot

Import `C:\18 Black Parade.hlx` into an unused slot. This adds a rock preset
to the bank rather than replacing one of the planned clean/edge amps. Core is
intentionally rhythm crunch here, not a clean baseline.

[Ray Toro's firsthand interview](https://www.seymourduncan.com/blog/artist/ray-toro-of-my-chemical-romance)
identifies a borrowed 100-watt JCM800 as his main album head, but does not specify
the submodel or album cabinet speakers. [Brit 2203](https://line6.com/helix-models/)
is the 100-watt JCM800 model chosen as an approximation; the modern 4x12 Brit V30
and 57 Dynamic mic are our voicing choices, not a verified studio cab/mic chain.
The album also uses layered guitars; one preset is not a complete recreation.

Amp Bass/Mid/Treble/Presence start at 4.0/6.5/5.0/4.0, Master 3.5, Channel Volume
6.0 and final output 0 dB. Core/Drive/Movement/Space share Drive 6.5; Pushed
steps up to 7.5. Drive adds the shared Teemah; Movement and Space retain their
usual effects. All five derive from the same crunch foundation. Teemah,
Dynamic Plate, hardware slots and other shared effects are unchanged.

Cab starts at Position 0.30, Distance 1 inch, cuts 90–8000 Hz and Level 0 dB.
These are audition settings, not documented album knob positions or a measured
level match. Leave Native input/output trims at 0 dB, check Core's tone and peak,
then check Pushed and Drive on strong chords for headroom. Previous presets are
untouched; Native import and listening acceptance are pending.

## Matchless Edge pilot

Import `C:\08 Matchless Edge.hlx` into an unused slot (`08 Matchless` in Native).
Matchstick Ch1 with its linked modern 2x12 Match H30 cab is the next approved
amp-list entry. The audition target is chime and light breakup, not a measured
level match. Bass/Treble/Cut start at 4.0/5.5/4.0, Master 10 and Channel Volume
7.0; final output remains 0 dB. Cab uses 57 Dynamic, Position 0.56, Distance
1 inch and cuts 80–8000 Hz.

Core/Drive/Movement/Space share gain 3.0; Pushed raises it to 4.5. Drive adds
Teemah; the shared effects, Dynamic Plate and snapshot roles are preserved.
This amp serializes gain as `Ch1Drive`: knob 1 and all five snapshot gain
controllers use that key. Knob 3 remains Cut, as on the Vox; no controller
reinstall is needed. Previous files are untouched. Native import, tone and
strong-chord headroom checks remain pending with plugin trims at 0 dB.

## Princeton Clean pilot

Import `C:\02 Princeton Clean.hlx` into an unused slot (`02 Princeton` in Native).
US Princess uses the linked modern 1x10 US Princess cab. The audition target is
a clean Core with more breakup available in Pushed; input level and pickups
will determine the actual breakup point. Core/Drive/Movement/Space use Drive
3.0; Pushed uses 5.0. Drive adds Teemah; all shared effects, Dynamic Plate and
snapshot bypass/mix roles are preserved.

Bass/Mid/Treble start at 2.5/6.0/6.0, Presence 0, Master 10 and Channel Volume
8.0. Cab uses the model-default 67 condenser mic, Position 0.63, Distance
2 inches, Angle 45 degrees, with cuts 80–8000 Hz. Final output is 0 dB.
Knob 3 is Mid, not the Vox/Matchless Cut. Other controls are unchanged;
no controller reinstall is required. Prior presets are preserved. Keep plugin
trims at 0 dB for audition; import, tone, level matching and headroom remain
pending, particularly Pushed and pedal-on strong chords.

## Dr Z Edge pilot

Import `C:\09 Dr Z Edge.hlx` into an unused slot (`09 Dr Z Edge` in Native).
Interstate Zed uses the linked modern 2x12 Interstate cab. The audition target
is a responsive edge-of-breakup Core. Core/Drive/Movement/Space use Drive 3.5;
Pushed raises it to 5.0. Drive adds Teemah; Movement and Space keep the shared
effects and bypass/mix roles. Dynamic Plate and the compressor remain unchanged.

Bass/Mid/Treble start at 4.0/5.0/5.5, Presence 1.5, Master 10 and Channel Volume
7.0. Cab uses 57 Dynamic, Position 0.30, Distance 1 inch, Angle 0 degrees and
cuts 80–8000 Hz. Final output is 0 dB. Knob 3 is Mid. All other hardware slots
are preserved; this preset does not diagnose or fix the user's newly reported
controller failure. That investigation is paused at the user's request to
continue generating amps.

These are starting settings, not a measured level match. Keep Native trims at
0 dB for audition; import, tone and Core/Pushed/Drive headroom checks remain
pending. All previous presets remain untouched.

## Remaining amp batch

All ten remaining planned amps were generated October 29, 2026. Import the
individual files from `C:\` into unused slots; `C:\Helix Remaining Amps.zip`
contains the same ten files for convenience (extract before importing). Existing
presets and revisions are unchanged. All new files retain the shared compressor,
Teemah, subtle modulation, delay and Dynamic Plate, with five familiar roles.

| File | Amp | Cab | Core / Pushed gain |
|---|---|---|---|
| `01 Twin Clean.hlx` | US Double Nrm | 2x12 Double C12N | 2.8 / 4.5 |
| `03 Jazz Clean.hlx` | Jazz Rivet 120 | 2x12 Jazz Rivet | 2.8 / 4.5 |
| `05 Hiwatt Clean.hlx` | WhoWatt 100 | 4x12 WhoWatt 100 | 3 / 4.8 |
| `06 Deluxe Edge.hlx` | US Deluxe Nrm | 1x12 US Deluxe | 3.8 / 5.5 |
| `10 Divided Edge.hlx` | Divided Duo | 1x12 Open Cream | 3.2 / 4.8 |
| `11 J45 Edge.hlx` | Brit J45 Brt | 4x12 Greenback20 | 3.5 / 5.2 |
| `13 Litigator Edge.hlx` | Line 6 Litigator | 1x12 US Deluxe | 3.5 / 5.2 |
| `14 Hot Rod Rock.hlx` | Placater Dirty | 4x12 Greenback 25 | 4.8 / 6.5 |
| `15 Boogie Lead.hlx` | Cali IV Lead | 4x12 Cali V30 | 5.5 / 7 |
| `16 Heavy Rhythm.hlx` | PV Panama | 4x12 Cali V30 | 4.5 / 6 |

Core, Drive, Movement and Space share each amp's baseline gain; Pushed raises
it. Drive enables Teemah; Movement and Space use the existing effects roles.
The rock/high-gain entries start distorted rather than forcing a clean Core.
Jazz Clean's Pushed is a higher-gain alternative, not a promise of tube breakup.

**Control exceptions:** Divided Edge has no Bass/Mid/Treble parameters. Its
first four knobs are Drive 1, Drive 2, Cut and Tone. Drive 2 starts at 2.2 and
stays fixed across snapshots; only Drive 1 steps up in Pushed. Boogie Lead
maps knob 1 and snapshot gain to LeadDrive, with LeadGain fixed at 7.0.
The other eight use Drive/Bass/Mid/Treble in the first four slots.

All ten use a 57 Dynamic mic, Position 0.30, Distance 1 inch, Angle 0 degrees,
cab cuts 80–8000 Hz and final output 0 dB. Other amp parameters start from the
installed model defaults with conservative per-amp gain/EQ/Channel Volume
adjustments. No automatic loudness measurement or matching was performed.

**Listening pass:** Leave Native trims at 0 dB, start at low monitor volume,
then note each preset number, Core peak/tone, Pushed/Drive headroom and any
effect problems. Import, sound quality and levels are pending audition. The
newly reported controller failure remains unresolved; generating these files
does not repair it. No earlier pilot is marked accepted merely because the
bank is now generated.

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
