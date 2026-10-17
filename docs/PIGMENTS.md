# Pigments profile

This profile uses 100 parameter IDs captured from the user's selected Pigments
instance through Bitwig's read-only Parameter Inspector. The raw capture exposed
2,265 parameters. Only bound name/ID pairs are retained, without track names or
project data. The capture does not identify the plugin version or format, so this
mapping is verified against that instance rather than claimed compatible with
every Pigments release. Selection requires the exact name `Pigments` (ignoring
case) and six signature IDs; unsupported signatures use generic Remote Controls.

## Encoder pages

Each row below runs left to right. Page up/down changes encoder assignments;
faders and buttons retain their assignments. Shift makes encoder changes finer.

| Page | Top row | Middle row | Bottom row |
| --- | --- | --- | --- |
| Performance | Macros 1–4; Filter 1 Cutoff, Resonance; Filter 2 Cutoff, Resonance | Amp envelope ADSR; Envelope 2 ADSR | Engine 1 Volume, Filter Mix; Engine 2 Volume, Filter Mix; Filter 1 Volume, Pan; Filter 2 Volume, Pan |
| Envelopes | Amp: Attack, Decay, Sustain, Release, Attack Curve, Decay Curve, Release Link, Mode | Envelope 2: same controls | Envelope 3: same controls |
| LFOs | LFO 1: Frequency, Waveform, Symmetry, Polarity, Initial Phase, Smooth, KeyTrack, Fade | LFO 2: same controls | LFO 3: same controls |
| Mixer + FX | Engine 1, Engine 2, Sub Osc, Noise 1, Noise 2, Filter 1, Filter 2, Master volumes | FX A1–A3 Dry/Wet, Bus A Volume; FX B1–B3 Dry/Wet, Bus B Volume | FX AUX1–AUX3 Dry/Wet, Aux Send, Aux Return, Engine 1 Filter Mix, Engine 2 Filter Mix, Voice Pan |

LFO Frequency addresses the free-running frequency parameter. Synced rate is not
bound: the capture contains duplicate `LFO n Tempo Div` names, and the correct
active ID needs live verification. Envelope modes and LFO waveforms use encoders
as stepped parameters. Actual effect wet controls follow the effect loaded into
each slot; this profile does not change effect or synthesis-engine types.

## Fixed controls

Faders: Macro 1, Macro 2, Macro 3, Macro 4, Engine 1 Volume, Engine 2 Volume,
Aux Return Volume, Master Volume. All use pickup.

Value feedback uses Pigments' host-formatted labels, including frequency units,
envelope times, dB and stepped-control names. Numeric updates never insert a
percentage fallback. While a new formatted label is pending, the previous label
remains visible; before the first label arrives, the value is blank. A plugin that
stops reporting formatted changes will retain its last reported label. LEDs,
parameter adjustment and fader pickup continue to follow numeric updates.
Button feedback still uses named states.

| Position | Top button | Bottom button | Shift + bottom |
| --- | --- | --- | --- |
| 1 | Filter 1 on/off | FX A1 bypass | Same |
| 2 | Filter 2 on/off | FX A2 bypass | Same |
| 3 | Engine 1 bypass | FX A3 bypass | Same |
| 4 | Engine 2 bypass | FX B1 bypass | Same |
| 5 | Utility bypass | FX B2 bypass | Same |
| 6 | FX Bus A bypass | FX B3 bypass | Same |
| 7 | FX Bus B bypass | FX AUX1 bypass | FX AUX3 bypass |
| 8 | Aux Bus bypass | FX AUX2 bypass | Global FX bypass |

Shift does not change the top buttons. A bright bypass LED means the bypass
parameter is on; the temporary screen feedback says **Bypassed** or **Active**.
Filter LEDs instead indicate filter on/off. Colors distinguish macros (amber),
filters (green), envelopes (orange), LFOs (purple), engines (blue), and FX (pink).

The profile has no always-on rules or preset MIDI commands. Selecting it does not
force modules on or off. Preset navigation can be added after verifying Pigments'
MIDI mapping and project routing independently from Iroko.

## Installation and verification

Run `python3 tools/install.py` from the repository. The installer backs up the
existing controller folder. Reload the controller in Bitwig if the script does
not reload automatically. Select Pigments' device header and unlock the cursor
if it is pinned to another device. The display should read `PIGMENTS 1/4` and
`Performance`.

`npm test` includes Pigments binding coverage, wrapped-ID feedback, bypass overlay
and button edges, fader pickup, signature rejection, and Pigments/Iroko isolation
and page memory. These tests mock the host; verify physical knobs, faders, bypass
polarity, stepped parameter behavior and audio in Bitwig after installation.
