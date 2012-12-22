define(['backbone', './Song'], function(Backbone, Song){
	var SongList = Backbone.Collection.extend({
		initialize: function(options) {
			this.album = options.album;
		},
		model: Song,
		url: function() {
			return "./music/songs/"+(this.album === undefined ? "" : this.album);	
		}
	});
	return SongList;
});
