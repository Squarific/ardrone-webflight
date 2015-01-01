var autonomy = require('ardrone-autonomy');

function autoMap (name, deps) {
	var ctrl = new autonomy.Controller(deps.client);

    deps.io.sockets.on('connection', function (socket) {
        socket.on("automap/go", function (pos) {
        	console.log("Going to ", pos);
        	ctrl.go(pos);
        });

        socket.on("automap/stop", function (pos) {
        	console.log("Autopilot stopped.");
        	ctrl.disable();
        });

        socket.on("automap/altitude", function (alt) {
        	ctrl.altitude(alt);
        });

        socket.on("automap/zero", function () {
        	console.log("reference point set");
        	ctrl.zero();
        });

        ctrl.on('controlData', function (data) {
        	socket.emit("automap/controldata", data);
        });
    });
};

module.exports = autoMap;
