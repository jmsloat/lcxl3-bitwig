loadAPI(18);
host.defineController("Local", "Device Parameter Inspector", "0.1", "fa080a8a-6f67-4847-bc96-bc67ac24c396", "Local");
host.defineMidiPorts(0, 0);

var inspectorDevice;
var inspectorTrackName = "";
var inspectorDeviceName = "";
var inspectorIds = [];
var inspectorNames = {};
var inspectorRevision = 0;
var inspectorLastSnapshot = "";

function queueInspectorSnapshot() {
    var revision = ++inspectorRevision;
    host.scheduleTask(function () {
        if (revision !== inspectorRevision) return;
        var parameters = [];
        for (var i = 0; i < inspectorIds.length; i++) {
            var id = String(inspectorIds[i]);
            parameters.push({id: id, name: inspectorNames[id] || ""});
        }
        var snapshot = JSON.stringify({track: inspectorTrackName, device: inspectorDeviceName, parameters: parameters});
        if (snapshot === inspectorLastSnapshot) return;
        inspectorLastSnapshot = snapshot;
        println("[IROKO_INSPECTOR] " + snapshot);
        host.showPopupNotification("Parameter inspector: " + inspectorDeviceName + " (" + parameters.length + " parameters)");
    }, 1200);
}

function exportInspectorSnapshot() {
    if (inspectorLastSnapshot) {
        // ASCII JSON keeps conversion to Java's signed byte[] unambiguous.
        var message = inspectorLastSnapshot.replace(/[\u007f-\uffff]/g, function (c) {
            return "\\u" + ("0000" + c.charCodeAt(0).toString(16)).slice(-4);
        });
        // Chunk snapshots to keep each local UDP packet small.
        var count = Math.ceil(message.length / 3000);
        for (var part = 0; part < count; part++) {
            var packet = JSON.stringify({revision: inspectorRevision, part: part, count: count,
                data: message.slice(part * 3000, (part + 1) * 3000)});
            var bytes = [];
            for (var j = 0; j < packet.length; j++) bytes.push(packet.charCodeAt(j));
            host.sendDatagramPacket("127.0.0.1", 19673, bytes);
        }
    }
    host.scheduleTask(exportInspectorSnapshot, 5000);
}

function init() {
    var track = host.createCursorTrack("iroko-parameter-inspector-track", "Iroko Inspector", 0, 0, true);
    inspectorDevice = track.createCursorDevice("iroko-parameter-inspector-device", "Iroko Inspector", 0, CursorDeviceFollowMode.FOLLOW_SELECTION);
    track.name().addValueObserver(function (name) {
        inspectorTrackName = String(name);
        queueInspectorSnapshot();
    });
    inspectorDevice.name().addValueObserver(function (name) {
        inspectorDeviceName = String(name);
        queueInspectorSnapshot();
    });
    inspectorDevice.addDirectParameterIdObserver(function (ids) {
        inspectorIds = [];
        for (var i = 0; i < ids.length; i++) inspectorIds.push(String(ids[i]));
        queueInspectorSnapshot();
    });
    inspectorDevice.addDirectParameterNameObserver(160, function (id, name) {
        inspectorNames[String(id)] = String(name);
        queueInspectorSnapshot();
    });
    host.scheduleTask(exportInspectorSnapshot, 2000);
    println("[IROKO_INSPECTOR] Inspector active. Select a device in Bitwig.");
}

function flush() {}
function exit() {}
