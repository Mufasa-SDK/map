'use strict';

import "../../js/leaflet.js";
import "../../js/layers.js";
import "../../js/plugins/leaflet.mapSelector.js";
import "../../js/plugins/leaflet.zoom.js";
import "../../js/plugins/leaflet.plane.js";
import "../../js/plugins/leaflet.position.js";
import "../../js/plugins/leaflet.displays.js";
import "../../js/plugins/leaflet.urllayers.js";
import "../../js/plugins/leaflet.rect.js";
import "../../js/plugins/leaflet.clickcopy.js";
import "../../js/plugins/leaflet.maplabels.js";

void function (global) {
    // Function to show notification
    function showNotification(text) {
        var notification = document.querySelector('.notification');
        if (!notification) {
            notification = L.DomUtil.create('div', 'notification', document.body);
            notification.style.position = 'fixed';
            notification.style.top = '50%'; // Center vertically
            notification.style.left = '50%'; // Center horizontally
            notification.style.transform = 'translate(-50%, -50%)'; // Adjust to exact center
            notification.style.background = 'rgba(0, 0, 0, 0.7)';
            notification.style.color = 'white';
            notification.style.padding = '8px 20px'; // Adjust padding to fit within the height
            notification.style.borderRadius = '5px';
            notification.style.zIndex = '2000';
            notification.style.fontSize = '24px'; // Current large font size for visibility
            notification.style.textAlign = 'center'; // Center text inside the notification
            notification.style.width = '300px'; // Set width to 250 pixels
            notification.style.height = '50px'; // Set height to 35 pixels
            notification.style.lineHeight = '35px'; // Align the text vertically in the center
            notification.style.boxSizing = 'border-box'; // Include padding in dimensions
            notification.style.overflow = 'hidden'; // Hide any overflow to maintain box size
            notification.style.whiteSpace = 'nowrap'; // Prevent text from wrapping to maintain a single line
            notification.style.textOverflow = 'ellipsis'; // Add ellipsis if text exceeds the width
        }
        notification.textContent = text;
        notification.style.display = 'block';

        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000); // Auto-hide after 3000ms
    }

    let runescape_map = global.runescape_map = L.gameMap('map', {

        maxBounds: [[-1000, -1000], [12800 + 1000, 12800 + 1000]],
        maxBoundsViscosity: 0.5,

        customZoomControl: true,
        planeControl: true,
        positionControl: true,
        messageBox: true,
        rect: true,
        initialMapId: -1,
        plane: 0,
        x: 3200,
        y: 3200,
        minPlane: 0,
        maxPlane: 3,
        minZoom: -4,
        maxZoom: 8,
        doubleClickZoom: false,
        showMapBorder: true,
        enableUrlLocation: true
    });

    L.Control.AreaGeneration = L.Control.extend({
        onAdd: function(map) {
            this._map = map;
            var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
            var link = L.DomUtil.create('a', '', container);
            link.href = '#';
            link.title = 'Generate Area';
            link.innerHTML = 'Area';
            link.style.width = '40px';
            link.style.textAlign = 'center';

            L.DomEvent.on(link, 'click', L.DomEvent.stop)
                      .on(link, 'click', this._toggleTextbox, this);
            this.clickCount = 0;
            this.firstCoord = null;
            this.secondCoord = null;
            this.areaLayer = null;
            map.on('click', this._mapClick, this);
            return container;
        },

        _toggleTextbox: function() {
            if (!this._textbox) {
                this._textbox = L.DomUtil.create('div', 'textbox-container', this._map._container);
                this._textbox.textContent = 'Click map to select area...';
                this._textbox.style.display = 'block';
                L.DomEvent.on(this._textbox, 'click', function(e) {
                    navigator.clipboard.writeText(this.textContent).then(() => {
                        showNotification('Text copied to clipboard!');
                    }).catch(err => {
                        showNotification('Failed to copy data: ' + err);
                    });
                    L.DomEvent.stop(e);  // Prevent map click event
                });
            } else {
                this._textbox.style.display = (this._textbox.style.display === 'none') ? 'block' : 'none';
                this.clickCount = 0; // Reset clicks when toggling
                if (this.areaLayer) {
                    this._map.removeLayer(this.areaLayer);  // Remove the drawn area if any
                    this.areaLayer = null;
                }
            }
        },

        _mapClick: function(e) {
            if (this._textbox && this._textbox.style.display !== 'none') {
                let coords = this._convertMapCoords(e.latlng.lat, e.latlng.lng);
                if (this.clickCount === 0) {
                    this.firstCoord = coords;
                    this._textbox.textContent = 'First corner selected...';
                    this.clickCount++;
                } else if (this.clickCount === 1) {
                    this.secondCoord = coords;
                    this._drawArea();
                    this._textbox.innerHTML = `<pre>new Area(\n\tnew Tile(${this.firstCoord}), \n\tnew Tile(${this.secondCoord})\n);</pre>`;
                    this.clickCount = 0; // Reset for new area selection
                }
            }
        },

        _drawArea: function() {
            if (this.areaLayer) {
                this._map.removeLayer(this.areaLayer);
            }
            let firstLatLng = this._map.containerPointToLatLng(this._getPointFromCoord(this.firstCoord));
            let secondLatLng = this._map.containerPointToLatLng(this._getPointFromCoord(this.secondCoord));
            this.areaLayer = L.rectangle([firstLatLng, secondLatLng], {color: "#ff7800", weight: 1});
            this.areaLayer.addTo(this._map);
            this.areaLayer.bringToFront(); // Ensure the rectangle is on top of other layers
        },

        _convertMapCoords: function(lat, lng) {
            let globalX = parseInt(lng);
            let globalY = parseInt(lat);
            let plane = this._map.getPlane(); // This method needs to be accurate
            let converted = this.convert(plane, globalX, globalY);
            let deConverted = this.deConvert(plane, converted.i, converted.j, converted.x, converted.y);
            let modifiedX = deConverted.globalX * 4;
            let modifiedY = deConverted.globalY * 4 - 254;
            return `${modifiedX}, ${modifiedY}, ${plane}`;
        },

        _getPointFromCoord: function(coord) {
            let parts = coord.split(", ");
            return new L.Point(parseInt(parts[0]), parseInt(parts[1]));
        },

        convert: function (_plane, _globalX, _globalY) {
            return {
                plane: _plane,
                i: _globalX >> 6,
                j: _globalY >> 6,
                x: _globalX & 0x3F,
                y: _globalY & 0x3F,
            };
        },

        deConvert: function (_plane, _i, _j, _x, _y) {
            return {
                plane: _plane,
                globalX: _i << 6 | _x,
                globalY: _j << 6 | _y
            };
        }
    });

    L.Control.PathGeneration = L.Control.extend({
        onAdd: function(map) {
            var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
            var link = L.DomUtil.create('a', '', container);
            link.href = '#';
            link.title = 'Generate Path';
            link.innerHTML = 'Path';
            link.style.width = '40px';
            link.style.textAlign = 'center';

            // Track if path generation is active
            this.isActive = false;
            this.pathPoints = [];  // Stores clicked path points

            L.DomEvent.on(link, 'click', L.DomEvent.stop)
                .on(link, 'click', function() {
                    this._togglePathGeneration(map);  // Toggle path generation mode
                }, this);

            return container;
        },

        _togglePathGeneration: function(map) {
            this.isActive = !this.isActive;  // Toggle active state

            if (this.isActive) {
                this.pathPoints = [];  // Reset path when starting new
                this._toggleTextbox('Click to generate a path...');
                map.on('click', this._handleMapClick, this);  // Start listening for clicks
            } else {
                this._textbox.style.display = 'none';  // Hide text box when deactivated
                map.off('click', this._handleMapClick, this);  // Stop listening for clicks
            }
        },

        _toggleTextbox: function(text) {
            if (!this._textbox) {
                this._textbox = L.DomUtil.create('div', 'textbox-container', this._map._container);
                this._textbox.textContent = text;
                this._textbox.style.right = '80px';
                this._textbox.style.height = '250px';  // Ensure consistent height

                // Add copy-to-clipboard functionality
                L.DomEvent.on(this._textbox, 'click', function(e) {
                    L.DomEvent.stop(e);  // Prevent triggering map clicks when clicking on the textbox

                    navigator.clipboard.writeText(this._textbox.textContent).then(() => {
                        showNotification('Text copied to clipboard!');
                    }).catch(err => {
                        showNotification('Failed to copy data: ' + err);
                    });
                }, this);  // Ensure correct "this" context
            } else {
                this._textbox.style.display = 'block';  // Show textbox if hidden
                this._textbox.textContent = text;
            }
        },

        _handleMapClick: function(e) {
            let coords = this._convertMapCoords(e.latlng.lat, e.latlng.lng);
            this.pathPoints.push(coords);  // Add point to path

            // Update the path in the text box
            this._updateTextbox();
        },

        // Updates the textbox with the current path data
        _updateTextbox: function() {
            if (this.pathPoints.length > 0) {
                let pathText = 'Tile[] path = new Tile[] {\n';
                this.pathPoints.forEach((coord, index) => {
                    pathText += `\tnew Tile(${coord})`;
                    if (index < this.pathPoints.length - 1) {
                        pathText += ',\n';  // Add a comma between coordinates, except the last one
                    }
                });
                pathText += '\n};';
                this._textbox.innerHTML = `<pre>${pathText}</pre>`;
            }
        },

        // Formats the coordinates as Mufasa-style Tile, same as area generator
        _convertMapCoords: function(lat, lng) {
            let globalX = parseInt(lng);
            let globalY = parseInt(lat);
            let plane = this._map.getPlane();  // Get the current plane
            let converted = this.convert(plane, globalX, globalY);
            let deConverted = this.deConvert(plane, converted.i, converted.j, converted.x, converted.y);
            let modifiedX = deConverted.globalX * 4;
            let modifiedY = deConverted.globalY * 4 - 254;
            return `${modifiedX}, ${modifiedY}, ${plane}`;
        },

        convert: function (_plane, _globalX, _globalY) {
            return {
                plane: _plane,
                i: _globalX >> 6,
                j: _globalY >> 6,
                x: _globalX & 0x3F,
                y: _globalY & 0x3F,
            };
        },

        deConvert: function (_plane, _i, _j, _x, _y) {
            return {
                plane: _plane,
                globalX: _i << 6 | _x,
                globalY: _j << 6 | _y
            };
        }
    });

    L.Control.ChunkSelector = L.Control.extend({
        onAdd: function(map) {
            var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
            var link = L.DomUtil.create('a', '', container);
            link.href = '#';
            link.title = 'Select Chunks';
            link.innerHTML = 'Chunk';
            link.style.width = '40px';
            link.style.textAlign = 'center';

            this.isActive = false;
            this.chunks = {};  // Store chunks as {chunk: Set(planes)}

            L.DomEvent.on(link, 'click', L.DomEvent.stop)
                .on(link, 'click', function() {
                    this._toggleChunkSelection(map);
                }, this);

            return container;
        },

        _toggleChunkSelection: function(map) {
            // Toggle active state
            this.isActive = !this.isActive;

            // Show or hide the text box and map click listener
            if (this.isActive) {
                this.chunks = {}; // Reset chunks for a new selection
                this._toggleTextbox('Click to select chunks...');
                map.on('click', this._handleMapClick, this);  // Start listening for map clicks
            } else {
                this._textbox.style.display = 'none';  // Hide the text box when toggled off
                map.off('click', this._handleMapClick, this);  // Stop listening for map clicks
            }
        },

        _toggleTextbox: function(text) {
            // Create the text box if it doesn't exist
            if (!this._textbox) {
                this._textbox = L.DomUtil.create('div', 'textbox-container', this._map._container);
                this._textbox.textContent = text;
                this._textbox.style.right = '80px';
                this._textbox.style.height = '250px';  // Ensure consistent height

                // Copy-to-clipboard functionality
                L.DomEvent.on(this._textbox, 'click', function(e) {
                    L.DomEvent.stop(e);  // Prevent map click event

                    // Execute copy-to-clipboard
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(this._textbox.textContent).then(() => {
                            showNotification('Text copied to clipboard!');
                        }).catch(err => {
                            showNotification('Failed to copy data: ' + err);
                        });
                    } else {
                        // Fallback for older browsers
                        const textarea = document.createElement('textarea');
                        textarea.value = this._textbox.textContent;
                        document.body.appendChild(textarea);
                        textarea.select();
                        try {
                            document.execCommand('copy');
                            showNotification('Text copied to clipboard!');
                        } catch (err) {
                            showNotification('Failed to copy data: ' + err);
                        }
                        document.body.removeChild(textarea);
                    }
                }, this);  // Pass correct context to this function
            } else {
                this._textbox.style.display = 'block';  // Show the text box if hidden
                this._textbox.textContent = text;
            }
        },

        _handleMapClick: function(e) {
            let chunkCoords = this._getChunkCoords(e.latlng.lat, e.latlng.lng);
            if (chunkCoords) {
                let { chunkString, plane } = chunkCoords;

                // Add chunk if it doesn't exist
                if (!this.chunks[chunkString]) {
                    this.chunks[chunkString] = new Set();
                }

                // Add plane to the chunk
                this.chunks[chunkString].add(plane);

                // Update the textbox with the current chunk data
                this._updateTextbox();
            }
        },

        _getChunkCoords: function(lat, lng) {
            let globalX = parseInt(lng);
            let globalY = parseInt(lat);
            let plane = this._map.getPlane();  // Assuming a method that returns the current plane

            // Convert the coordinates to chunk coordinates
            let converted = this.convert(plane, globalX, globalY);
            let chunkString = `${converted.i}-${converted.j}`;  // Format chunk as "40-49" etc.

            return { chunkString, plane };
        },

        _updateTextbox: function() {
            let chunkData = 'new MapChunk(new String[]{\n';  // Initialize chunk data

            // Collect all unique chunks and planes
            let chunkStrings = [];
            let planesSet = new Set();

            for (let chunk in this.chunks) {
                chunkStrings.push(`    "${chunk}"`);
                this.chunks[chunk].forEach(plane => planesSet.add(plane));
            }

            // Format chunk data with indentation
            chunkData += chunkStrings.join(',\n') + '\n}, "';
            chunkData += Array.from(planesSet).sort().join('", "') + '");\n';

            // Update the text box with the formatted chunk data
            this._textbox.innerHTML = `<pre>${chunkData}</pre>`;
        },

        // Coordinate conversion functions (same as used in position.js)
        convert: function(_plane, _globalX, _globalY) {
            return {
                plane: _plane,
                i: _globalX >> 6,
                j: _globalY >> 6,
                x: _globalX & 0x3F,
                y: _globalY & 0x3F,
            };
        },

        deConvert: function(_plane, _i, _j, _x, _y) {
            return {
                plane: _plane,
                globalX: _i << 6 | _x,
                globalY: _j << 6 | _y
            };
        }
    });

    // Add controls to the map in the desired order
    runescape_map.addControl(new L.Control.AreaGeneration({ position: 'topright' }));
    runescape_map.addControl(new L.Control.PathGeneration({ position: 'topright' }));
    runescape_map.addControl(new L.Control.ChunkSelector({ position: 'topright' }));

    L.control.display.OSRSvarbits({
        show3d: true,
    }).addTo(runescape_map);

    L.control.display.objects({
        folder: "data_osrs",
        show3d: true,
        displayLayer: L.objects.osrs
    }).addTo(runescape_map);

    L.control.display.npcs({
        folder: "data_osrs",
        show3d: true,
    }).addTo(runescape_map);

    L.tileLayer.main('layers_osrs/mapsquares/-1/{zoom}/{plane}_{x}_{y}.png', {
        minZoom: -4,
        maxNativeZoom: 4,
        maxZoom: 8,
    }).addTo(runescape_map).bringToBack();

    let nomove = L.tileLayer.main('layers_osrs/nomove/-1/{zoom}/{plane}_{x}_{y}.png', {
        minZoom: -4,
        maxNativeZoom: 2,
        maxZoom: 8,
    });

    let objects = L.tileLayer.main('layers_osrs/locations/-1/{zoom}/{plane}_{x}_{y}.png', {
        minZoom: -4,
        maxNativeZoom: 2,
        maxZoom: 8,
    });

    let multimap = L.tileLayer.main('layers_osrs/multimap/-1/{zoom}/{plane}_{x}_{y}.png', {
        minZoom: -4,
        maxNativeZoom: 2,
        maxZoom: 8,
    });

    let implings = L.tileLayer.main('layers_osrs/implings/-1/{zoom}/{plane}_{x}_{y}.png', {
        minZoom: -4,
        maxNativeZoom: 2,
        maxZoom: 8,
    });

    let grid = L.grid({
        bounds: [[0, 0], [12800, 6400]],
    });

    let crowdsourcetransports = L.crowdSourceMovement({
        data: "data_osrs/transports_osrs.json",
        show3d: false,
        minZoom: -4
    });
    let crowdsourceteles = L.crowdSourceMovement({
        data: "data_osrs/teleports_osrs.json",
        show3d: false,
        minZoom: -4
    });

    let spheres = L.crowdSourceMovement({
        data: "data_osrs/osrs_spheres.json",
        show3d: false,
        minZoom: -4
    });

    let npcs = L.dynamicIcons({
        dataPath: "data_osrs/NPCList_OSRS.json",
        minZoom: -3,
    });

    let labels = L.maplabelGroup({
        API_KEY: "AIzaSyBrYT0-aS9VpW2Aenm-pJ2UCUhih8cZ4g8",
        SHEET_ID: "1859HuKw5dXqmfakFd6e6kQ_PEXQA02namB4aNVQ0qpY",
    });


    const defaults = {
        minZoom: -3,
        maxNativeZoom: 2,
        maxZoom: 6,

    };



    let chunks = L.tileLayer('layers/small_grid/{z}.png', defaults);

        L.control.layers.urlParam({}, {
            "labels": labels,
        "crowdsourcetransports": crowdsourcetransports,
        "crowdsourceteles": crowdsourceteles,
        "multimap": multimap,
        "implings": implings,
        "spheres": spheres,
        "nomove": nomove,
        "objects": objects,
        "npcs": npcs,
        "grid": grid,
        "chunks": chunks
    }, {
        collapsed: true,
        position: 'bottomright'
    }).addTo(runescape_map);

}
(this || window);
