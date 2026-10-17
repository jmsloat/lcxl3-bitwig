# LCXL3 Device Profiles for Bitwig

A Novation Launch Control XL 3 controller script that follows the selected Bitwig
device, loads a preprogrammed profile when available, and falls back to Bitwig's
Remote Controls for everything else. Written against Bitwig Studio 6.1.3 / API 18.

The first custom profile is PolyChrome DSP Iroko. It preserves the guitar-effects
layout, grouped colors, value brightness, button feedback, and fader pickup.

## Install

Run from this checkout:

```sh
python3 tools/install.py
```

By default, this installs into
`~/Bitwig Studio/Controller Scripts/LCXL3 Effects/` and backs up an existing copy
outside Bitwig's scanned controller directory. You can supply `--destination` for
a different controller folder.

In Bitwig Settings > Controllers, add **Local > LCXL3 Device Profiles**. Select the
LCXL3 **DAW** input and output; do not use the general MIDI or DIN ports. Depending
on the platform, these may be labeled `LCXL3 1 DAW Out` (input) and
`LCXL3 1 DAW In` (output). Disable other controller entries using those same ports.

Upgrading the original Iroko script retains its controller UUID and cursor IDs,
so existing port assignments and the **Iroko Presets** input remain compatible.
The installer removes the old `LCXL3 Iroko.control.js` entry after backing it up,
avoiding two scripts with the same identity.

## Shared controls

- **Select a device header in Bitwig's device chain** to follow it. A floating
  plugin window does not necessarily change Bitwig's selection.
- **Page up/down:** change the active profile's pages, or Bitwig's Remote Controls
  pages in generic mode.
- **Shift + encoder:** fine adjustment.
- **Solo/Arm side button:** lock/unlock the selected device using Bitwig's pinned
  cursor. A green side LED and `LOCK` on the screen indicate a lock. Unlock to
  resume following device selection.

For a device without a matching profile, only the **top row of eight encoders**
controls its current Bitwig Remote Controls page. Faders, other knob rows, and
pedal/preset buttons are unassigned in generic mode. Generic mode never runs
Iroko's MIDI commands or always-on section rules.

Knob LEDs show parameter positions with a 3%-60% RGB intensity range and a
power-1.5 curve. Button LEDs use 15% when off and 100% when on. Settings are in
[`lib/settings.js`](lib/settings.js); effect hues belong to the device profile.
Faders use pickup to avoid jumps after device changes or external edits.

## Iroko profile

The profile matches the device name **Iroko** and a known parameter-ID signature.
Its top knob row follows the selected Clean/Crunch amp on the first page.

| Page | Top knob row | Middle knob row | Bottom knob row |
|---|---|---|---|
| Amp + FX | Gain, Bass, Mid, Treble, Presence, Sparkle, Push, Volume | Drive Gain, Tone, Level; Comp Amount, Tone, Mix; MultiMod Speed, Mod | Delay Time, Feedback, Character, Modulation; Reverb Time, Pre Delay, Diffusion, Hi Cut |
| Pre FX | Tremolo Rate, Depth, Ramp; Comp Amount, Gain, Tone, Mix; KillGate Threshold | Fuzz Sustain, Tone, Volume; Drive Gain, Tone, Mids, Level; Kebamp Drive | Kebamp Bass, Mid, Treble, Level; MultiMod Speed, Mod, Feedback, Mix |
| Space + EQ | Delay Time, Feedback, Character, Modulation, Ducking, Low Cut, Hi Cut, Width | Reverb Time, Pre Delay, Width, Diffusion, Low Cut, Mid, Hi Cut, Mix | Shape EQ 65 Hz, 125 Hz, 250 Hz, 500 Hz, 1 kHz, 2 kHz, 3 kHz, 6 kHz |

Faders, left to right: **Drive Level, Comp Mix, MultiMod Mix, Spring Amount,
Delay Mix, Reverb Mix, Gate, Global Output**.

