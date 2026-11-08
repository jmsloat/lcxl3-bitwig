// Shared layout for seven Augmented instruments with identical captured host IDs.
(function () {
    registerLCXL3Profile({
        id: "augmented", name: "AUGMENTED",
        matchNames: ["Augmented GRAND PIANO", "Augmented STRINGS", "Augmented MALLETS",
            "Augmented VOICES", "Augmented YANGTZE", "Augmented WOODWINDS", "Augmented BRASS"],
        parameters: AUGMENTED_PARAMETERS,
        valueDisplay: "plugin",
        requiredParameters: ["Morph", "Color", "Time", "Motion", "FX A", "FX B", "Delay", "Reverb", "Sampler 1 Close/Far Mix", "Layer A Filter Cutoff"],
        pages: [
            {name: "Performance", rows: [
                ["Color", "Time", "Motion", "FX A", "FX B", "Delay", "Reverb", ""],
                ["Layer A Filter Cutoff", "Layer A Filter Resonance", "Layer A Filter Env Amount", "Layer A Filter Spread", "Layer B Filter Cutoff", "Layer B Filter Resonance", "Layer B Filter Env Amount", "Layer B Filter Spread"],
                ["Sampler 1 Attack", "Sampler 1 Release", "Sampler 2 Attack", "Sampler 2 Release", "Synth 1 VCA Attack", "Synth 1 VCA Release", "Synth 2 VCA Attack", "Synth 2 VCA Release"]
            ]},
            {name: "Envelopes", rows: [
                ["Sampler 1 Attack", "Sampler 1 Decay", "Sampler 1 Sustain", "Sampler 1 Release", "Synth 1 VCA Attack", "Synth 1 VCA Decay", "Synth 1 VCA Sustain", "Synth 1 VCA Release"],
                ["Sampler 2 Attack", "Sampler 2 Decay", "Sampler 2 Sustain", "Sampler 2 Release", "Synth 2 VCA Attack", "Synth 2 VCA Decay", "Synth 2 VCA Sustain", "Synth 2 VCA Release"],
                ["Layer A Filter Env Attack", "Layer A Filter Env Decay", "Layer A Filter Env Sustain", "Layer A Filter Env Release", "Layer B Filter Env Attack", "Layer B Filter Env Decay", "Layer B Filter Env Sustain", "Layer B Filter Env Release"]
            ]},
            {name: "Sources + FX", rows: [
                ["Sampler 1 Close/Far Mix", "Sampler 2 Close/Far Mix", "Sampler 1 Width", "Sampler 2 Width", "Sampler 1 Velocity Amount", "Sampler 2 Velocity Amount", "Synth 1 VCA Velocity Amount", "Synth 2 VCA Velocity Amount"],
                ["Layer A FX1 Dry/Wet", "Layer A FX2 Dry/Wet", "Layer B FX1 Dry/Wet", "Layer B FX2 Dry/Wet", "Master Delay Dry/Wet", "Master Reverb Dry/Wet", "Master Delay Send Level", "Master Reverb Send Level"],
                ["Master Reverb Size", "Master Reverb Predelay", "Master Reverb Decay", "Master Reverb Damping", "Master Reverb Input Volume", "Master Reverb Output Volume", "Arpeggiator Unsync Rate", "Arpeggiator Swing"]
            ]}
        ],
        faders: ["Sampler 1 Volume", "Sampler 2 Volume", "Synth 1 Volume", "Synth 2 Volume", "Layer A Volume", "Layer B Volume", "Morph", "Master Volume"],
        buttons: ["Sampler 1 Bypass", "Sampler 2 Bypass", "Synth 1 Bypass", "Synth 2 Bypass", "Layer A Filter Bypass", "Layer B Filter Bypass", "Master Delay On/Off", "Master Reverb On/Off", "Layer A FX1 On/Off", "Layer A FX2 On/Off", "Layer B FX1 On/Off", "Layer B FX2 On/Off", "Arpeggiator On", "Chord Mode ON/OFF", "FX Section On/Off", ""],
        colors: {
            macro: [127, 80, 0], sampler: [0, 127, 70], synth: [100, 0, 127],
            layerA: [0, 90, 127], layerB: [127, 40, 0], fx: [127, 25, 70],
            arp: [50, 127, 0], global: [100, 110, 127]
        },
        groupForName: function (name) {
            if (/^(Morph|Color|Time|Motion|FX A|FX B|Delay|Reverb)$/.test(name)) return "macro";
            if (/^Sampler /.test(name)) return "sampler";
            if (/^Synth /.test(name)) return "synth";
            if (/FX[12]|^Master (Delay|Reverb)|^FX Section/.test(name)) return "fx";
            if (/^Layer A /.test(name)) return "layerA";
            if (/^Layer B /.test(name)) return "layerB";
            if (/^(Arpeggiator|Chord Mode)/.test(name)) return "arp";
            return "global";
        },
        // Bypass controls light when bypassed; On/Off controls light when enabled.
        buttonStates: {
            "Sampler 1 Bypass": ["Active", "Bypassed"],
            "Sampler 2 Bypass": ["Active", "Bypassed"],
            "Synth 1 Bypass": ["Active", "Bypassed"],
            "Synth 2 Bypass": ["Active", "Bypassed"],
            "Layer A Filter Bypass": ["Active", "Bypassed"],
            "Layer B Filter Bypass": ["Active", "Bypassed"]
        }
    });
}());
