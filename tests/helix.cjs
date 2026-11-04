const assert = require('assert/strict');
const {createHarness} = require('./harness.cjs');
const h = createHarness();
const c = h.context;
assert.ok(c.HELIX_NATIVE_PARAMETERS, 'load captured Helix Native parameter IDs');
const ids = c.HELIX_NATIVE_PARAMETERS;
h.selectDevice('Helix Native', ids);
assert.equal(c.activeProfile.id, 'helix-native');
const profile = c.activeProfile;
assert.equal(ids['Snapshot Index'], 'CONTENTS/PID24');
assert.equal(Object.keys(ids).length, 35);
assert.equal(h.writes.length, 0, 'selection never writes sound settings');
assert.ok(h.callbacks.observed.includes(ids['Snapshot Index']));
function press(cc) {
    h.callbacks.midi(0xb0, cc, 127);
    h.callbacks.midi(0xb0, cc, 0);
}
function lastColor(cc) {
    const prefix = 'f000202902150153' + cc.toString(16).padStart(2, '0');
    const message = h.sysex.filter(s => s.startsWith(prefix)).at(-1);
    return message ? [...Buffer.from(message, 'hex').subarray(9, 12)] : null;
}
for (let index = 0; index < 5; index++) {
    h.callbacks.midi(0xb0, 37 + index, 127);
    h.callbacks.midi(0xb0, 37 + index, 127);
    h.callbacks.midi(0xb0, 37 + index, 0);
    assert.deepEqual(h.writes.splice(0), [['set', ids['Snapshot Index'], index, 8]]);
    assert.equal(c.normalized[ids['Snapshot Index']], index / 7);
    assert.equal(c.pendingButtonFeedback.state, ['Core', 'Pushed', 'Drive', 'Movement', 'Space'][index]);
    c.flush();
    assert.ok(lastColor(37 + index).reduce((a, b) => a + b) > lastColor(37 + (index + 1) % 5).reduce((a, b) => a + b));
}
h.callbacks.midi(0xb6, 63, 127);
press(37);
assert.deepEqual(h.writes.splice(0), [['set', ids['Snapshot Index'], 0, 8]], 'snapshot buttons also work with Shift');
h.callbacks.midi(0xb6, 63, 0);
h.callbacks.value(ids['Snapshot Index'], 2 / 7);
c.flush();
assert.ok(lastColor(39).reduce((a, b) => a + b) > lastColor(37).reduce((a, b) => a + b));
h.callbacks.value(ids['Snapshot Index'].replace('CONTENTS/', 'CONTENTS/ROOT_GENERIC_MODULE/'), 4 / 7);
c.flush();
assert.equal(c.normalized[ids['Snapshot Index']], 4 / 7);
for (const value of [NaN, 5 / 7, 6 / 7, 1]) {
    h.callbacks.value(ids['Snapshot Index'], value);
    c.flush();
    const colors = Array.from({length: 5}, (_, i) => lastColor(37 + i));
    assert.ok(colors.every(rgb => JSON.stringify(rgb) === JSON.stringify(colors[0])), 'unknown/unmapped snapshots select no button');
}
assert.equal(h.writes.length, 0, 'host snapshot feedback never writes parameters');
// Pickup must rearm on both local selection and external snapshot recall.
c.faderPicked[0] = true;
c.lastFader[0] = 64;
press(37);
assert.equal(c.faderPicked.length, 0);
h.writes.length = 0;
c.faderPicked[0] = true;
h.callbacks.value(ids['Snapshot Index'], 1 / 7);
assert.equal(c.faderPicked.length, 0);
c.faderPicked[0] = true;
h.callbacks.value(ids['Snapshot Index'], 1 / 7);
assert.equal(c.faderPicked[0], true, 'duplicate host state does not rearm pickup');
// Every encoder slot and effect toggle uses its captured host ID.
for (let i = 0; i < 16; i++) {
    const id = ids['Knob ' + String(i + 1).padStart(2, '0')];
    h.callbacks.value(id, 0.5);
    h.callbacks.midi(0xbf, 77 + i, 65);
    assert.equal(h.writes.pop()[1], id);
}
for (let i = 0; i < 5; i++) {
    const id = ids['Switch ' + String(i + 1).padStart(2, '0')];
    h.callbacks.value(id, 0);
    press(45 + i);
    assert.deepEqual(h.writes.pop(), ['set', id, 1, 2]);
}
h.callbacks.midi(0xbf, 93, 65);
press(42);
assert.equal(h.writes.length, 0, 'unused controls remain unassigned');
assert.equal(h.presetMessages.length, 0, 'Helix uses host parameters, not routed MIDI');
h.callbacks.midi(0xb6, 30, 0);
press(38);
assert.equal(h.writes.length, 0, 'custom mode blocks snapshot writes');
h.callbacks.midi(0xb6, 30, 2);
const navigator = c.navigator;
c.navigator = {onMidi: () => false, busy: () => true};
press(38);
assert.equal(h.writes.length, 0, 'handoff blocks snapshot writes');
c.navigator = navigator;
// Invalid signatures and different devices retain the safe fallback.
h.selectDevice('Helix Native', {'Knob 01': ids['Knob 01']});
assert.equal(c.activeProfile, null);
press(38);
assert.equal(h.writes.length, 0);
h.selectDevice('Unknown', ids);
assert.equal(c.activeProfile, null);
// Validate the controller slot contract without depending on sound-preset assets.
assert.equal(c.HELIX_BANK_KNOBS.length, 16);
c.HELIX_BANK_KNOBS.forEach((binding, i) => {
    assert.equal(profile.parameters[binding.name], ids['Knob ' + String(i + 1).padStart(2, '0')]);
});
assert.equal(c.HELIX_BANK_KNOBS[2].name, 'Mid / Cut');
assert.equal(profile.parameters['Mid / Cut'], ids['Knob 03']);
// Optional fixed-value actions must not hijack existing profile controls.
function actionProfile(actions) {
    return {id: 'action-test', name: 'Test', matchNames: ['Action Test'], parameters: {Select: 'test/select'},
        pages: [{name: 'Test', rows: Array.from({length: 3}, () => Array(8).fill(''))}],
        faders: Array(8).fill(''), buttons: Array(16).fill(''), buttonActions: actions};
}
for (const action of [{parameter: 'Missing', value: 0, steps: 8, label: 'A'},
    {parameter: 'Select', value: 8, steps: 8, label: 'A'},
    {parameter: 'Select', value: 0, steps: 1, label: 'A'}]) {
    assert.throws(() => c.registerLCXL3Profile(actionProfile({0: action})));
}
const synthetic = actionProfile({0: {parameter: 'Select', value: 2, steps: 4, label: 'Third'}});
assert.throws(() => c.registerLCXL3Profile(actionProfile({invalid: synthetic.buttonActions[0]})));
const overlap = {...synthetic, buttons: ['Select', ...Array(15).fill('')]};
assert.throws(() => c.registerLCXL3Profile(overlap));
c.registerLCXL3Profile(synthetic);
h.selectDevice('Action Test', synthetic.parameters);
press(37);
assert.deepEqual(h.writes.pop(), ['set', 'test/select', 2, 4], 'actions remain profile data, not Helix-specific routing');
console.log('PASS: Helix slots, fixed snapshot actions/LEDs, feedback/pickup, mode guards, toggles and action validation.');
