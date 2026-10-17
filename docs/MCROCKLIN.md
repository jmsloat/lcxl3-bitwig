# McRocklin Suite profile

The profile uses 125 parameter IDs captured from the selected `McRocklin Suite`
instance through Bitwig API 18. Readable names expand abbreviations such as `Att`
to `Attacker`; parameter IDs remain unchanged. No track or project information is
included. The capture does not report the plugin version/format, so compatibility
with other releases must be checked against their parameter signatures.

Matching requires the exact case-insensitive device name and six signature IDs.
The profile uses plugin-formatted values, including units, rather than switching
to normalized percentages between formatted callbacks. It participates in the
shared cached Track-button navigation alongside Iroko and Pigments.

## Encoder pages

Each row runs left to right. Page buttons change the encoder assignments. Shift
provides fine adjustment. Faders and buttons retain their assignments across pages.

| Page | Top row | Middle row | Bottom row |
| --- | --- | --- | --- |
| Amp + FX | Amp Select; selected amp Gain, Bass, Mid, Treble, Character, Master; Global Output | Attacker Drive, Level; Shredder Dist, Tone; Riffer Drive, Tone; Viber Drive, Level | Delay Time, Feedback, Mix; Reverb Time, Pre Delay, Hi Cut, Mix; Widener |
| Pre FX | Heatpressor Compress, Level, Boost, Warmth, Chain, Tight, Bright; Synth Oct Env | Wah Position, Bite, Auto, Sensitivity; Synth Oct Mix; Phaser Speed, Amount, Wide | Attacker Attack, Drive, Bright, Level; Shredder Dist, Tone, Level; Phaser Sync |
| Drives | Attacker Attack, Drive, Bright, Level; Shredder Dist, Tone, Level; Global Input | Riffer Drive, Tone, Level; Viber Drive, Bass, Mid, Treble, Level | Amp Select; selected amp Gain, Bass, Mid, Treble, Character, Master; Gate |
| Space | Delay Model, Sync, Time, Feedback, Ducking, Extra, Low Cut, Hi Cut | Reverb Model, Time, Pre Delay, Diffusion, Modulation, Mid Bloom, Low Cut, Hi Cut | Delay Mix, Reverb Mix, Reverb Swampy, Chorus Amount, Compressor Amount, Widener, Gate, Global Output |
| EQ + Cab | Parametric EQ Low Freq/Gain, Mid Freq/Gain 1, Mid Freq/Gain 2, High Freq/High | Graphic EQ Bands 1–8 | EQ Mode, In, Out; Speaker Resonance, Air, Low Cut, Hi Cut; selected amp speaker/profile |

Amp Select is an encoder, not a binary button. Dynamic bindings use the four-state
order Acoustic, Clean, Edge, Gain, normalized as 0, 1/3, 2/3, 1. Their host keys
are AC, CA, CB and GA in the captured parameter list. Character means Acoustic
Profile, Clean Presence, Edge Boost or Gain Presence. On EQ + Cab, the final knob
selects Clean/Edge/Gain speakers; Acoustic uses Acoustic Profile because no
Acoustic speaker selector is exposed. Dynamic slots remain unassigned until the
host reports the amp selector. Verify all four states against the plugin UI when
using a different plugin release; automated tests exercise this state ordering.

Amp Select, Acoustic Profile, Delay Model, Reverb Model and EQ Mode use known
state counts so each encoder detent moves one state, including with Shift. Other
chain/speaker selectors use normalized encoder adjustment; verify their stepping
with the installed plugin.
The plugin determines which controls apply in each effect model. Synced delay or
phaser rates may behave differently from free time/rate; native labels report what
the plugin supplies. Knobs retain explicit captured names such as Delay Extra.

## Fixed controls

Faders: Attacker Level, Shredder Level, Riffer Level, Viber Level, Delay Mix,
Reverb Mix, Gate, Global Output. All use pickup.

| Position | Top button | Bottom button | Shift + bottom |
| --- | --- | --- | --- |
| 1 | Attacker | Delay | Delay |
| 2 | Shredder | Reverb | Reverb |
| 3 | Riffer | Chorus | Chorus |
| 4 | Viber | Compressor | Compressor |
| 5 | Heatpressor | EQ | EQ |
| 6 | Synth Octaver | Speakers | Speakers |
| 7 | Phaser | Delay Sync | Reverb Swampy |
| 8 | Wah | Phaser Wide | Phaser Sync |

Shift leaves the top row unchanged. Buttons toggle binary parameters; bright LEDs
mean on. Group colors distinguish amps, the four drives, pre effects and space
controls. No always-on rules or preset MIDI commands are enabled. Selecting the
profile does not force effects or speaker processing on.

## Installation and checks

Run `python3 tools/install.py`; the installer backs up the existing controller.
Select McRocklin Suite's device header in Bitwig. The display should identify
`MCROCKLIN 1/5` and `Amp + FX` on first use, with the track name above it. If locked
to another plugin, unlock or use Track navigation. Shift + Track forces a fresh
navigation scan after adding/moving plugins.

`npm test` verifies every encoder slot in all four amp states, dynamic display
subscriptions, native units, both button layers, button edges, pickup, profile
isolation, signature rejection, page memory and cached navigation through all
three real profiles. These use a mocked host; physical feedback, audio and the
four amp positions still require normal hands-on verification.

Reference: [PolyChrome DSP's McRocklin Suite overview](https://www.polychromedsp.com/mcrocklin-suite/).
