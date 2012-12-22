define(['backbone', './Album'], function(Backbone, Album){
	var AlbumList = Backbone.Collection.extend({
		initialize: function(options) {
			this.artist = options.artist;
		},
		model: Album,
		url: function() {
			return "./music/albums/"+(this.artist === undefined ? "" : this.artist);
		}
	});
	return AlbumList;
});
