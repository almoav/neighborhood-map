ko.bindingHandlers.googlemap = {
    init: function (element, valueAccessor, allBindings, viewModel) {
        var
          value = valueAccessor(),
          mapOptions = {
            zoom: 10,
            center: new google.maps.LatLng(value.centerLat, value.centerLon),
            mapTypeId: google.maps.MapTypeId.ROADMAP
            },
          map = new google.maps.Map(element, mapOptions);
          bounds = new google.maps.LatLngBounds();

        value.locations().forEach(function(placeItem){
        	// place the new marker
			var marker = new google.maps.Marker({
			    map: map,
			    position: placeItem.location(),
			    title: placeItem.name(),
				});

			// add the marker click event
			google.maps.event.addListener(marker, 'click', function() {
	    		// set the current place from here because we
	    		// have the place object
	    		viewModel.currentPlace(placeItem);
	    	});

			// fit the new marker in the map
	    	var lat = placeItem.location().lat;
	    	var lng = placeItem.location().lng;
	    	bounds.extend(new google.maps.LatLng(lat, lng));
        });

        // center the map
	    map.fitBounds(bounds);
	    map.setCenter(bounds.getCenter());
    }
};


Place = function(data) {
	var self = this;
	this.name = ko.observable(data.name);
	this.year = ko.observable(data.year);
	this.address = ko.observable(data.address);
	this.location = ko.observable(data.location);
	this.place_id = ko.observable(data.place_id);

	//app.MapViewModel.createMarker(data, this);

};


AppViewModel = function() {
	//placelist: ko.observableArray([]),
	var self = this;
	this.placeList = ko.observableArray([]);

	formattedLocations.forEach(function(placeItem){
		self.placeList.push( new Place(placeItem) );
	});

	this.currentPlace = ko.observable( this.placeList()[0] );

	this.loadPlace = function() {
		self.currentPlace(this);
	};
};

ko.applyBindings(new AppViewModel);
