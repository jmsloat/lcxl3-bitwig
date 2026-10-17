// Novation Launch Control XL 3 DAW protocol. No plugin-specific behavior.
function createLCXL3Hardware(output) {
    var cache = {};
    function sendCC(status, cc, value) { output.sendMidi(status, cc, Math.max(0, Math.min(127, Math.round(value)))); }
    function sysex(bytes) {
        output.sendSysex([240, 0, 32, 41, 2, 21].concat(bytes, [247]).map(function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""));
    }
    function text(target, field, value) {
        var bytes = [6, target, field], s = String(value).slice(0, 45);
        for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); bytes.push(c >= 32 && c <= 126 ? c : 32); }
        sysex(bytes);
    }
    function stationary(title, subtitle, third) {
        sysex([4, 53, third === undefined ? 1 : 2]); text(53, 0, title); text(53, 1, subtitle);
        if (third !== undefined) text(53, 2, third);
        sysex([4, 53, 127]);
    }
    function color(cc, rgb) {
        var key = rgb.join(",");
        if (cache[cc] === key) return;
        cache[cc] = key; sysex([1, 83, cc].concat(rgb));
    }
    function valueColor(rgb, value, button) {
        value = Math.max(0, Math.min(1, isFinite(value) ? value : 0));
        var level = button ? (value >= 0.5 ? LCXL3_SETTINGS.buttonOn : LCXL3_SETTINGS.buttonOff) : LCXL3_SETTINGS.knobMin + (LCXL3_SETTINGS.knobMax - LCXL3_SETTINGS.knobMin) * Math.pow(value, LCXL3_SETTINGS.knobCurve);
        return rgb.map(function (c) { return Math.round(c * level); });
    }
    return {sendCC: sendCC, sysex: sysex, text: text, stationary: stationary,
        color: color, valueColor: valueColor, clearLedCache: function () { cache = {}; }};
}
