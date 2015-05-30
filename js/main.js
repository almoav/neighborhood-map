//console.log(locations[0].name);

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
		//var locations = octopus.getMapLocations();
		//var locLen = locations.length;

		for (i=0; i<locations.length; i++) {
			var request = {
		    	query: locations[i].address
		  	};
	  		//service.textSearch(request, this.callback);
	  		service.textSearch(request, this.testfunction(locations[i]));
		}
	},

	testfunction: function(obj, results, status) {
		console.log(obj);
	},

	callback: function(results, status) {
		if (status == google.maps.places.PlacesServiceStatus.OK) {
			//console.log(results[0]);
			console.log(this);
	    	viewMap.createMarker(results[0]);
	    }
	},

	createMarker: function(placeData) {
	    // places markers on the map
	    var lat = placeData.geometry.location.lat();
	    var lon = placeData.geometry.location.lng();
	    var name = placeData.formatted_address;
		var marker = new google.maps.Marker({
		    map: this.map,
		    position: placeData.geometry.location,
		    title: name
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