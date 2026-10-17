# Device profiles

Keep profiles as data and pure functions. Profile code should not call the host
or send MIDI; the shared engine resolves bindings and performs the writes.

## Capture parameter IDs

1. Copy `tools/Parameter Inspector.control.js` into a separate folder under
   Bitwig's `Controller Scripts` directory.
2. Add **Local > Device Parameter Inspector** in Bitwig Settings > Controllers.
3. Select the target device header in Bitwig's chain.
4. Run `python3 tools/capture-parameters.py --device 'Device Name'`.
5. Convert the captured `parameters` list into a name-to-ID object for the profile.
6. Disable the inspector when done. Captures include local track/device names
   and are deliberately ignored by Git.

The inspector changes no device parameters and requires no MIDI ports. Capture
output is local-only; don't include the vendor plugin executable or license files.

## Contract

Call `registerLCXL3Profile({...})` from a file loaded by the entry point:

- `id`, `name`: stable internal ID and short screen title.
- `matchNames`: exact, case-insensitive device names; avoid broad substrings.
- `parameters`: `{ 'Readable Name': 'Bitwig parameter ID' }`.
- `requiredParameters`: signature names that must exist before activating.
- `pages`: named pages, each with exactly three arrays of eight binding names.
- `faders`: exactly eight names. Use an empty string for an unassigned slot.
- `buttons`: exactly sixteen names, top row followed by bottom row.
- `shiftButtons`: optional alternate sixteen names; defaults to `buttons`.
- `colors`: group name to 7-bit `[R,G,B]` values.
- `groupForName(resolvedName)`: optional pure function; defaults to `global`.
- `resolveName(name, getValue)`: optional pure binding resolver. `getValue(name)`
  reads a cached normalized value and can be undefined until observed.
- `layoutParameters`: names whose changes require resolving the layout again.
- `buttonLabels`: optional friendly labels.
- `buttonStates`: optional `{ 'Switch Name': ['Low State', 'High State'] }`.
- `alwaysOn`: optional names to keep enabled while the profile is active. This
  causes actual plugin writes and should be used deliberately.
- `preset`: optional MIDI navigation configuration: `inputName` plus a `buttons`
  object mapping button indices (0-15) to `{cc, label}` actions. Leave those slots
  empty in `buttons` and `shiftButtons`. The host creates the note inputs during
  initialization; each project must route its input to the intended plugin.

Profiles are selected by **both device name and signature IDs**. When no profile
matches, the generic Remote Controls fallback activates. Changing profiles resets
cached direct values, button edges, pending feedback and fader pickup; each custom
profile remembers its own page. Iroko-specific always-on rules and preset actions
never apply to generic mode or other profiles.

Bitwig can enumerate plugin IDs as `CONTENTS/PID...` and report live changes as
`CONTENTS/ROOT_GENERIC_MODULE/PID...`. The engine handles those aliases and avoids
showing a stale formatted value when only the normalized value updates.

## Minimal example

Replace the example name/ID with a real captured value. Then add
`load('profiles/my-device.js')` before loading `lib/controller.js` in the entry
point. Installation copies all profile files, but only explicitly loaded profiles
are registered.

```js
(function () {
    registerLCXL3Profile({
        id: 'my-device',
        name: 'MY DEVICE',
        matchNames: ['Actual Device Name'],
        parameters: { 'Cutoff': 'CAPTURED_PARAMETER_ID' },
        requiredParameters: ['Cutoff'],
        pages: [{name: 'Tone', rows: [
            ['Cutoff', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '']
        ]}],
        faders: ['', '', '', '', '', '', '', ''],
        buttons: ['', '', '', '', '', '', '', '',
                  '', '', '', '', '', '', '', ''],
        colors: {global: [0, 100, 127]}
    });
}());
```

Button parameter bindings use binary 0/1 toggles. Discrete controls with more
than two states need an additional action type before they can be bound to a
button; don't pretend an arbitrary enum is a binary toggle. Encoder bindings
adjust normalized values, so continuous and stepped host parameters both work.
