//console.log(locations[0].name);

var Place = function(data) {
	this.name = ko.observable(data.name);
	this.latLng = ko.observable(data.latLng);
	this.address = ko.observable(data.address);
};


var viewMap = {
	init: function() {
		var mapOptions = {
	    	zoom: 8,
	    	center: new google.maps.LatLng(-34.397, 150.644)
	  	};

		this.map = new google.maps.Map(document.getElementById('mapView'),
	    	mapOptions);

		this.bounds = new google.maps.LatLngBounds();
		// define a global variable used for closing info windows
		//this.infoWin;

		// start the marker placement
		this.getPlaces();
	},

	getPlaces: function() {
		// find bio locations on the google map
		var service = new google.maps.places.PlacesService(this.map);

		for (i=0; i<locations.length; i++) {
			var request = {
		    	query: locations[i].name + " " + locations[i].address
		  	};
	  		service.textSearch(request, this.callback);
		}
	},

	callback: function(results, status) {
		if (status == google.maps.places.PlacesServiceStatus.OK) {
	    	//return results;
	    	//console.log(results[0]);
	    	viewMap.createMarker(results[0]);
	    }
	},

	createMarker: function(placeData) {
	    // places markers on the map
	    var lat = placeData.geometry.location.lat();
	    var lon = placeData.geometry.location.lng();
	    var image = {
	    	url: placeData.icon,
	    	size: new google.maps.Size(48, 48),
	    	//origin: new google.maps.Point(12,12),
	    	//anchor: new google.maps.Point(0, 12),
	    	scaledSize: new google.maps.Size(24, 24),
	    };
	    var name = placeData.name;
	    //var name = placeData.formatted_address;
		var marker = new google.maps.Marker({
		    map: this.map,
		    position: placeData.geometry.location,
		    title: name,
		    //icon: image
			});

	    var infoWindow = new google.maps.InfoWindow({
	      content: name
	    });

	    // marker click listener
	    google.maps.event.addListener(marker, 'click', function() {
		    // first close any previously opened info windows
		    if (viewMap.infoWin) {
		    	viewMap.infoWin.close();
		    }

	    	infoWindow.open(this.map, marker);
	    	viewMap.infoWin = infoWindow;
	    });

	    this.bounds.extend(new google.maps.LatLng(lat, lon));
	    // fit the map to the new marker
	    this.map.fitBounds(this.bounds);
	    // center the map
	    this.map.setCenter(this.bounds.getCenter());
		}
};
window.onLoad = viewMap.init();