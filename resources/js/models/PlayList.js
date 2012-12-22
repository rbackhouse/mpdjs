define(['backbone', './PlayListSong'], function(Backbone, PlayListSong){
	var PlayList = Backbone.Collection.extend({
		model: PlayListSong,
		url: "./music/playlist"
	});
	return PlayList;
});
