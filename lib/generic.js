// Safe fallback: only the top eight encoders map to Bitwig Remote Controls.
function createGenericLCXL3Controller(device, hardware, isLocked) {
    var remotePage = device.createCursorRemoteControlsPage(8);
    var controls = [], names = [], values = [], labels = [], labelAt = [], exists = [];
    var deviceName = "", deviceExists = false, pageName = "Remote Controls", pageIndex = 0, pageCount = 0;
    var dirty = true, down = {};
    function invalidate() { dirty = true; }
    remotePage.getName().addValueObserver(function (v) { pageName = String(v); invalidate(); });
    remotePage.selectedPageIndex().addValueObserver(function (v) { pageIndex = v; invalidate(); });
    remotePage.pageCount().addValueObserver(function (v) { pageCount = v; invalidate(); });
    for (var i = 0; i < 8; i++) (function (index) {
        var parameter = remotePage.getParameter(index); controls.push(parameter);
        names[index] = ""; values[index] = NaN; labels[index] = ""; exists[index] = false;
        parameter.name().addValueObserver(function (v) { names[index] = String(v); invalidate(); });
        parameter.exists().addValueObserver(function (v) { exists[index] = v; invalidate(); });
        parameter.value().addValueObserver(function (v) { values[index] = v; invalidate(); });
        parameter.value().displayedValue().addValueObserver(function (v) {
            if (String(v)) { labels[index] = String(v); labelAt[index] = values[index]; invalidate(); }
        });
    }(i));
    function valueText(index) {
        if (!isFinite(values[index])) return labels[index] || "";
        if (labels[index] && Math.abs(labelAt[index] - values[index]) < 1 / 16383) return labels[index];
        return (values[index] * 100).toFixed(1) + " %";
    }
    return {
        invalidate: invalidate,
        setDevice: function (name, present) {
            if (name !== deviceName || present !== deviceExists) down = {};
            deviceName = name; deviceExists = present; invalidate();
        },
        onMidi: function (status, cc, value, fine) {
            if (!deviceExists) return;
            if (status === 0xb0 && (cc === 106 || cc === 107)) {
                if (!value) { down[cc] = false; return; }
                if (down[cc]) return;
                down[cc] = true;
                if (cc === 106 && pageIndex > 0) remotePage.selectPreviousPage(false);
                if (cc === 107 && pageIndex + 1 < pageCount) remotePage.selectNextPage(false);
            } else if (status === 0xbf && cc >= 77 && cc <= 84) {
                var index = cc - 77, delta = value - 64;
                if (exists[index] && names[index] && delta) controls[index].value().inc(delta * (fine ? LCXL3_SETTINGS.fineStep : LCXL3_SETTINGS.normalStep));
            }
        },
        flush: function () {
            if (!dirty) return;
            dirty = false;
            hardware.stationary(deviceExists ? deviceName + (isLocked() ? " LOCK" : "") : "Select device", deviceExists ? pageName || "Remote Controls" : "No device selected");
            for (var cc = 5; cc <= 36; cc++) {
                var index = cc - 13, assigned = deviceExists && index >= 0 && index < 8 && exists[index] && !!names[index];
                hardware.sysex([4, cc, 97]);
                hardware.text(cc, 0, assigned ? names[index] : "Unassigned");
                hardware.text(cc, 1, assigned ? valueText(index) : "");
                if (cc >= 13) hardware.color(cc, assigned ? hardware.valueColor([20,100,127], values[index], false) : [0,0,0]);
                if (assigned && isFinite(values[index])) hardware.sendCC(0xbf, cc, values[index] * 127);
            }
            for (var b = 37; b <= 52; b++) hardware.color(b, [0,0,0]);
            hardware.sendCC(0xb0, 106, deviceExists && pageIndex > 0 ? 3 : 0);
            hardware.sendCC(0xb0, 107, deviceExists && pageIndex + 1 < pageCount ? 3 : 0);
        }
    };
}
