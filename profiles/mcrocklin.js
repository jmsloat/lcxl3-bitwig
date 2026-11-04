// Mapping data and pure resolvers; the shared engine performs all host writes.
(function () {
    registerLCXL3Profile({
        id: "mcrocklin", name: "MCROCKLIN", matchNames: ["McRocklin Suite"],
        parameters: MCROCKLIN_PARAMETERS, valueDisplay: "plugin",
        parameterSteps: {"Amp Select": 4, "Acoustic Profile": 4, "Delay Model": 3, "Reverb Model": 3, "EQ Mode": 2},
        requiredParameters: ["Amp Select", "Acoustic Gain", "Edge Boost", "Attacker Drive", "Heatpressor Compress", "Reverb Mix"],
        pages: [
            {name: "Amp + FX", rows: [
                ["Amp Select", "@Gain", "@Bass", "@Mid", "@Treble", "@Character", "@Master", "Global Output"],
                ["Attacker Drive", "Attacker Level", "Shredder Dist", "Shredder Tone", "Riffer Drive", "Riffer Tone", "Viber Drive", "Viber Level"],
                ["Delay Time", "Delay Feedback", "Delay Mix", "Reverb Time", "Reverb Pre Delay", "Reverb Hi Cut", "Reverb Mix", "Widener"]
            ]},
            {name: "Pre FX", rows: [
                ["Heatpressor Compress", "Heatpressor Level", "Heatpressor Boost", "Heatpressor Warmth", "Heatpressor Chain", "Heatpressor Tight", "Heatpressor Bright", "Synth Oct Env"],
                ["Wah Position", "Wah Bite", "Wah Auto", "Wah Sensitivity", "Synth Oct Mix", "Phaser Speed", "Phaser Amount", "Phaser Wide"],
                ["Attacker Attack", "Attacker Drive", "Attacker Bright", "Attacker Level", "Shredder Dist", "Shredder Tone", "Shredder Level", "Phaser Sync"]
            ]},
            {name: "Drives", rows: [
                ["Attacker Attack", "Attacker Drive", "Attacker Bright", "Attacker Level", "Shredder Dist", "Shredder Tone", "Shredder Level", "Global Input"],
                ["Riffer Drive", "Riffer Tone", "Riffer Level", "Viber Drive", "Viber Bass", "Viber Mid", "Viber Treble", "Viber Level"],
                ["Amp Select", "@Gain", "@Bass", "@Mid", "@Treble", "@Character", "@Master", "Gate"]
            ]},
            {name: "Space", rows: [
                ["Delay Model", "Delay Sync", "Delay Time", "Delay Feedback", "Delay Ducking", "Delay Extra", "Delay Low Cut", "Delay Hi Cut"],
                ["Reverb Model", "Reverb Time", "Reverb Pre Delay", "Reverb Diffusion", "Reverb Modulation", "Reverb Mid Bloom", "Reverb Low Cut", "Reverb Hi Cut"],
                ["Delay Mix", "Reverb Mix", "Reverb Swampy", "Chorus Amount", "Compressor Amount", "Widener", "Gate", "Global Output"]
            ]},
            {name: "EQ + Cab", rows: [
                ["Parametric EQ Low Freq", "Parametric EQ Low Gain", "Parametric EQ Mid Freq 1", "Parametric EQ Mid Gain 1", "Parametric EQ Mid Freq 2", "Parametric EQ Mid Gain 2", "Parametric EQ High Freq", "Parametric EQ High"],
                ["Graphic EQ Band 1", "Graphic EQ Band 2", "Graphic EQ Band 3", "Graphic EQ Band 4", "Graphic EQ Band 5", "Graphic EQ Band 6", "Graphic EQ Band 7", "Graphic EQ Band 8"],
                ["EQ Mode", "EQ In", "EQ Out", "Speaker Resonance", "Speaker Air", "Speaker Low Cut", "Speaker Hi Cut", "@Speaker"]
            ]}
        ],
        faders: ["Attacker Level", "Shredder Level", "Riffer Level", "Viber Level", "Delay Mix", "Reverb Mix", "Gate", "Global Output"],
        buttons: ["Attacker Power", "Shredder Power", "Riffer Power", "Viber Power", "Heatpressor Power", "Synth Oct Power", "Phaser Power", "Wah Power", "Delay Power", "Reverb Power", "Chorus Power", "Compressor Power", "EQ Power", "Speakers Power", "Delay Sync", "Phaser Wide"],
        shiftButtons: ["Attacker Power", "Shredder Power", "Riffer Power", "Viber Power", "Heatpressor Power", "Synth Oct Power", "Phaser Power", "Wah Power", "Delay Power", "Reverb Power", "Chorus Power", "Compressor Power", "EQ Power", "Speakers Power", "Reverb Swampy", "Phaser Sync"],
        layoutParameters: ["Amp Select"],
        resolveName: function (name, getValue) {
            if (name.charAt(0) !== "@") return name;
            var value = getValue("Amp Select");
            // Leave dynamic slots unbound until the host reports the selector.
            if (typeof value !== "number" || !isFinite(value)) return "";
            var index = Math.round(Math.max(0, Math.min(1, value)) * 3);
            if (name === "@Character") return ["Acoustic Profile", "Clean Presence", "Edge Boost", "Gain Amp Presence"][index];
            if (name === "@Speaker") return ["Acoustic Profile", "Clean Spk", "Edge Spk", "Gain Spk"][index];
            return ["Acoustic", "Clean", "Edge", "Gain Amp"][index] + " " + name.slice(1);
        },
        colors: {
            amp: [127, 90, 0], attacker: [127, 35, 0], shredder: [40, 127, 0],
            riffer: [110, 0, 127], viber: [0, 127, 70], heatpressor: [25, 105, 127],
            octave: [100, 50, 127], wah: [127, 100, 0], phaser: [0, 105, 127],
            delay: [40, 90, 127], reverb: [127, 30, 5], chorus: [5, 40, 127],
            eq: [100, 110, 127], global: [127, 127, 127]
        },
        groupForName: function (name) {
            if (/^(Acoustic|Clean|Edge|Gain|Amp|Speaker)/.test(name)) return "amp";
            if (/^Attacker /.test(name)) return "attacker";
            if (/^Shredder /.test(name)) return "shredder";
            if (/^Riffer /.test(name)) return "riffer";
            if (/^Viber /.test(name)) return "viber";
            if (/^(Heatpressor|Compressor) /.test(name)) return "heatpressor";
            if (/^Synth Oct /.test(name)) return "octave";
            if (/^Wah /.test(name)) return "wah";
            if (/^Phaser /.test(name)) return "phaser";
            if (/^Delay /.test(name)) return "delay";
            if (/^Reverb /.test(name)) return "reverb";
            if (/^Chorus /.test(name)) return "chorus";
            if (/^(EQ|Parametric EQ|Graphic EQ) /.test(name)) return "eq";
            return "global";
        },
        buttonLabels: {
            "Attacker Power": "Attacker", "Shredder Power": "Shredder", "Riffer Power": "Riffer", "Viber Power": "Viber",
            "Heatpressor Power": "Heatpressor", "Synth Oct Power": "Synth Octaver", "Phaser Power": "Phaser", "Wah Power": "Wah",
            "Delay Power": "Delay", "Reverb Power": "Reverb", "Chorus Power": "Chorus", "Compressor Power": "Compressor",
            "EQ Power": "EQ", "Speakers Power": "Speakers"
        }
    });
}());
