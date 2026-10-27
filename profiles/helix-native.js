// Bank slot contract. Native stores these assignments inside each preset.
var HELIX_BANK_KNOBS = [
    {name: "Amp Gain", target: "dsp0.block2.Drive", min: 0.18, max: 0.79},
    {name: "Bass", target: "dsp0.block2.Bass", min: 0, max: 1},
    {name: "Mid / Cut", target: "dsp0.block2.Mid", min: 0, max: 1},
    {name: "Treble", target: "dsp0.block2.Treble", min: 0, max: 1},
    {name: "Presence", target: "dsp0.block2.Presence", min: 0, max: 1},
    {name: "Amp Master", target: "dsp0.block2.Master", min: 0, max: 1},
    {name: "Amp Level", target: "dsp0.block2.ChVol", min: 0, max: 1},
    {name: "Comp Threshold", target: "dsp0.block0.Threshold", min: -40, max: -10},
    {name: "Drive Gain", target: "dsp0.block1.Gain 1", min: 0, max: 1},
    {name: "Drive Tone", target: "dsp0.block1.Tone 1", min: 0, max: 1},
    {name: "Drive Level", target: "dsp0.block1.Level 1", min: 0, max: 1},
    {name: "Mod Depth", target: "dsp0.block5.Intensity", min: 0, max: 1},
    {name: "Delay Time", target: "dsp0.block4.Time", min: 0.05, max: 1},
    {name: "Delay Feedback", target: "dsp0.block4.Feedback", min: 0, max: 1},
    {name: "Delay Mix", target: "dsp0.block4.Mix", min: 0, max: 1},
    {name: "Reverb Mix", target: "dsp0.block3.Mix", min: 0, max: 1}
];
var HELIX_BANK_SWITCHES = ["Comp", "Drive", "Mod", "Delay", "Reverb"];
(function () {
    var parameters = {"Snapshot Index": HELIX_NATIVE_PARAMETERS["Snapshot Index"], "Master Output": HELIX_NATIVE_PARAMETERS["Master Output Level"]};
    HELIX_BANK_KNOBS.forEach(function (binding, i) { parameters[binding.name] = HELIX_NATIVE_PARAMETERS["Knob " + ("0" + (i + 1)).slice(-2)]; });
    HELIX_BANK_SWITCHES.forEach(function (name, i) { parameters[name + " Power"] = HELIX_NATIVE_PARAMETERS["Switch " + ("0" + (i + 1)).slice(-2)]; });
    var actions = {};
    ["Core", "Pushed", "Drive", "Movement", "Space"].forEach(function (label, i) {
        actions[i] = {parameter: "Snapshot Index", value: i, steps: 8, label: label};
    });
    registerLCXL3Profile({
        id: "helix-native", name: "HELIX BANK", matchNames: ["Helix Native"], parameters: parameters, valueDisplay: "plugin",
        requiredParameters: ["Amp Gain", "Reverb Mix", "Comp Power", "Reverb Power", "Snapshot Index", "Master Output"],
        parameterSteps: {"Snapshot Index": 8}, pickupResetParameters: ["Snapshot Index"], buttonActions: actions,
        pages: [{name: "Amp + FX", rows: [HELIX_BANK_KNOBS.slice(0, 8).map(function (b) { return b.name; }),
            HELIX_BANK_KNOBS.slice(8).map(function (b) { return b.name; }), ["", "", "", "", "", "", "", ""]]}],
        faders: ["Comp Threshold", "Drive Gain", "Drive Level", "Mod Depth", "Delay Mix", "Reverb Mix", "Amp Level", "Master Output"],
        buttons: ["", "", "", "", "", "", "", "", "Comp Power", "Drive Power", "Mod Power", "Delay Power", "Reverb Power", "", "", ""],
        colors: {amp: [127, 75, 0], comp: [40, 110, 127], drive: [100, 127, 0], mod: [100, 20, 127], delay: [20, 90, 127], reverb: [127, 35, 20], global: [100, 100, 127]},
        groupForName: function (name) {
            if (/^(Amp|Bass|Mid|Treble|Presence)/.test(name)) return "amp";
            return /^(Comp|Drive|Mod|Delay|Reverb)/.test(name) ? name.split(" ")[0].toLowerCase() : "global";
        }
    });
}());
