'use strict'
// This module controls the City of Boston newsletter component
// ---------------------------
var BostonMap = (function () {
  var map = [];

  function createPopup (p) {
    return function (layer) { return L.Util.template(p, layer.feature.properties); };
  }

  function createLegend(d) {
    return function (map) { return d; };
  }

  function toggleMap(e, mapContainer) {
    e.preventDefault();

    var isActive = Boston.hasClass(mapContainer, 'is-active');

    if (isActive) {
      mapContainer.className = 'mp';
    } else {
      mapContainer.className = 'mp is-active';
    }
  }

  function initMap(mapContainer) {
    var map = Boston.childByEl(mapContainer, 'map');
    var button = Boston.childByEl(mapContainer, 'mp-v');
    var close = Boston.childByEl(mapContainer, 'mp-e');

    if (button.length > 0 && close.length > 0) {
      // Toggle the view
      button[0].addEventListener('click', function (e) {
        toggleMap(e, mapContainer);
      });

      // Toggle the view
      close[0].addEventListener('click', function (e) {
        toggleMap(e, mapContainer);
      });
    }

    // Get array of map objects from Drupal.
    var mapJSON = mapData[map[0].id];
    console.log(mapJSON);

    // Convert JSON into javascript object.
    var mapObj = JSON.parse(mapJSON);
    // Set the Map ID used to create a unique canvas for each map.
    var mapID = mapObj.mapID;
    // Set ESRI Feed title, url, and color info.
    var feeds = mapObj.feeds;
    // Set Custom Pins title, desc, latitude and longitude info.
    var points = mapObj.points;
    // Set Map Options (0 = Static, 1 = Zoom).
    var mapOptions = mapObj.options;
    // Set Basemap URL.
    var basemapUrl = mapObj.basemap;
    // Set Latitude to component value if it exists, if not set to ESRI Lat, if nothing exists set hardcoded value.
    var latitude = mapObj.componentLat ? mapObj.componentLat : mapObj.esriLat ? mapObj.esriLat : 42.357004;
    // Set Longitude to component value if it exists, if not set to ESRI Lat, if nothing exists set hardcoded value.
    var longitude = mapObj.componentLong ? mapObj.componentLong : mapObj.esriLong ? mapObj.esriLong : -71.062309;
    // Set Zoom to component value if it exists, if not set to ESRI Lat, if nothing exists set hardcoded value.
    var zoom = mapObj.componentZoom ? mapObj.componentZoom : mapObj.esriZoom ? mapObj.esriZoom : 14;

    // Apply default coordinates and zoom level.
    map[map[0].id] = L.map(mapID, {zoomControl: false}).setView([latitude, longitude], zoom);

    if (mapOptions == 1) {
      // Add zoom control to bottom right.
      L.control.zoom({
        position:'bottomright'
      }).addTo(map[map[0].id]);
    }

    // Add custom pins created in Map component.
    for (var j = 0; j < points.length; j++) {
      var customPin = L.marker([points[j].lat, points[j].long]).addTo(map[map[0].id]);
      customPin.bindPopup(
        '<a class="title" href="' + points[j].url + '" target="_blank">' +
          '<b>' +
            points[j].name +
          '</b>' +
        '</a>' +
        '<p class="times">' +
          points[j].desc +
        '</p>'
      );
    }

    // Add mapbox basemap.
    L.tileLayer(basemapUrl).addTo(map[map[0].id]);

    // Set the legend position.
    var legend = L.control({position: 'topleft'});
    var div = L.DomUtil.create('div', 'info legend');

    // Add layer for ESRI feed(s) and add item for legend.
    for (var k = 0; k < feeds.length; k++) {
      // Check if pins should be clustered.
      var baseObj = (feeds[k].cluster == 1) ? L.esri.Cluster : L.esri;
      var layerObj = baseObj.featureLayer({
        url: feeds[k].url,
        style: {
          "color": feeds[k].color,
          "weight": 3
        }
      }).addTo(map[map[0].id]);
      // Create popups for pin markers
      layerObj.bindPopup(createPopup(feeds[k].popup));
      // Add item to legend.
      div.innerHTML += '<i style="background:' + feeds[k].color + '"></i> ' + feeds[k].title + '<br>';
    }

    // Add "div" variable created in loop to legend.
    legend.onAdd = createLegend(div);
    // Add legend to map.
    legend.addTo(map[map[0].id]);
  }

  function start() {
    var mapContainers = document.querySelectorAll('.mp');

    if (mapContainers.length > 0) {
      for (var i = 0; i < mapContainers.length; i++) {
        initMap(mapContainers[i]);
      }
    }
  }

  return {
    start: start
  }
})();

BostonMap.start();
