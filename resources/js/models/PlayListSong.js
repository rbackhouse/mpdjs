define(['backbone'], function(Backbone){
	var PlayListSong = Backbone.Model.extend({
		defaults: {
			artist: null,
			album: null,
			title: null,
			track: 0,
			time: 0,
			file: null,
			id: 0,
			pos: 0
		}
	});
	
	return PlayListSong;
});
