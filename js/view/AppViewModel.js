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
			infowindow = new google.maps.InfoWindow();
			infowindow.setContent($('#placeTmpl')[0]);

		// iteratively place the markers
        value.locations().forEach(function(placeItem){
			var marker = new google.maps.Marker({
			    map: map,
			    position: placeItem.location(),
			    title: placeItem.name(),
				});

			// save this marker and map to the place observable
			placeItem.marker(marker);
			placeItem.markerStyle();

			// save the map and infowindow to the viewModel
			viewModel.map(map);
			viewModel.infowindow(infowindow);

			// save a reference to the info window div
			var $node = $('#placeTmpl');

			// add the marker click event
			google.maps.event.addListener(marker, 'click', function() {
	    		// set the current place from here because we
	    		// have the place observable
	    		viewModel.loadPlace(placeItem);
	    	});

			google.maps.event.addListener(infowindow, "closeclick", function() {
			    //google maps will destroy this node and knockout will stop updating it
			    //add it back to the body so knockout will take care of it
			    $("body").append($node);
			    viewModel.hidePlaceTempl();
			});

        });

        // center the map
	    viewModel.focusMap();

		// Add a basic style.
		map.data.setStyle(function(feature) {
			return /** @type {google.maps.Data.StyleOptions} */({
				icon: {
					path: google.maps.SymbolPath.CIRCLE,
					scale: 10,
					fillColor: '#f00',
					fillOpacity: 0.35,
					strokeWeight: 0
				}
			});
		});
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

	this.markerStyle = function() {
		/*
			styles the marker symbol color based on place age
		*/
		var old = [212, 100, 20];
		var young = [212, 100, 80];

		// these are hardcoded from the locations list
		var earlierYear = 1905;
		var laterYear = 1991;

		// calculate normalized age
		var blend = (Math.min(this.year(), laterYear) - earlierYear) / (laterYear - earlierYear);

		// I want to reshape the curve to account for the heavily "younger" sample
		blend = Math.pow(blend, 1.5);

		// save this normalized age for styling effects
		this.age = Math.max(1-blend, 0.25);

		// calculate color
		var color = this.interpolateHsl(old, young, blend);

		// feed color to symbol
		this.makeSymbol(color);
	};

	this.animateMarker = function() {
		/*
			simple animation on marker symbol
		*/
		var icon = this.marker().getIcon();
		var scale = 0;
		var origScale = icon.scale;

		this.frame = function() {
			// increment scale
			scale++;
			icon.scale = origScale * (scale/10);

			// apply icon and close loop
			self.marker().setIcon(icon);
			if (scale == 10) {
				clearInterval(animate);
			}
		};

		var animate = setInterval(this.frame, 20);
	};

	this.interpolateHsl = function(lowHsl, highHsl, fraction) {
		/*
			blend between two hsl colors
		*/
		var color = [];
		for (var i = 0; i < 3; i++) {
			// Calculate color based on the fraction.
			color[i] = (highHsl[i] - lowHsl[i]) * fraction + lowHsl[i];
		}

		return 'hsl(' + color[0] + ',' + color[1] + '%,' + color[2] + '%)';
	};

	this.makeSymbol = function(color) {
 		/*
 			make a custom marker symbol
 		*/
 		var icon = {
 			path: google.maps.SymbolPath.CIRCLE,
 			scale: 3 + 8 * this.age,
 			strokeColor: "black",
 			strokeOpacity: 0.9,
 			strokeWeight: 1,
 			fillColor: color,
 			fillOpacity: 0.8 * this.age,
 		};
 		this.marker().setIcon(icon);
	};
};

