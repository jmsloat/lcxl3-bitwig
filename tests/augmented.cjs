const assert = require('assert/strict');
const {createHarness} = require('./harness.cjs');
const h = createHarness(), c = h.context, cb = h.callbacks;
const profile = c.LCXL3_PROFILES.find(p => p.id === 'augmented');
assert.ok(profile, 'shared Augmented profile is registered by the entry point');
assert.equal(profile.name, 'AUGMENTED');
const params = c.AUGMENTED_PARAMETERS;
const instruments = ['Augmented GRAND PIANO', 'Augmented STRINGS', 'Augmented MALLETS',
    'Augmented VOICES', 'Augmented YANGTZE', 'Augmented WOODWINDS', 'Augmented BRASS'];
for (const name of instruments) {
    h.selectDevice(name.toLowerCase(), params);
    assert.equal(c.activeProfile && c.activeProfile.id, profile.id, 'shared profile recognizes ' + name);
    assert.equal(h.writes.length, 0, 'selecting ' + name + ' does not change its sound');
    cb.value(params.Color, 0.5); cb.midi(0xbf, 77, 65);
    assert.equal(h.writes.pop()[1], params.Color, name + ' uses the shared Color mapping');
}
const macros = ['Morph', 'Color', 'Time', 'Motion', 'FX A', 'FX B', 'Delay', 'Reverb'];
macros.forEach((name, i) => assert.equal(params[name], 'CONTENTS/PID' + (i + 1).toString(16)));
for (const [name, id] of Object.entries({
    'Master Volume': '0', 'Sampler 1 Volume': '9', 'Sampler 2 Volume': '1a',
    'Synth 1 Volume': '2b', 'Synth 2 Volume': '52', 'Layer A Volume': '79',
    'Layer B Volume': '135', 'Layer A Filter Cutoff': '7b', 'Layer B Filter Cutoff': '137',
    'Master Delay Dry/Wet': '1f2', 'Master Reverb Dry/Wet': '20c',
    'Arpeggiator On': '23f', 'FX Section On/Off': '2b4'
})) assert.equal(params[name], 'CONTENTS/PID' + id, 'live captured ID for ' + name);
assert.deepEqual(Array.from(profile.pages[0].rows[0]), [...macros.slice(1), '']);
assert.deepEqual(Array.from(profile.faders), ['Sampler 1 Volume', 'Sampler 2 Volume',
    'Synth 1 Volume', 'Synth 2 Volume', 'Layer A Volume', 'Layer B Volume', 'Morph', 'Master Volume']);
