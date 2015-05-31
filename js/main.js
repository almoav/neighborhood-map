
var Place = function(data) {
	this.name = ko.observable(data.name);
	this.year = ko.observable(data.year);
	this.address = ko.observable(data.address);
	this.location = ko.observable(data.location);
	this.place_id = ko.observable(data.place_id);

};


var AppViewModel = function() {
	var self = this;
	this.placeList = ko.observableArray([]);

	locations.forEach(function(placeItem){
		self.placeList.push( new Place(placeItem) );

	});

	this.currentPlace = ko.observable( this.placeList()[0] );

	this.loadPlace = function() {
		self.currentPlace(this);
		console.log(self.currentPlace().geocode());
	};
};

ko.applyBindings(new AppViewModel());
