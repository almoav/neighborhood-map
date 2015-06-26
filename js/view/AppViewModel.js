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
			infowindow.setContent($('#placeTmpl')[0]);

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

			// save a reference to the info window div
			var $node = $('#placeTmpl');

			// add the marker click event
			google.maps.event.addListener(marker, 'click', function() {
	    		// set the current place from here because we
	    		// have the place observable

	    		//TODO replace viewModel with bindingsContext.$data
	    		//$('#placeTmpl')[0].style.visibility = "visible";
	    		viewModel.loadPlace(placeItem);
	    		viewModel.showPlaceTempl();
	    	});



			google.maps.event.addListener(infowindow, "closeclick", function() {
			    //google maps will destroy this node and knockout will stop updating it
			    //add it back to the body so knockout will take care of it
			    //$('#placeTmpl')[0].style.visibility = "hidden";
			    $("body").append($node);
			    viewModel.hidePlaceTempl();

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
	/*
		stores map information for each of the entries in the
		master locations list
	*/
	var self = this;
	this.name = ko.observable(data.name);
	this.year = ko.observable(data.year);
	this.address = ko.observable(data.address);
	this.location = ko.observable(data.location);
	this.place_id = ko.observable(data.place_id);
	this.marker = ko.observable();
};

PlaceInfo = function() {
	/*
		this single object stores asynchronous ajax injections
	*/
	var self = this;
	this.name = ko.observable();
	this.year = ko.observable();
	this.address = ko.observable();
	this.addressItems = ko.observableArray([]);
	this.phone = ko.observable();
	this.yelpRating = ko.observable();
	this.yelpRatingImg = ko.observable();
	this.yelpReviewCount = ko.observable();
	this.yelpReviews = ko.computed(function() {
		return self.yelpReviewCount() + " reviews";
	});
	this.yelpPic = ko.observable();
	this.yelpUrl = ko.observable();
	this.yelpLogo = "https://s3-media2.fl.yelpcdn.com/assets/srv0/developer_pages/55e2efe681ed/assets/img/yelp_logo_50x25.png";

};

AppViewModel = function() {
	var self = this;

	// the google map object
	this.map = ko.observable();

	// the map's info window and corresponding place info
	this.infowindow = ko.observable();
	this.placeInfo = ko.observable(new PlaceInfo());

	// save a list of all places as well as currently displayed places list
	this.allPlaces = ko.observableArray([]);
	this.placeList = ko.observableArray([]);


	// initialize the default locations
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
		$("#input-search-field").val("");
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
		/*
			produces a usable regular expression from the search input
		*/

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
		/*
			I need to be able to pass a `place` observable from
			a map marker click event, `this` evaluates to the
			observable when called from the data-bind
		*/
		if (!place) {place = this;}


		// selection actions
		self.clearInfoWindowContents();
		self.currentPlace(place);
		self.yelpRequest(place);
		self.openInfowin();

		// load place info based on current selected place
		self.placeInfo().name(self.currentPlace().name());
		self.placeInfo().year(self.currentPlace().year());
		self.placeInfo().address(self.currentPlace().address());
	};


	this.yelpRequest = function(place) {
        /*
			example taken from user Prem on the Yelp Developer Support Google Group
        	https://groups.google.com/d/msg/yelp-developer-support/5bDrWXWJsqY/Lq8LuEUcwV8J
		*/
        var auth = {
            //
            // Update with your auth tokens.
            //
            consumerKey : "UPITOVcuqa7ITFvi9F_VmQ",
            consumerSecret : "Z_b_M4P88tqLICBop8xHneurMiw",
            accessToken : "FYjhUY0SrBGglo6pBIDmuptyVaX8awLR",
            // This example is a proof of concept, for how to use the Yelp v2 API with javascript.
            // You wouldn't actually want to expose your access token secret like this in a real application.
            accessTokenSecret : "70VR_08Wvq8zUn0ygQlEL5XyQr0",
            serviceProvider : {
                signatureMethod : "HMAC-SHA1"
            }
        };

        var terms = place.name();
        var near = 'Los+Angeles';

        var accessor = {
            consumerSecret : auth.consumerSecret,
            tokenSecret : auth.accessTokenSecret
        };
        parameters = [];
        parameters.push(['term', terms]);
        parameters.push(['location', near]);
        parameters.push(['callback', 'cb']);
        parameters.push(['oauth_consumer_key', auth.consumerKey]);
        parameters.push(['oauth_consumer_secret', auth.consumerSecret]);
        parameters.push(['oauth_token', auth.accessToken]);
        parameters.push(['oauth_signature_method', 'HMAC-SHA1']);

        var message = {
            'action' : 'http://api.yelp.com/v2/search',
            'method' : 'GET',
            'parameters' : parameters
        };

        OAuth.setTimestampAndNonce(message);
        OAuth.SignatureMethod.sign(message, accessor);

        var parameterMap = OAuth.getParameterMap(message.parameters);

        $.ajax({
            'url' : message.action,
            'data' : parameterMap,
            'dataType' : 'jsonp',
            'jsonpCallback' : 'cb',
            'success' : function(data, textStats, XMLHttpRequest) {
                result = data.businesses[0];

                // update the place info with the returned result
                self.setInfoWindowContents(result);
            }
        });
	};

	this.clearInfoWindowContents = function() {
		/*
			sets api dependent info to blank while waiting for a response
		*/
		this.placeInfo().addressItems("");
		this.placeInfo().yelpRatingImg("");
		this.placeInfo().phone("");
		this.placeInfo().yelpRating("");
		this.placeInfo().yelpRatingImg("");
		this.placeInfo().yelpReviewCount("");
		this.placeInfo().yelpPic("");
		this.placeInfo().yelpUrl("");

	};

	this.setInfoWindowContents = function(data) {
		/*
			update the corresponding place info using the returned
			Yelp api call
		*/
		//console.log(data);
		this.placeInfo().addressItems(data.location.display_address);
		this.placeInfo().yelpRatingImg(data.rating_img_url);
		this.placeInfo().phone(data.display_phone);
		this.placeInfo().yelpRating(data.rating);
		this.placeInfo().yelpRatingImg(data.rating_img_url);
		this.placeInfo().yelpReviewCount(data.review_count);
		this.placeInfo().yelpPic(data.image_url);
		this.placeInfo().yelpUrl(data.url);

	};

	this.openInfowin = function() {
		this.infowindow().open(this.map(), this.currentPlace().marker());
	};

	this.hidePlaceTempl = function() {
		/*
			when the placeTempl div is part of the body we don't want to
			see it, only when it is attached to the info window
		*/
		//$('#placeTmpl')[0].style.visibility = "hidden";
		$('#placeTmpl')[0].style.display = "none";
	};

	this.showPlaceTempl = function() {
		$('#placeTmpl')[0].style.display = "initial";
		//$('#placeTmpl')[0].style.visibility = "visible";
	};



	// after everything is initialized load the default places
	this.defaultPlaces();
	this.hidePlaceTempl();
};

ko.applyBindings(new AppViewModel());
