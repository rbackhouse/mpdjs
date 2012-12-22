define(['backbone'], function(Backbone) {
	var Album = Backbone.Model.extend({
		defaults: {
			artist: null,
			name: null
		}
	});
	
	return Album;
});