PlaceInfo = function() {
	/*
		this single object stores asynchronous ajax injections
	*/
	var self = this;
	this.name = ko.observable();
	this.year = ko.observable();
	this.address = ko.observable();
	this.location = ko.observable();
	this.neighborhoods = ko.observableArray([]);
	this.addressItems = ko.observableArray([]);
	this.phone = ko.observable();
	this.categories = ko.observableArray([]);
	this.yelpRating = ko.observable();
	this.yelpRatingImg = ko.observable();
	this.yelpReviewCount = ko.observable();
	this.yelpReviews = ko.computed(function() {
		return self.yelpReviewCount() + " reviews";
	});
	this.yelpPic = ko.observable();
	this.yelpUrl = ko.observable();
	this.yelpLogo = "https://s3-media2.fl.yelpcdn.com/assets/srv0/developer_pages/55e2efe681ed/assets/img/yelp_logo_50x25.png";
	this.flickrPics = ko.observableArray([]);

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

	this.searchQuery = ko.observable();

	// initialize the default locations
	formattedLocations.forEach(function(placeItem){
		self.allPlaces.push( new Place(placeItem) );
	});

	this.currentPlace = ko.observable( this.placeList()[0] );


	this.performSearch = function() {
		self.formatSearch();
		self.searchPlaces();
	};

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
		// clear search form
		$("#input-search-field").val("");

		// reset default list of places
		self.defaultPlaces();

		// put the default places' markers back on the map
		this.allPlaces().forEach(function(placeItem){
			placeItem.marker().setMap(self.map());
		});

		// refocus the map
		this.focusMap();
	};

	this.focusMap = function() {
		/*
			centers the map on the currently visable markers
		*/
		var bounds = new google.maps.LatLngBounds();
		var locations = self.placeList();
		for (i = 0; i < locations.length; i++) {
			var place = locations[i];
			var myLatLng = new google.maps.LatLng(place.location().lat, place.location().lng);
			bounds.extend(myLatLng);
		}

	    self.map().fitBounds(bounds);
	    self.map().setCenter(bounds.getCenter());
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

		// replace active places with search results
		self.placeList(tempArray);
		self.focusMap();
	};

	this.formatSearch = function() {
		/*
			produces a usable regular expression from the search input
		*/

		// format the temp raw input
		var query = this.searchQuery().trim().toLowerCase();

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
			sets the currently selected place when called from either a list
			entry or google map marker click
		*/
		// `place` paramater is passed from a marker click event,
		// otherwise `this` evaluates to the bound list item
		if (!place) {place = this;}

		// selection actions
		// clear contents and set current place
		self.clearInfoWindowContents();
		self.currentPlace(place);
		self.currentPlace().animateMarker();

		// invoke api requests
		self.yelpRequest(place);
		self.flickrRequest(place);

		// display api info
		self.openInfowin();
		self.showPlaceTempl();

		// load place info based on current selected place
		self.placeInfo().name(self.currentPlace().name());
		self.placeInfo().year(self.currentPlace().year());
		self.placeInfo().address(self.currentPlace().address());
		self.placeInfo().location(self.currentPlace().location());
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
                self.injectYelpResult(result);
            }
        });
	};


	this.flickrRequest = function(place) {
		/*
			request a few relevant photos from Flickr
		*/
		var endpoint = "https://api.flickr.com/services/rest/?";
		var key = "3e3c69be991d3241319ef92adac0855e";
		var secret = "964e876111b73fdd";
		var method = "&method=flickr.photos.search";
		var query = "&text=" + place.name();
		var format = "&format=json";
		var number = "&per_page=8";
		var requestUrl = endpoint + method + query + "&api_key=" + key + number + format;

		$.ajax({
			url: requestUrl,
			type: "GET",
			cache: true,
			dataType: "jsonp",
			jsonp: "jsoncallback",
			success: function(result) {
				self.parseFlickrPhotos(result);
			}
		});
	};

	this.injectYelpResult = function(data) {
		/*
			update the corresponding place info using the returned
			Yelp api call
		*/
		var addressitems = [];
		var categoryitems = [];

		// in case there's a second address item include it
		for (i=0; i<data.location.address.length; i++) {
			addressitems.push(data.location.address[i]);
		}

		// address is city + state + zip
		addressitems.push(data.location.city+" "+data.location.state_code+", "+data.location.postal_code)

		// build an array of place categories
		for (i=0; i<data.categories.length; i++) {
			var categoryString = data.categories[i][0];
			if (i != (data.categories.length)-1) {
				categoryString += ",";
			}

			categoryitems.push(categoryString);
		}

		this.placeInfo().neighborhoods(data.location.neighborhoods);
		this.placeInfo().addressItems(addressitems);
		this.placeInfo().yelpRatingImg(data.rating_img_url);
		this.placeInfo().phone(data.display_phone);
		this.placeInfo().categories(categoryitems);
		this.placeInfo().yelpRating(data.rating);
		this.placeInfo().yelpRatingImg(data.rating_img_url);
		this.placeInfo().yelpReviewCount(data.review_count);
		this.placeInfo().yelpPic(data.image_url);
		this.placeInfo().yelpUrl(data.url);

	};

	this.parseFlickrPhotos = function(response) {
		/*
			takes the Flickr api response and updates the data bind with
			the corresponding image url array
		*/

		if (response.stat != "ok") {
			console.log("error retriving Flickr respose");
			console.log(response);
			return 1;
		}

		var photoJsonArray = response.photos.photo;
		var photoUrlArray = [];

		for(i=0; i<photoJsonArray.length; i++) {
			var farm = photoJsonArray[i].farm;
			var id = photoJsonArray[i].id;
			var owner =  photoJsonArray[i].owner;
			var secret = photoJsonArray[i].secret;
			var server = photoJsonArray[i].server;

			var picUrl = "https://farm"+farm+".staticflickr.com/"+server+"/"+id+"_"+secret+"_q.jpg";
			var picLinkUrl = "https://www.flickr.com/photos/"+owner+"/"+id;
			photoUrlArray.push([picUrl, picLinkUrl]);
		}

		// send the resulting image urls to the data bind
		self.placeInfo().flickrPics(photoUrlArray);
	};


	this.openInfowin = function() {
		this.infowindow().open(this.map(), this.currentPlace().marker());
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
		this.placeInfo().flickrPics([]);

	};


	this.hidePlaceTempl = function() {
		/*
			when the placeTempl div is part of the body we don't want to
			see it, only when it is attached to the info window
		*/
		$('#placeTmpl')[0].style.display = "none";
	};

	this.showPlaceTempl = function() {
		$('#placeTmpl')[0].style.display = "initial";
	};

	$(window).resize(function() {
		self.focusMap();
	});


	// initial calls once AppViewModel is defined
	this.defaultPlaces();
	this.hidePlaceTempl();
};

ko.applyBindings(new AppViewModel());
