(function(window, document, $, L, undefined) {
        'use strict';

        function measure(lat1, lon1, lat2, lon2){  // generally used geo measurement function
            var R = 6378.137; // Radius of earth in KM
            var dLat = (lat2 - lat1) * Math.PI / 180;
            var dLon = (lon2 - lon1) * Math.PI / 180;
            var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            var d = R * c;
            return d * 1000; // meters
        }

        function AutoMap (cockpit) {
            this.cockpit = cockpit;
            this.socket = cockpit.socket;

            $('#controls').append('<input type="button" id="automap-toggle" value="Toggle map">');
            $('#controls').append('<input type="button" id="automap-stop" value="Stop autopilot">');
            $(".main-container").append('<div id="automap-map"></div>');

            this.addMap();
            this.map.addControl(new this.PositionControl(this));
            
            this.bindSocket(this.cockpit.socket);
            this.bindControls();

            cockpit.automap = this;
        }

        AutoMap.prototype.addMap = function addMap () {
            // Create layers

            // LICENSE FOR THE FOLLOWING LINES
            // LICENSE:  GNU AFFERO GENERAL PUBLIC LICENSE Version 3, 19 November 2007
            var tileOSM = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: 'Data &copy; by <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>.',
              maxZoom: 18
            });

            var tileToner = L.tileLayer('http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', {
              attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data &copy; by <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>.',
              maxZoom: 18
            });

            var tileWatercolor = L.tileLayer('http://{s}.tile.stamen.com/watercolor/{z}/{x}/{y}.png', {
              attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data &copy; by <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>.',
              maxZoom: 16
            });

            var tileMapQuest = L.tileLayer('http://{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', {
              subdomains: ['otile1','otile2','otile3','otile4'],
              attribution: 'Map tiles by <a href="http://open.mapquestapi.com/">MapQuest</a>. Data &copy; by <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>.',
              maxZoom: 18
            });

            var tileMapQuestAerial = L.tileLayer('http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.png', {
              subdomains: ['otile1','otile2','otile3','otile4'],
              attribution: 'Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency. Data &copy; by <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>.',
              maxZoom: 18
            });

            var tileGoogleRoadmap = new L.Google('ROADMAP');
            var tileGoogleSatellite = new L.Google('SATELLITE');
            var tileGoogleHybrid = new L.Google('HYBRID');
            var tileGoogleTerrain = new L.Google('TERRAIN');
            //LICENSE AFTER THIS MIT AGAIN

            // Create a map
            this.map = L.map('automap-map', {
                layers: tileOSM,
                center: [0, 0],
                zoom: 3
            });

             L.control.layers({
                "OpenStreetMap": tileOSM,
                "MapQuestOpen": tileMapQuest,
                "MapQuestOpenAerial": tileMapQuestAerial,
                "Toner": tileToner,
                "Watercolor": tileWatercolor,
                "Google Roadmap": tileGoogleRoadmap,
                "Google Satellite": tileGoogleSatellite,
                "Google Hybrid": tileGoogleHybrid,
                "Google Terrain": tileGoogleTerrain,
            }).addTo(this.map);

            // Hide the map
            $("#automap-map").hide();
        };

        AutoMap.prototype.PositionControl = L.Control.extend({
            options: {
                position: 'topright'
            },

            initialize: function (automap, options) {
                this.automap = automap;
                L.Util.setOptions(this, options);
            },

            onAdd: function (map) {
                var automap = this.automap;
                var container = L.DomUtil.create('div', '');

                container.appendChild(automap.createButton("setcurrentpos", "Set current position", automap.setCurrentPosHandler.bind(automap)));
                container.appendChild(automap.createButton("setgoalpos", "Set goal position", automap.setGoalPosHandler.bind(automap)));
                container.appendChild(automap.createButton("gotopos", "Go to goal position", automap.gotoPosHandler.bind(automap)));
                container.appendChild(automap.createButton("stop", "Disable autopilot", automap.stop.bind(automap)));

                return container;
            }
        });

        AutoMap.prototype.createButton = function (name, text, clickhandler) {
            var bar = L.DomUtil.create('div', 'leaflet-bar leaflet-control automap-map-controls');
            
            var link = L.DomUtil.create('a', 'automap-control-' + name);
            link.appendChild(document.createTextNode(text));
            link.href = "#";
            link.addEventListener("click", clickhandler);
            bar.appendChild(link);

            return bar;
        };

        AutoMap.prototype.setCurrentPosHandler = function setCurrentPosHandler (event) {
            var automap = this;

            $("#automap-map").css("cursor", "crosshair");
            this.map.addOneTimeEventListener("click", function (event) {
                automap.setCurrentPos(event.latlng);
                $("#automap-map").css("cursor", "");
            });

            event.stopPropagation();
        };

        AutoMap.prototype.setGoalPosHandler = function setGoalPosHandler (event) {
            var automap = this;

            $("#automap-map").css("cursor", "crosshair");
            this.map.addOneTimeEventListener("click", function (event) {
                automap.setGoalPos(event.latlng);
                $("#automap-map").css("cursor", "");
            });

            event.stopPropagation();
        };

        AutoMap.prototype.gotoPosHandler = function gotoPosHandler (event) {
            // When pointing north, lat is Y and lng is X
            var reference = this.currentPosMarker.getLatLng();
            var goal = this.goalPosMarker.getLatLng();

            console.log(reference, goal);
            var deltaY = measure(reference.lat, goal.lng, goal.lat, goal.lng);
            // DeltaX is not 100% correct because the earth is a sphere
            // But the difference is negligable
            var deltaX = measure(goal.lat, reference.lng, goal.lat, goal.lng);
            
            if (goal.lat < reference.lat) {
                deltaY = -deltaY;
            }

            if (goal.lng < reference.lng) {
                deltaX = -deltaX;
            }

            console.log("Going to (" + deltaX + "," + deltaY + ")");

            var targetPos = {x: deltaX, y: deltaY};
            this.socket.emit("automap/go", targetPos);
        };

        AutoMap.prototype.createCurrentPosMarker = function createCurrentPosMarker (map) {
            var marker = L.marker([0, 0], {
                draggable: true,
                title: "Reference position (0, 0)",
                alt: "Reference position (0, 0)"
            }).addTo(map);
            marker.on("dragend", this.processCurrentPos.bind(this));
            return marker;
        };

        AutoMap.prototype.setCurrentPos = function setCurrentPos (latLng) {
            this.currentPosMarker = this.currentPosMarker || this.createCurrentPosMarker(this.map);
            this.currentPosMarker.setLatLng(latLng);
            this.processCurrentPos();
        };

        AutoMap.prototype.processCurrentPos = function () {
            this.stop();

            $.notifyBar({
                cssClass: "warning",
                html: "Make sure the drone heads north when setting current position!",
                delay: 6000,
                closeOnOver: true
            });

            this.socket.emit("automap/zero");
        };

        AutoMap.prototype.setGoalPos = function setGoalPos (latLng) {
            this.stop();

            this.goalPosMarker = this.goalPosMarker || L.marker(latLng, {
                icon: L.icon({
                  iconUrl: '/leaflet/images/marker-icon-green.png',
                  iconRetinaUrl: '/leaflet/images/marker-icon-2x-green.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowUrl: '/leaflet/images/marker-shadow.png',
                  shadowSize: [41, 41]}),
                draggable: true,
                title: "Goal position",
                alt: "Goal position"
            }).addTo(this.map);

            this.goalPosMarker.setLatLng(latLng);
        };

        AutoMap.prototype.bindSocket = function bindSocket (socket) {
            var automap = this;

            socket.on("autonomy/controldata", function (data) {
                automap.showControlData(data);
            });
        };

        AutoMap.prototype.bindControls = function bindControls () {
            var automap = this;

            $('#automap-toggle').click(function (event) {
                event.preventDefault();
                $("#automap-map").toggle();
                $("#automap-controls").toggle();
                automap.map.invalidateSize();
            });

            $('#automap-stop').click(function (event) {
                event.preventDefault();
                automap.stop();
            });
        };

        AutoMap.prototype.stop = function stop () {
            this.socket.emit("automap/stop");
        };

        AutoMap.prototype.showControlData = function showControlData (data) {

        };

        window.Cockpit.plugins.push(AutoMap);

}(window, document, jQuery, L));