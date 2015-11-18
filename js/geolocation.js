function geolocate() {

    function success(position) {
        var lat = position.coords.latitude;
        var lon = position.coords.longitude;
        console.log([lat, lon]);
        map.setView([lat, lon], 9);
    }
    function error() {
        map.setView([39.8282, -98.5795], 4);
    }
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(success, error);
    }
}