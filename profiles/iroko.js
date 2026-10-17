// Iroko parameter IDs are captured automation identifiers, not plugin code.
(function () {
var PAGES = [
    {name: "Amp + FX", rows: [
        ["@Gain", "@Bass", "@Mid", "@Treble", "@Presence", "@Sparkle", "@Push", "@Volume"],
        ["Drive Gain", "Drive Tone", "Drive Level", "Comp Amount", "Comp Tone", "Comp Mix", "MultiMod Speed", "MultiMod Mod"],
        ["Del Time", "Del Feedback", "Del Character", "Del Modulation", "Rev Time", "Rev Pre Delay", "Rev Diffusion", "Rev Hi Cut"]]},
    {name: "Pre FX", rows: [
        ["Tremolo Rate", "Tremolo Depth", "Tremolo Ramp", "Comp Amount", "Comp Gain", "Comp Tone", "Comp Mix", "KillGate Threshold"],
        ["FuzzBoy Sustain", "FuzzBoy Tone", "FuzzBoy Volume", "Drive Gain", "Drive Tone", "Drive Mids", "Drive Level", "Kebamp Drive"],
        ["Kebamp Bass", "Kebamp Mid", "Kebamp Treble", "Kebamp Level", "MultiMod Speed", "MultiMod Mod", "MultiMod Fbk", "MultiMod Mix"]]},
    {name: "Space + EQ", rows: [
        ["Del Time", "Del Feedback", "Del Character", "Del Modulation", "Del Ducking", "Del Low Cut", "Del Hi Cut", "Del Width"],
        ["Rev Time", "Rev Pre Delay", "Rev Width", "Rev Diffusion", "Rev Low Cut", "Rev Mid", "Rev Hi Cut", "Rev Mix"],
        ["Shape EQ 65Hz", "Shape EQ 125Hz", "Shape EQ 250Hz", "Shape EQ 500Hz", "Shape EQ 1kHz", "Shape EQ 2kHz", "Shape EQ 3kHz", "Shape EQ 6kHz"]]}
];
var FADERS = ["Drive Level", "Comp Mix", "MultiMod Mix", "Spring Amount", "Del Mix", "Rev Mix", "Gate", "Global Output"];
var ALWAYS_ON = ["Amp Power", "Pre FX Section Power", "Dist Section Power", "Cab Section Power", "EQ Section Power", "Post FX Section Power"];
var BUTTONS = ["Drive Power", "Comp Power", "MultiMod Power", "Tremolo Power", "Vibes Power", "KillGate Power", "", "",
    "FuzzBoy Power", "Kebamp Power", "Spring Power", "Del Power", "Rev Power", "Amp Sel", "@Boost", "Rev Hold"];
var SHIFT_BUTTONS = ["Drive Power", "Comp Power", "MultiMod Power", "Tremolo Power", "Vibes Power", "KillGate Power", "", "",
    "FuzzBoy Power", "Kebamp Power", "Spring Power", "Del Power", "Rev Power", "Amp Sel", "@Bright", "@Tight"];
var EFFECT_COLORS = {
    amp: [127, 90, 0], drive: [40, 127, 0], comp: [25, 105, 127],
    multimod: [0, 127, 70], tremolo: [0, 105, 127], vibes: [5, 40, 127],
    spring: [127, 70, 15], delay: [40, 90, 127], reverb: [127, 30, 5],
    fuzz: [127, 127, 127], kebamp: [100, 0, 127], eq: [127, 127, 127],
    gate: [65, 105, 127], global: [127, 127, 127]
};
function effectGroup(name) {
    if (/^(Clean|Crunch|Amp) /.test(name)) return "amp";
    if (name === "Pre FX Section Power") return "multimod";
    if (name === "Dist Section Power") return "drive";
    if (name === "Cab Section Power") return "amp";
    if (name === "EQ Section Power") return "eq";
    if (name === "Post FX Section Power") return "reverb";
    if (/^Drive /.test(name)) return "drive";
    if (/^Comp /.test(name)) return "comp";
    if (/^MultiMod /.test(name)) return "multimod";
    if (/^Tremolo /.test(name)) return "tremolo";
    if (/^Vibes /.test(name)) return "vibes";
    if (/^Spring /.test(name)) return "spring";
    if (/^Del /.test(name)) return "delay";
    if (/^Rev /.test(name)) return "reverb";
    if (/^FuzzBoy /.test(name)) return "fuzz";
    if (/^Kebamp /.test(name)) return "kebamp";
    if (/^(Shape EQ|Mastering EQ) /.test(name)) return "eq";
    if (/^KillGate /.test(name) || name === "Gate") return "gate";
    return "global";
}

    registerLCXL3Profile({
        id: "iroko", name: "IROKO", matchNames: ["Iroko"],
        requiredParameters: ["Amp Sel", "Clean Gain", "Del Mix"],
        parameters: IROKO_PARAMETERS, pages: PAGES, faders: FADERS,
        buttons: BUTTONS, shiftButtons: SHIFT_BUTTONS, alwaysOn: ALWAYS_ON,
        colors: EFFECT_COLORS, groupForName: effectGroup,
        layoutParameters: ["Amp Sel"],
        resolveName: function (name, getValue) {
            if (name.charAt(0) !== "@") return name;
            return (getValue("Amp Sel") >= 0.5 ? "Crunch" : "Clean") + " " + name.slice(1);
        },
        buttonLabels: {"Amp Sel": "Amp Channel", "Comp Power": "Compressor", "Del Power": "Delay", "Rev Power": "Reverb", "Rev Hold": "Reverb Hold", "FuzzBoy Power": "Fuzz"},
        buttonStates: {"Amp Sel": ["Clean", "Crunch"]},
        preset: {inputName: "Iroko Presets", buttons: {
            6: {cc: 43, label: "Previous Preset"},
            7: {cc: 44, label: "Next Preset"}
        }}
    });
}());
