var mapBounds = [[0.17578097424708533,-214.98046875],[73.82482034613932, 25.13671875]];
var geojsonLayer;
var map = L.map('map',{maxBounds: mapBounds});
geolocate();
var Stamen_TonerLite = L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.{ext}', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 20,
    ext: 'png'
});

Stamen_TonerLite.addTo(map);

var geomStyle = {
    'color': '#ff7800',
    // 'fillColor': '#ff7800'
    'opacity': 0.65,
    'weight': 2,
    'fillOpacity': 0.3
};
function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
    }
}
function resetHighlight(e) {
    var layer = e.target;
    layer.setStyle(geomStyle);
}
function updateInfo(e) {
    var properties = e.target.feature.properties;
    $.ajax({
        url: 'http://192.168.1.18:5000/district/',
        dataType: 'json',
        data: {
            'idcode': properties.stateabbr + properties.cd114fp
        },
        success: function(data) {
            foo = data;
            console.log(data);
        }
    });
    $('#geoid').text(properties.geoid);
    $('#state').text(properties.state);
    $('#namelsad').text(properties.namelsad);
    $('#cd114fp').text(properties.stateabbr + properties.cd114fp);
}
function onEachFeature(feature, layer) {
    // layer.bindPopup(feature.properties.id+' '+feature.properties.namelsad);
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: updateInfo
    });
}
map.on('load', function(e) {
    $.ajax({
        url: 'http://192.168.1.18:5000/bbox',
        dataType: 'json',
        data: {
            'bbox': e.target.getBounds().toBBoxString(),
            'zoom': map.getZoom()
        },
        success: function (data) {
            geojsonLayer = L.geoJson(data, {style: geomStyle, onEachFeature: onEachFeature});
            geojsonLayer.addTo(map);
            console.log(data);
        },
        error: function (error) {
            console.log(error);
        }
    });
});

map.on('moveend', function(e) {
    $.ajax({
        url: 'http://192.168.1.18:5000/bbox',
        dataType: 'json',
        data: {
            'bbox': e.target.getBounds().toBBoxString(),
            'zoom': e.target.getZoom()
        },
        success: function (data) {
            map.removeLayer(geojsonLayer);
            console.log('removed');
            geojsonLayer = L.geoJson(data, {style: geomStyle, onEachFeature: onEachFeature});
            geojsonLayer.addTo(map);
            // geojsonData.addTo(map);
            console.log(data);
        },
        error: function (error) {
            console.log(error);
        }
    });
});