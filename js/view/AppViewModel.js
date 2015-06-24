ko.bindingHandlers.googlemap = {
    init: function (element, valueAccessor, allBindings, viewModel) {
        var
    		value = valueAccessor(),
    		mapOptions = {
    			zoom: 10,
    			center: new google.maps.LatLng(value.centerLat, value.centerLon),
    			mapTypeId: google.maps.MapTypeId.ROADMAP
			},

    		map = new google.maps.Map(element, mapOptions),
    		bounds = new google.maps.LatLngBounds(),
			infowindow = new google.maps.InfoWindow();

		// TODO separate the marker placement into an update (perhaps)
		// to handle changing markers?

		// iteratively place the markers
        value.locations().forEach(function(placeItem){
			var marker = new google.maps.Marker({
			    map: map,
			    position: placeItem.location(),
			    title: placeItem.name(),
				});

			// save this marker and map to the place observable
			placeItem.marker(marker);

			// save the map and infowindow to the viewModel
			viewModel.map(map);
			viewModel.infowindow(infowindow);

			// add the marker click event
			google.maps.event.addListener(marker, 'click', function() {
	    		// set the current place from here because we
	    		// have the place observable

	    		//TODO replace viewModel with bindingsContext.$data
	    		viewModel.loadPlace(placeItem);
	    	});

			// focus the map around the existing markers
	    	var lat = placeItem.location().lat;
	    	var lng = placeItem.location().lng;
	    	bounds.extend(new google.maps.LatLng(lat, lng));
        });

        // center the map
	    map.fitBounds(bounds);
	    map.setCenter(bounds.getCenter());
    },

};


Place = function(data) {
	var self = this;
	this.name = ko.observable(data.name);
	this.year = ko.observable(data.year);
	this.address = ko.observable(data.address);
	this.location = ko.observable(data.location);
	this.place_id = ko.observable(data.place_id);
	this.marker = ko.observable();
};


AppViewModel = function() {
	var self = this;
	this.map = ko.observable();
	this.infowindow = ko.observable();
	this.allPlaces = ko.observableArray([]);
	this.placeList = ko.observableArray([]);

	// this is the default locations
	formattedLocations.forEach(function(placeItem){
		self.allPlaces.push( new Place(placeItem) );
	});

	this.currentPlace = ko.observable( this.placeList()[0] );


	$("#form-search-field").submit(function(event){
		/*
			search bar functionality is invoked with
			form submit event
		*/
		event.preventDefault();
		self.formatSearch();
		self.searchPlaces();
	});

	$("#input-search-reset").click(function(event){
		/*
			resets the search filter
		*/
		event.preventDefault();
		self.defaultPlaces();
		self.resetMarkers();
	});

	this.defaultPlaces = function() {
		/*
			build the places array from the static
			formattedLocations model
		*/
		self.placeList(self.allPlaces());
	};

	this.resetMarkers = function() {
		/*
			places the default markers back on the map
		*/

		// TODO reset the map view to frame markers
		this.allPlaces().forEach(function(placeItem){
			placeItem.marker().setMap(self.map());
		});
	};

	this.searchPlaces = function() {
		/*
			filters the existing list of places using
			regular expressions
		*/
		var tempArray = [];
		self.placeList().forEach(function(placeItem){

			if ( self.queryRe.test( placeItem.name().toLowerCase() ) ) {
				// if the place name is a query match
				tempArray.push(placeItem);

			} else if ( self.queryRe.test( placeItem.address().toLowerCase() ) ) {
				// if the place address is a query match
				tempArray.push(placeItem);

			} else {
				// clear the map marker
				placeItem.marker().setMap(null);
			}
		});

		self.placeList(tempArray);
		// TODO frame the resulting markers
	};

	this.formatSearch = function() {
		// format the temp raw input
		var query = $("#input-search-field")[0].value.trim().toLowerCase();
		queryArray = query.split(" ");

		query = "";
		// use space delineated array as `or` regular patterns
		queryArray.forEach(function(queryItem) {
			query += queryItem + '|';
		});

		// remove the trailing "|"
		query = query.slice(0, -1);

		this.queryRe = new RegExp(query);
	};

	this.loadPlace = function(place) {
		// I need to be able to pass a `place` observable from
		// a map marker click event, `this` evaluates to the
		// observable when called from the data-bind
		if (!place) {place = this;}
		self.currentPlace(place);
		self.openInfowin();
	};

	this.printPlace = function() {
		console.log(self.currentPlace().name(), self.currentPlace().year());
	};

	this.openInfowin = function() {
		this.infowindow().setContent(
			'<h2>' + this.currentPlace().name() + ' - ' +
			this.currentPlace().year() + '</h2>' +
			'<p>' + this.currentPlace().address() + '</p>'
			);
		this.infowindow().open(this.map(), this.currentPlace().marker());
	};


	this.defaultPlaces();
};

ko.applyBindings(new AppViewModel());
