var mapBounds = [[0.17578097424708533,-214.98046875],[73.82482034613932, 25.13671875]];
var geojsonLayer;
var map = L.map('map',{maxBounds: mapBounds});
var Stamen_TonerLite = L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.{ext}', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 20,
    ext: 'png'
});

Stamen_TonerLite.addTo(map);

var locater = L.control.locate({
    drawCircle: false,
    keepCurrentZoomLevel: true
});
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
function getInfo(e) {
    var properties = e.target.feature.properties;
    $.ajax({
        url: 'http://192.168.1.18:5000/district/',
        dataType: 'json',
        data: {
            'idcode': properties.stateabbr + properties.cd114fp
        },
        success: function(data) {
            var templateHtml =
                '<div class="candidate">' +
                    '<div class="row">' +
                '<div class="col-md-6">'+
                '    <span class="name"></span>' +
                    '</div>'+
                    '<div class="col-md-6">'+
                '    <span class="term"></span>' +
                    '</div>'+
                    '</div>'+
                    '<div class="row">' +
                '<div class="col-md-6">'+
                '    <span class="phone"></span>' +
                    '</div>'+
                    '<div class="col-md-6">'+
                '    <span class="fax"></span>' +
                    '</div>'+
                    '</div>'+
                '    <span class="contact"></span>' +
                '    <span class="website"></span>' +
                '    <div class="social">' +
                '        <span class="twitter"></span>' +
                '        <span class="facebook"></span>' +
                '    </div>' +
                '</div>';
            var infoContainer = $('#info');
            infoContainer.empty();
            data.forEach(function(e, i){
                var element = e['@attributes'];
                //console.log(e);
                infoContainer.append(templateHtml);
                var currentCandidate = $('.candidate:last');
                currentCandidate.find('.name').html('<b>'+element.firstlast+' ('+element.party+')'+'</b>');
                currentCandidate.find('.term').html('<i>First elected </i>  ' + element.first_elected);
                currentCandidate.find('.phone').html('<i class="fa fa-phone"></i>  ' + element.phone);
                currentCandidate.find('.fax').html('<i class="fa fa-fax"></i>  ' + element.fax);
                currentCandidate.find('.contact').html('<i class="fa fa-envelope"></i>  <a href="'+element.webform+'" target="_blank">Contact</a>');
                currentCandidate.find('.website').html('<i class="fa fa-share"></i>  <a href="'+element.website+'" target="_blank">Website</a>');
                currentCandidate.find('.twitter').html('<i class="fa fa-twitter"></i>  <a href="https://twitter.com/'+element.twitter_id+'" target="_blank">'+element.twitter_id+'</a>');
                currentCandidate.find('.facebook').html('<i class="fa fa-facebook"></i>  <a href="https://www.facebook.com/'+element.facebook_id+'" target="_blank">'+element.firstlast+'</a>');
            });

            foo = data;
            console.log(data);
        },
        error: function(error) {
            $('#info').html('<div class="candidate"><h2 class="text-danger bg-danger text-center">No information available</h2></div>');
        }
    });
    $('.geoid').text(properties.geoid);
    $('.state').text(properties.state);
    $('.namelsad').text(properties.namelsad);
    $('.cd114fp').text(properties.stateabbr + properties.cd114fp);
}
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: getInfo
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
locater.addTo(map);
map.setView([39.232253, -101.909179], 4);