// Common synth controls work across presets without selecting engine or effect types.
(function () {
    registerLCXL3Profile({
        id: "pigments", name: "PIGMENTS", matchNames: ["Pigments"],
        parameters: PIGMENTS_PARAMETERS,
        valueDisplay: "plugin",
        requiredParameters: ["Macro 1", "Macro 4", "F1 Cutoff", "F2 Cutoff", "Env Amp Attack", "Engine 1 Volume"],
        pages: [
            {name: "Performance", rows: [
                ["Macro 1", "Macro 2", "Macro 3", "Macro 4", "F1 Cutoff", "F1 Resonance", "F2 Cutoff", "F2 Resonance"],
                ["Env Amp Attack", "Env Amp Decay", "Env Amp Sustain", "Env Amp Release", "Env 2 Attack", "Env 2 Decay", "Env 2 Sustain", "Env 2 Release"],
                ["Engine 1 Volume", "Engine1 Filter Mix", "Engine 2 Volume", "Engine2 Filter Mix", "F1 Volume", "F1 Pan", "F2 Volume", "F2 Pan"]
            ]},
            {name: "Envelopes", rows: [
                ["Env Amp Attack", "Env Amp Decay", "Env Amp Sustain", "Env Amp Release", "Env Amp AttackCurve", "Env Amp DecayCurve", "Env Amp ReleaseLink", "Env Amp Mode"],
                ["Env 2 Attack", "Env 2 Decay", "Env 2 Sustain", "Env 2 Release", "Env 2 AttackCurve", "Env 2 DecayCurve", "Env 2 ReleaseLink", "Env 2 Mode"],
                ["Env 3 Attack", "Env 3 Decay", "Env 3 Sustain", "Env 3 Release", "Env 3 AttackCurve", "Env 3 DecayCurve", "Env 3 ReleaseLink", "Env 3 Mode"]
            ]},
            {name: "LFOs", rows: [
                ["LFO 1 Frequency", "LFO 1 Waveform", "LFO 1 Symmetry", "LFO 1 Polarity", "LFO 1 Initial Phase", "LFO 1 Smooth", "LFO 1 KeyTrack", "LFO 1 Fade"],
                ["LFO 2 Frequency", "LFO 2 Waveform", "LFO 2 Symmetry", "LFO 2 Polarity", "LFO 2 Initial Phase", "LFO 2 Smooth", "LFO 2 KeyTrack", "LFO 2 Fade"],
                ["LFO 3 Frequency", "LFO 3 Waveform", "LFO 3 Symmetry", "LFO 3 Polarity", "LFO 3 Initial Phase", "LFO 3 Smooth", "LFO 3 KeyTrack", "LFO 3 Fade"]
            ]},
            {name: "Mixer + FX", rows: [
                ["Engine 1 Volume", "Engine 2 Volume", "Sub Osc Volume", "Noise 1 Volume", "Noise 2 Volume", "F1 Volume", "F2 Volume", "Master Volume"],
                ["FX A1 Dry/Wet", "FX A2 Dry/Wet", "FX A3 Dry/Wet", "Bus A Volume", "FX B1 Dry/Wet", "FX B2 Dry/Wet", "FX B3 Dry/Wet", "Bus B Volume"],
                ["FX AUX1 Dry/Wet", "FX AUX2 Dry/Wet", "FX AUX3 Dry/Wet", "Aux Send Volume", "Aux Return Volume", "Engine1 Filter Mix", "Engine2 Filter Mix", "Voice Pan"]
            ]}
        ],
        faders: ["Macro 1", "Macro 2", "Macro 3", "Macro 4", "Engine 1 Volume", "Engine 2 Volume", "Aux Return Volume", "Master Volume"],
        buttons: ["F1 On/Off", "F2 On/Off", "Engine 1 Bypass", "Engine 2 Bypass", "Utility Bypass", "FX Bus A Bypass", "FX Bus B Bypass", "Aux Bus Bypass", "FX A1 Bypass", "FX A2 Bypass", "FX A3 Bypass", "FX B1 Bypass", "FX B2 Bypass", "FX B3 Bypass", "FX AUX1 Bypass", "FX AUX2 Bypass"],
        shiftButtons: ["F1 On/Off", "F2 On/Off", "Engine 1 Bypass", "Engine 2 Bypass", "Utility Bypass", "FX Bus A Bypass", "FX Bus B Bypass", "Aux Bus Bypass", "FX A1 Bypass", "FX A2 Bypass", "FX A3 Bypass", "FX B1 Bypass", "FX B2 Bypass", "FX B3 Bypass", "FX AUX3 Bypass", "FX Global Bypass"],
        colors: {
            macro: [127, 80, 0], filter: [0, 127, 70], envelope: [127, 40, 0],
            lfo: [100, 0, 127], engine: [0, 90, 127], fx: [127, 25, 70], global: [100, 110, 127]
        },
        groupForName: function (name) {
            if (/^Macro /.test(name)) return "macro";
            if (/^F[12] /.test(name)) return "filter";
            if (/^Env /.test(name)) return "envelope";
            if (/^LFO /.test(name)) return "lfo";
            if (/^(Engine|Utility|Sub Osc|Noise)/.test(name)) return "engine";
            if (/^(FX |Bus |Aux )/.test(name)) return "fx";
            return "global";
        },
        // A lit bypass button means bypass is engaged, not that its module is active.
        buttonStates: {
        "FX AUX3 Bypass": [
                "Active",
                "Bypassed"
        ],
        "FX B3 Bypass": [
                "Active",
                "Bypassed"
        ],
        "FX B1 Bypass": [
                "Active",
                "Bypassed"
        ],
        "Aux Bus Bypass": [
                "Active",
                "Bypassed"
        ],
        "FX B2 Bypass": [
                "Active",
                "Bypassed"
        ],
        "Utility Bypass": [
                "Active",
                "Bypassed"
        ],
        "FX Bus B Bypass": [
                "Active",
                "Bypassed"
        ],
        "FX A3 Bypass": [
                "Active",
                "Bypassed"
        ],
        "FX AUX2 Bypass": [
                "Active",
                "Bypassed"
        ],
        "FX A1 Bypass": [
                "Active",
                "Bypassed"
        ],
        "FX Global Bypass": [
                "Active",
                "Bypassed"
        ],
        "Engine 1 Bypass": [
                "Active",
                "Bypassed"
        ],
        "FX AUX1 Bypass": [
                "Active",
                "Bypassed"
        ],
        "FX Bus A Bypass": [
                "Active",
                "Bypassed"
        ],
        "FX A2 Bypass": [
                "Active",
                "Bypassed"
        ],
        "Engine 2 Bypass": [
                "Active",
                "Bypassed"
        ]
}
    });
}());
