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
    }

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
	this.placeList = ko.observableArray([]);

	// build the places array from the static
	// formattedLocations model
	formattedLocations.forEach(function(placeItem){
		self.placeList.push( new Place(placeItem) );
	});

	this.currentPlace = ko.observable( this.placeList()[0] );

	// search bar functionality
	$("#form-search-field").submit(function(event){
		event.preventDefault();

		// temp print raw input
		var query = $("#input-search-field")[0].value.trim().toLowerCase();
		queryArray = query.split(" ");

		query = "";
		queryArray.forEach(function(queryItem) {
			query += queryItem + '|';
		});

		// remove the trailing "|"
		query = query.slice(0, -1);

		//console.log(query.slice(0, -1));


		var queryRe = new RegExp(query);
		//var queryRe = new RegExp("foo|bar|baz");

		console.log(queryRe);

		//console.log(queryRe.test("foo bar baz"));


		self.placeList().forEach(function(place){
			//console.log(place);
			//console.log(place.name(), queryRe.test( place.name().toLowerCase() ));
			//console.log(place.address(), queryRe.test( place.address().toLowerCase() ));


			if ( queryRe.test( place.name().toLowerCase() ) ) {
				console.log(place.name());
			} else if ( queryRe.test( place.address().toLowerCase() ) ) {
				console.log(place.address());
			}


		});

	});


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
};

ko.applyBindings(new AppViewModel());
