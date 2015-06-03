var MapViewModel = {
	init: function() {
		var mapOptions = {
	    	zoom: 8,
	    	center: new google.maps.LatLng(-34.397, 150.644)
	  	};

	  	this.marker = {};
		this.map = new google.maps.Map(document.getElementById('mapView'),
	    	mapOptions);

		this.bounds = new google.maps.LatLngBounds();
		this.infowindow = new google.maps.InfoWindow({
	      content: ''
		});
		// start the marker placement
		//this.getPlaces();
		//this.placeMarker();
	},

	placeMarkers: function() {
		//console.log('foo');
		//console.log(AppViewModel().placeList()[0]);
	},

	getPlaces: function() {
		// find bio locations on the google map
		var service = new google.maps.places.PlacesService(this.map);

		for (i=0; i<locations.length; i++) {
			var request = {
		    	query: locations[i].name + " " + locations[i].address
		  	};
	  		service.textSearch(request, this.textCallback);
		}
	},

	placeDetails: function(place_id) {
		//console.log(marker, place_id);
		var request = {
		  placeId: place_id
		};
		var service = new google.maps.places.PlacesService(this.map);
		service.getDetails(request, this.detailsCallback);
	},

	textCallback: function(results, status) {
		if (status == google.maps.places.PlacesServiceStatus.OK) {
	    	MapViewModel.createMarker(results[0]);
			//console.log(results[0]);
			//MapViewModel.placeDetails(results[0].place_id);
	    }
	},

	detailsCallback: function(results, status) {
		console.log('details callback', status);
		if (status == google.maps.places.PlacesServiceStatus.OK) {
			//console.log(results);
			MapViewModel.setInfowindow(results);
			//MapViewModel.infowindow.open(this.map, this.marker);
		}
	},

	setInfowindow: function(placeData) {
    	//console.log(placeData);
    	var url = '';
    	if (placeData.photos) {
    		url = placeData.photos[0].getUrl({'maxWidth': 300, 'maxHeight': 200});
    	}

    	var money = ' ';
    	for (i = 0; i < placeData.price_level; i++) {
    		money += "$";
    	}

    	MapViewModel.infowindow.setContent(
    		'<div>' +
    		'<h2>' + placeData.name + '</h2>' +
    		'<img alt="" src="'+url+'">' +
    		'<p>' + placeData.formatted_address + '</p>' +
    		'<strong>' + placeData.rating + money + '</strong>' +
    		'<p>' + placeData.formatted_phone_number + '</p>' +
    		'</div>'
    	);

    	MapViewModel.infowindow.open(this.map, this.marker);

	},

	createMarker: function(placeData) {
	    // places markers on the map
	    var lat = placeData.location.lat;
	    var lon = placeData.location.lng;

	    var name = placeData.name;
	    var address = placeData.address;


		var marker = new google.maps.Marker({
		    map: this.map,
		    position: placeData.location,
		    title: name,
		    //icon: image
			});

	    // marker click listener
	    google.maps.event.addListener(marker, 'click', function() {
	    	MapViewModel.marker = marker;
	    	MapViewModel.placeDetails(placeData.place_id);
	    });


	    this.bounds.extend(new google.maps.LatLng(lat, lon));
	    // fit the map to the new marker
	    this.map.fitBounds(this.bounds);
	    // center the map
	    this.map.setCenter(this.bounds.getCenter());
		},



};
window.onLoad = MapViewModel.init();