for (const name of [...profile.faders, ...profile.buttons,
    ...profile.pages.flatMap(p => p.rows.flat())].filter(Boolean)) {
    assert.ok(params[name], 'captured ID required for ' + name);
    assert.doesNotMatch(name, /UNUSED|REMOVED/);
}
h.selectDevice('aUgMeNtEd GRAND PIANO', params);
assert.equal(c.activeProfile.id, profile.id);
assert.equal(h.writes.length, 0, 'recognition must not enable sources or modify the preset');
// Every encoder page writes the captured parameter through the public MIDI interface.
for (let page = 0; page < profile.pages.length; page++) {
    if (page) { cb.midi(0xb0, 107, 127); cb.midi(0xb0, 107, 0); }
    c.flush(); assert.equal(c.page, page, 'Page up selects the next profile page');
    for (let i = 0; i < 24; i++) {
        const name = profile.pages[page].rows[Math.floor(i / 8)][i % 8], id = params[name];
        if (!name) {
            const before = h.writes.length;
            cb.midi(0xbf, 77 + i, 65);
            assert.equal(h.writes.length, before, 'unassigned encoder is inert');
            continue;
        }
        cb.value(id.replace('CONTENTS/', 'CONTENTS/ROOT_GENERIC_MODULE/'), 0.5);
        cb.midi(0xbf, 77 + i, 65);
        const write = h.writes.pop();
        assert.equal(write[1], id, `${page}:${i} targets ${name}`);
        assert.ok(write[2] > 8192, 'clockwise encoder movement increases its value');
    }
}
// Fine adjustment and native units remain available on the macro page.
for (let i = 0; i < 3; i++) { cb.midi(0xb0, 106, 127); cb.midi(0xb0, 106, 0); }
c.flush(); assert.equal(c.page, 0, 'Page down stops at the first page');
const color = params.Color;
cb.value(color, 0.5); cb.midi(0xbf, 77, 65);
const coarse = h.writes.pop()[2];
cb.value(color, 0.5); cb.midi(0xb6, 63, 127); cb.midi(0xbf, 77, 65);
assert.ok(h.writes.pop()[2] < coarse, 'Shift reduces encoder increments');
cb.midi(0xb6, 63, 0);
cb.display(params['Layer A Filter Cutoff'], '125 Hz');
assert.equal(c.parameterText(params['Layer A Filter Cutoff']), '125 Hz');
cb.value(params['Layer A Filter Cutoff'], 0.7);
assert.equal(c.parameterText(params['Layer A Filter Cutoff']), '125 Hz', 'hold native units until feedback arrives');
// All eight faders require pickup and rearm after host changes.
for (let i = 0; i < 8; i++) {
    h.writes.length = 0; c.resetPickup();
    const id = params[profile.faders[i]];
    cb.value(id, 0.8); cb.midi(0xbf, 5 + i, 0);
    assert.equal(h.writes.length, 0, 'fader waits for pickup');
    cb.midi(0xbf, 5 + i, 102);
    assert.equal(h.writes.pop()[1], id);
    cb.value(id, 0.2); cb.midi(0xbf, 5 + i, 110);
    assert.equal(h.writes.length, 0, 'external edits rearm pickup');
}
// Each button toggles once per press, in either Shift layer, with truthful bypass text.
for (const shifted of [false, true]) {
    cb.midi(0xb6, 63, shifted ? 127 : 0);
    for (let i = 0; i < 16; i++) {
        h.writes.length = 0;
        const name = profile.buttons[i], id = params[name];
        if (name) cb.value(id, 0);
        cb.midi(0xb0, 37 + i, 127);
        if (name) {
            assert.deepEqual(h.writes.pop(), ['set', id, 1, 2]);
            if (/Bypass$/.test(name)) assert.equal(c.pendingButtonFeedback.state, 'Bypassed');
        } else assert.equal(h.writes.length, 0, 'unused button is inert');
        cb.midi(0xb0, 37 + i, 127);
        assert.equal(h.writes.length, 0, 'holding a button must not retrigger it');
        cb.midi(0xb0, 37 + i, 0);
    }
}
cb.midi(0xb6, 63, 0);
assert.equal(h.presetMessages.length, 0, 'no guessed preset MIDI commands');
// Custom mode suppresses writes; selecting this profile never invokes Iroko rules.
h.writes.length = 0; c.surfaceActive = false;
cb.midi(0xbf, 77, 65); cb.midi(0xb0, 37, 127); cb.midi(0xb0, 37, 0);
assert.equal(h.writes.length, 0);
c.surfaceActive = true;
for (let i = 0; i < 3; i++) { cb.midi(0xb0, 107, 127); cb.midi(0xb0, 107, 0); }
c.flush(); assert.equal(c.page, 2, 'Page up stops at the last page');
h.selectDevice('Iroko', c.IROKO_PARAMETERS);
h.writes.length = 0;
h.selectDevice('Augmented GRAND PIANO', params);
assert.equal(c.page, 2, 'Augmented page memory survives a profile round trip');
h.selectDevice('Augmented STRINGS', params);
assert.equal(c.activeProfile.id, profile.id);
assert.equal(c.page, 2, 'the family shares page memory between instruments');
assert.equal(h.writes.length, 0);
cb.value(c.IROKO_PARAMETERS['Amp Power'], 0); c.flush();
assert.equal(h.writes.length, 0, 'Iroko always-on rules do not apply');
const incomplete = {...params}; delete incomplete.Morph;
h.selectDevice('Augmented GRAND PIANO', incomplete);
assert.equal(c.activeProfile, null, 'incomplete signatures use generic remotes');
h.selectDevice('Augmented UNKNOWN', params);
assert.equal(c.activeProfile, null, 'unverified names do not activate the shared profile');
// The new profile also participates in existing track-first discovery.
const n = createHarness(), nc = n.context;
const piano = n.plugin('Augmented GRAND PIANO', Object.values(nc.AUGMENTED_PARAMETERS));
const iroko = n.plugin('Iroko', Object.values(nc.IROKO_PARAMETERS));
n.setProject([{name: 'Guitar', devices: [iroko]}, {name: 'Piano', devices: [piano]}]);
n.callbacks.midi(0xb0, 102, 127); n.callbacks.midi(0xb0, 102, 0); n.drain();
assert.equal(n.target, piano);
assert.equal(nc.activeProfile.id, profile.id);
assert.equal(n.writes.length, 0, 'navigation does not alter the destination sound');
console.log('PASS: seven Augmented instruments share captured controls, pages/faders/buttons, native units, pickup, Shift, guards, isolation, signatures, page memory and track navigation.');
