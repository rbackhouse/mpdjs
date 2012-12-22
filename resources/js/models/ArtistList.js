define(['backbone', './Artist'], function(Backbone, Artist){
	var ArtistList = Backbone.Collection.extend({
		model: Artist,
		url: "./music/artists"
	});
	return ArtistList;
});
