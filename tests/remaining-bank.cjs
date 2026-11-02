const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const folder = path.join(__dirname, '..', 'presets', 'helix-native');
const source = JSON.parse(fs.readFileSync(path.join(folder, '07 Vox Chime Dynamic Plate.hlx')));
const cases = [
  {
    "name": "01 Twin Clean",
    "model": "HD2_AmpUSDoubleNrm",
    "cab": "HD2_CabMicIr_2x12DoubleC12N",
    "cabName": "2x12 Double C12N",
    "gain": "Drive",
    "core": 0.28,
    "pushed": 0.45,
    "amp": {
      "Drive": 0.28,
      "Bass": 0.4,
      "Mid": 0.5,
      "Treble": 0.55,
      "Presence": 0.1,
      "ChVol": 0.8,
      "Master": 1.0,
      "Sag": 0.5,
      "Hum": 0.5,
      "Ripple": 0.5,
      "Bias": 0.6,
      "BiasX": 0.5,
      "@enabled": true,
      "@bypassvolume": 1.0
    },
    "cabParams": {
      "Mic": 0,
      "Position": 0.3,
      "Distance": 1,
      "Angle": 0,
      "LowCut": 80,
      "HighCut": 8000,
      "Level": 0,
      "@enabled": true
    },
    "slots": [
      "Drive",
      "Bass",
      "Mid",
      "Treble",
      "Presence",
      "Master",
      "ChVol"
    ]
  },
  {
    "name": "03 Jazz Clean",
    "model": "HD2_AmpJazzRivet120",
    "cab": "HD2_CabMicIr_2x12JazzRivet",
    "cabName": "2x12 Jazz Rivet",
    "gain": "Drive",
    "core": 0.28,
    "pushed": 0.45,
    "amp": {
      "Drive": 0.28,
      "Bass": 0.45,
      "Mid": 0.4,
      "Treble": 0.5,
      "Presence": 0.3,
      "ChVol": 0.75,
      "Master": 1.0,
      "Bright": 0.0,
      "@enabled": true,
      "@bypassvolume": 1.0
    },
    "cabParams": {
      "Mic": 0,
      "Position": 0.3,
      "Distance": 1,
      "Angle": 0,
      "LowCut": 80,
      "HighCut": 8000,
      "Level": 0,
      "@enabled": true
    },
    "slots": [
      "Drive",
      "Bass",
      "Mid",
      "Treble",
      "Presence",
      "Master",
      "ChVol"
    ]
  },
  {
    "name": "05 Hiwatt Clean",
    "model": "HD2_AmpWhoWatt100",
    "cab": "HD2_CabMicIr_4x12WhoWatt100",
    "cabName": "4x12 WhoWatt 100",
    "gain": "Drive",
    "core": 0.3,
    "pushed": 0.48,
    "amp": {
      "Drive": 0.3,
      "Bass": 0.45,
      "Mid": 0.5,
      "Treble": 0.5,
      "Presence": 0.3,
      "ChVol": 0.75,
      "Master": 0.6,
      "Sag": 0.5,
      "Hum": 0.5,
      "Ripple": 0.5,
      "Bias": 0.7,
      "BiasX": 0.5,
      "@enabled": true,
      "@bypassvolume": 1.0
    },
    "cabParams": {
      "Mic": 0,
      "Position": 0.3,
      "Distance": 1,
      "Angle": 0,
      "LowCut": 80,
      "HighCut": 8000,
      "Level": 0,
      "@enabled": true
    },
    "slots": [
      "Drive",
      "Bass",
      "Mid",
      "Treble",
      "Presence",
      "Master",
      "ChVol"
    ]
  },
  {
    "name": "06 Deluxe Edge",
    "model": "HD2_AmpUSDeluxeNrm",
    "cab": "HD2_CabMicIr_1x12USDeluxe",
    "cabName": "1x12 US Deluxe",
    "gain": "Drive",
    "core": 0.38,
    "pushed": 0.55,
    "amp": {
      "Drive": 0.38,
      "Bass": 0.35,
      "Mid": 0.5,
      "Treble": 0.55,
      "Presence": 0.0,
      "ChVol": 0.8,
      "Master": 1.0,
      "Sag": 0.5,
      "Hum": 0.5,
      "Ripple": 0.5,
      "Bias": 0.5,
      "BiasX": 0.5,
      "@enabled": true,
      "@bypassvolume": 1.0
    },
    "cabParams": {
      "Mic": 0,
      "Position": 0.3,
      "Distance": 1,
      "Angle": 0,
      "LowCut": 80,
      "HighCut": 8000,
      "Level": 0,
      "@enabled": true
    },
    "slots": [
      "Drive",
      "Bass",
      "Mid",
      "Treble",
      "Presence",
      "Master",
      "ChVol"
    ]
  },
  {
    "name": "10 Divided Edge",
    "model": "HD2_AmpDividedDuo",
    "cab": "HD2_CabMicIr_1x12OpenCream",
    "cabName": "1x12 Open Cream",
    "gain": "Drive 1",
    "core": 0.32,
    "pushed": 0.48,
    "amp": {
      "Drive 1": 0.32,
      "Drive 2": 0.22,
      "Tone": 0.5,
      "Cut": 0.5,
      "Presence": 0.06,
      "ChVol": 0.7,
      "Master": 0.8,
      "Sag": 0.67,
      "Hum": 0.5,
      "Ripple": 0.5,
      "Bias": 0.6,
      "BiasX": 0.5,
      "@enabled": true,
      "@bypassvolume": 1.0
    },
    "cabParams": {
      "Mic": 0,
      "Position": 0.3,
      "Distance": 1,
      "Angle": 0,
      "LowCut": 80,
      "HighCut": 8000,
      "Level": 0,
      "@enabled": true
    },
    "slots": [
      "Drive 1",
      "Drive 2",
      "Cut",
      "Tone",
      "Presence",
      "Master",
      "ChVol"
    ]
  },
  {
    "name": "11 J45 Edge",
    "model": "HD2_AmpBritJ45Brt",
    "cab": "HD2_CabMicIr_4x12Greenback20",
    "cabName": "4x12 Greenback20",
    "gain": "Drive",
    "core": 0.35,
    "pushed": 0.52,
    "amp": {
      "Drive": 0.35,
      "Bass": 0.35,
      "Mid": 0.65,
      "Treble": 0.55,
      "Presence": 0.4,
      "ChVol": 0.7,
      "Master": 1.0,
      "Sag": 0.5,
      "Hum": 0.5,
      "Ripple": 0.5,
      "Bias": 0.7,
      "BiasX": 0.5,
      "@enabled": true,
      "@bypassvolume": 1.0
    },
    "cabParams": {
      "Mic": 0,
      "Position": 0.3,
      "Distance": 1,
      "Angle": 0,
      "LowCut": 80,
      "HighCut": 8000,
      "Level": 0,
      "@enabled": true
    },
    "slots": [
      "Drive",
      "Bass",
      "Mid",
      "Treble",
      "Presence",
      "Master",
      "ChVol"
    ]
  },
  {
    "name": "13 Litigator Edge",
    "model": "HD2_AmpLine6Litigator",
    "cab": "HD2_CabMicIr_1x12USDeluxe",
    "cabName": "1x12 US Deluxe",
    "gain": "Drive",
    "core": 0.35,
    "pushed": 0.52,
    "amp": {
      "Drive": 0.35,
      "Bass": 0.4,
      "Mid": 0.55,
      "Treble": 0.5,
      "Presence": 0.0,
      "ChVol": 0.75,
      "Master": 0.5,
      "Sag": 0.5,
      "Hum": 0.5,
      "Ripple": 0.375,
      "Bias": 0.5,
      "BiasX": 0.5,
      "@enabled": true,
      "@bypassvolume": 1.0
    },
    "cabParams": {
      "Mic": 0,
      "Position": 0.3,
      "Distance": 1,
      "Angle": 0,
      "LowCut": 80,
      "HighCut": 8000,
      "Level": 0,
      "@enabled": true
    },
    "slots": [
      "Drive",
      "Bass",
      "Mid",
      "Treble",
      "Presence",
      "Master",
      "ChVol"
    ]
  },
  {
    "name": "14 Hot Rod Rock",
    "model": "HD2_AmpPlacaterDirty",
    "cab": "HD2_CabMicIr_4x12Greenback25",
    "cabName": "4x12 Greenback 25",
    "gain": "Drive",
    "core": 0.48,
    "pushed": 0.65,
    "amp": {
      "Drive": 0.48,
      "Bass": 0.4,
      "Mid": 0.55,
      "Treble": 0.55,
      "Presence": 0.4,
      "ChVol": 0.65,
      "Master": 0.52,
      "Sag": 0.5,
      "HBE": false,
      "Fat": true,
      "C45": true,
      "Saturation": false,
      "Ripple": 0.5,
      "Bias": 0.5,
      "BiasX": 0.5,
      "SSwitch": 2,
      "Voice": false,
      "@enabled": true,
      "@bypassvolume": 1.0
    },
    "cabParams": {
      "Mic": 0,
      "Position": 0.3,
      "Distance": 1,
      "Angle": 0,
      "LowCut": 80,
      "HighCut": 8000,
      "Level": 0,
      "@enabled": true
    },
    "slots": [
      "Drive",
      "Bass",
      "Mid",
      "Treble",
      "Presence",
      "Master",
      "ChVol"
    ]
  },
  {
    "name": "15 Boogie Lead",
    "model": "HD2_AmpCaliIVLead",
    "cab": "HD2_CabMicIr_4x12CaliV30",
    "cabName": "4x12 Cali V30",
    "gain": "LeadDrive",
    "core": 0.55,
    "pushed": 0.7,
    "amp": {
      "LeadGain": 0.7,
      "LeadDrive": 0.55,
      "Bass": 0.18,
      "Mid": 0.45,
      "Treble": 0.7,
      "ChVol": 0.65,
      "Presence": 0.35,
      "Master": 0.5,
      "Sag": 0.15,
      "Ripple": 0.5,
      "Bias": 0.5,
      "BiasX": 0.5,
      "80Hz": 0.0,
      "240Hz": -0.9,
      "750Hz": -2.9,
      "2200Hz": -1.3,
      "6600Hz": 0.0,
      "@enabled": true,
      "@bypassvolume": 1.0
    },
    "cabParams": {
      "Mic": 0,
      "Position": 0.3,
      "Distance": 1,
      "Angle": 0,
      "LowCut": 80,
      "HighCut": 8000,
      "Level": 0,
      "@enabled": true
    },
    "slots": [
      "LeadDrive",
      "Bass",
      "Mid",
      "Treble",
      "Presence",
      "Master",
      "ChVol"
    ]
  },
  {
    "name": "16 Heavy Rhythm",
    "model": "HD2_AmpPVPanama",
    "cab": "HD2_CabMicIr_4x12CaliV30",
    "cabName": "4x12 Cali V30",
    "gain": "Drive",
    "core": 0.45,
    "pushed": 0.6,
    "amp": {
      "Drive": 0.45,
      "Bass": 0.45,
      "Mid": 0.55,
      "Treble": 0.4,
      "Presence": 0.35,
      "ChVol": 0.65,
      "Master": 0.46,
      "Sag": 0.4,
      "Hum": 0.5,
      "Ripple": 0.5,
      "Bias": 0.39,
      "BiasX": 0.5,
      "Resonance": 0.49,
      "@enabled": true,
      "@bypassvolume": 1.0
    },
    "cabParams": {
      "Mic": 0,
      "Position": 0.3,
      "Distance": 1,
      "Angle": 0,
      "LowCut": 80,
      "HighCut": 8000,
      "Level": 0,
      "@enabled": true
    },
    "slots": [
      "Drive",
      "Bass",
      "Mid",
      "Treble",
      "Presence",
      "Master",
      "ChVol"
    ]
  }
];
for (const c of cases) {
    const p = JSON.parse(fs.readFileSync(path.join(folder, c.name + '.hlx')));
    const t = p.data.tone, s = source.data.tone;
    assert.equal(p.data.meta.name, c.name === '13 Litigator Edge' ? '13 Litigator' : c.name);
    assert.ok(p.data.meta.name.length <= 16);
    assert.deepEqual(t.dsp0.block2, {...Object.fromEntries(Object.entries(s.dsp0.block2).filter(([k]) => k.startsWith('@'))), ...c.amp, '@model': c.model});
    assert.deepEqual(t.dsp0.cab0, {...c.cabParams, '@model': c.cab});
    assert.deepEqual(t.controller.dsp0.block2, {[c.gain]: s.controller.dsp0.block2.Drive});
    for (let i = 0; i < 7; i++) {
        assert.deepEqual(t.automation['@assignments'][i], {...s.automation['@assignments'][i], '@param': 'dsp0.block2.' + c.slots[i]});
    }
    for (let i = 0; i < 8; i++) {
        const expected = structuredClone(s['snapshot' + i]);
        if (i < 5) {
            const ctrl = expected.controllers.dsp0.block2;
            const value = {...ctrl.Drive, '@value': i === 1 ? c.pushed : c.core};
            delete ctrl.Drive; ctrl[c.gain] = value;
        }
        assert.deepEqual(t['snapshot' + i], expected, c.name + ' snapshot ' + i);
    }
    for (const a of t.automation['@assignments'].filter(Boolean)) {
        const value = a['@param'].split('.').reduce((o, k) => o[k], t);
        assert.notEqual(value, undefined);
        assert.ok(value >= a['@min'] && value <= a['@max']);
    }
    t.dsp0.block2 = s.dsp0.block2; t.dsp0.cab0 = s.dsp0.cab0;
    t.controller.dsp0.block2 = s.controller.dsp0.block2;
    for (let i = 0; i < 7; i++) t.automation['@assignments'][i] = s.automation['@assignments'][i];
    for (let i = 0; i < 5; i++) t['snapshot' + i] = s['snapshot' + i];
    p.data.meta = source.data.meta;
    assert.deepEqual(p, source, c.name + ': unchanged shared effects, routing, output and remaining controls');
}
console.log('PASS: ten remaining amps, exact model schemas, cab pairs, five snapshots, controller paths and shared bank preservation.');
