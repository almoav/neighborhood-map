var geocodeLocations = function() {
	// run a geocode search on our locations array and save for later
	var self = this;
	this.formattedLocations = [];

	locations.forEach(function(placeItem){
		var location = {};
		var placeInfo = {};

		mapUrl = "https://maps.googleapis.com/maps/api/geocode/json?address=" + placeItem.address + "&key=AIzaSyBAjev0Cj1NaUQqYngMZvSPQ4kzHkMiuns";
		$.getJSON( mapUrl, function(data){
			// save the raw geocode result
			placeInfo = data.results[0];

			placeItem.address = placeInfo.formatted_address;
			placeItem.place_id = placeInfo.place_id;
			placeItem.location = placeInfo.geometry.location;

			console.log('"name" : "' + placeItem.name + '",');
			console.log('"year" : ', placeItem.year + ',');
			console.log('"location" : ', placeItem.location);
			console.log('"place_id" : "' + placeItem.place_id + '",');
			console.log('"address" : "' + placeItem.address + '",');
			console.log('"link" : "' + placeItem.link + '"');
			console.log("");
		});
	});
};



var locations = [
	{
		"year" : 1925,
		"link" : "http://en.wikipedia.org/wiki/Formosa_Cafe",
		"name" : "Formosa Cafe",
		"address" : "7156 Santa Monica Boulevard, West Hollywood, CA 90046", "comment" : "Opened by a prize fighter in an old red trolley car, it has kept its vintage integrity"
	}
];

window.onLoad = geocodeLocations();