| Position | Top row | Bottom row | Shift + bottom row |
|---|---|---|---|
| 1 | Drive | Fuzz | Fuzz |
| 2 | Compressor | Kebamp | Kebamp |
| 3 | MultiMod | Spring | Spring |
| 4 | Tremolo | Delay | Delay |
| 5 | Vibes | Reverb | Reverb |
| 6 | KillGate | Clean/Crunch | Clean/Crunch |
| 7 | Previous preset | Boost | Bright |
| 8 | Next preset | Reverb Hold | Tight |

Pedal buttons toggle on/off. The top row stays the same with Shift. There are no
wah bindings. While Iroko is selected (or locked) and the surface is in DAW mode,
the script keeps **Amp, Pre FX, Distortion, Cab, EQ, and Post FX** enabled,
including after preset changes. Individual pedals remain independently switchable.

The brighter colors are interpretations of Iroko's UI: amp amber, Drive green,
MultiMod teal, Tremolo cyan, Vibes blue, Spring orange, Delay pale blue, Reverb
coral, Kebamp purple, and cool/neutral tones for Comp, Fuzz, EQ and KillGate.

### Iroko preset switching

The preset buttons emit MIDI commands through the dedicated **Iroko Presets**
note input. They do not browse or load Bitwig device presets.

1. Add an empty instrument track named **Iroko Preset Control**. Set its input to
   **Iroko Presets**, listen on all channels, and enable input monitoring.
2. On the guitar track, insert **Note Receiver** immediately before Iroko and
   receive from the **Iroko Preset Control** track.
3. In Iroko's MIDI settings, save the current MIDI map if needed, then load
   [`midi/LCXL3 Presets.midimap`](midi/LCXL3%20Presets.midimap).
4. Select Iroko's device header again and try the two preset buttons.

The map contains CC Command entries for previous/next (CC 43/44, channel 1), based
on the existing Iroko v1.1 map. Alternatively, merge those entries into your map
via Iroko's MIDI settings. A press shows **MIDI command sent**, not a confirmed
preset name. The current API does not expose Iroko's internal preset name or a
navigation acknowledgment. Plugin routing, MIDI channel, and actual previous/next
behavior require a live check in your project.

## Add a profile

See [`docs/PROFILES.md`](docs/PROFILES.md) for the profile contract, parameter
capture workflow, and a minimal example. Add a profile and its `load()` call to
the entry point; the shared engine does not need plugin-specific edits.

- `lib/controller.js`: selection, profile lifecycle, bindings, pickup and feedback
- `lib/hardware.js`: LCXL3 DAW MIDI/SysEx and cached RGB output
- `lib/generic.js`: Bitwig Remote Controls fallback
- `lib/profile-registry.js`: registration, validation and matching
- `profiles/iroko.js`: Iroko behavior and layout
- `profiles/iroko-parameters.js`: the 196 captured Iroko automation IDs

## Development and verification

Node.js 18+ is used only for tests; there are no npm dependencies. Python 3.8+ is
used for installation and optional parameter capture.

```sh
npm test
```

The suite checks Iroko's established behavior, wrapped parameter-ID feedback,
RGB brightness, button overlays, preset-message edges, fader pickup, independent
profile switching, signature matching, generic remotes/page bounds, cursor lock,
and isolation of profile-specific writes. Bitwig globals are mocked in tests;
hardware and live API checks are separate.

Runtime diagnostics are off by default. Set `diagnostics: true` in
`lib/settings.js` before installation to export state to `127.0.0.1:19674`.
The optional inspector exports parameter names/IDs to `127.0.0.1:19673` only while
manually enabled. Local captures and logs are excluded from Git.

## References

- [Novation LCXL3 DAW protocol](https://userguides.novationmusic.com/hc/en-gb/articles/27840466544402-Launch-Control-XL-3-programmer-s-DAW-mode)
- [Novation feature controls](https://userguides.novationmusic.com/hc/en-gb/articles/27840466607890-Launch-Control-XL-3-feature-Controls)
- [Bitwig controller scripting](https://www.bitwig.com/support/technical_support/how-do-i-add-a-controller-extension-or-script-17/)
- Bitwig's installed controller API documentation, Dashboard > Help > Documentation
