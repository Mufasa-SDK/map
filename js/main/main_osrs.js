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
            notification.style.bottom = '20px';
            notification.style.right = '20px';
            notification.style.background = 'rgba(0, 0, 0, 0.7)';
            notification.style.color = 'white';
            notification.style.padding = '10px';
            notification.style.borderRadius = '5px';
            notification.style.zIndex = '2000';
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
            var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
            var link = L.DomUtil.create('a', '', container);
            link.href = '#';
            link.title = 'Generate Area';
            link.innerHTML = 'Area';
            L.DomEvent.on(link, 'click', L.DomEvent.stop)
                      .on(link, 'click', function() {
                          this._toggleTextbox('Area generation data...');
                      }, this);
            return container;
        },

        _toggleTextbox: function(text) {
            if (!this._textbox) {
                this._textbox = L.DomUtil.create('div', 'textbox-container', this._map._container);
                this._textbox.textContent = text;
                L.DomEvent.on(this._textbox, 'click', function() {
                    navigator.clipboard.writeText(this.textContent);
                    alert('Text copied to clipboard!');
                });
            } else {
                if (this._textbox.style.display === 'none') {
                    this._textbox.style.display = 'block';
                    this._textbox.textContent = text;
                    this._textbox.style.right = '80px'; // Adjusted right positioning
                    this._textbox.style.height = '250px'; // Ensure consistent height
                } else {
                    this._textbox.style.display = 'none';
                }
            }
        }
    });

    L.Control.PathGeneration = L.Control.extend({
        onAdd: function(map) {
            var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
            var link = L.DomUtil.create('a', '', container);
            link.href = '#';
            link.title = 'Generate Path';
            link.innerHTML = 'Path';
            L.DomEvent.on(link, 'click', L.DomEvent.stop)
                      .on(link, 'click', function() {
                          this._toggleTextbox('Path generation data...');
                      }, this);
            return container;
        },

        _toggleTextbox: function(text) {
            if (!this._textbox) {
                this._textbox = L.DomUtil.create('div', 'textbox-container', this._map._container);
                this._textbox.textContent = text;
                L.DomEvent.on(this._textbox, 'click', function() {
                    navigator.clipboard.writeText(this.textContent);
                    alert('Text copied to clipboard!');
                });
            } else {
                if (this._textbox.style.display === 'none') {
                    this._textbox.style.display = 'block';
                    this._textbox.textContent = text;
                    this._textbox.style.right = '80px'; // Adjusted right positioning
                    this._textbox.style.height = '250px'; // Ensure consistent height
                } else {
                    this._textbox.style.display = 'none';
                }
            }
        }
    });

    L.Control.ChunkSelector = L.Control.extend({
        onAdd: function(map) {
            var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
            var link = L.DomUtil.create('a', '', container);
            link.href = '#';
            link.title = 'Select Chunks';
            link.innerHTML = 'Chunk';
            L.DomEvent.on(link, 'click', L.DomEvent.stop)
                      .on(link, 'click', function() {
                          this._toggleTextbox('Chunk selection activated...');
                      }, this);
            return container;
        },

        _toggleTextbox: function(text) {
            if (!this._textbox) {
                this._textbox = L.DomUtil.create('div', 'textbox-container', this._map._container);
                this._textbox.textContent = text;
                L.DomEvent.on(this._textbox, 'click', function() {
                    navigator.clipboard.writeText(this.textContent);
                    alert('Text copied to clipboard!');
                });
            } else {
                if (this._textbox.style.display === 'none') {
                    this._textbox.style.display = 'block';
                    this._textbox.textContent = text;
                    this._textbox.style.right = '80px'; // Adjusted right positioning
                    this._textbox.style.height = '250px'; // Ensure consistent height
                } else {
                    this._textbox.style.display = 'none';
                }
            }
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
