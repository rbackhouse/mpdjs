define(['backbone'], function(Backbone) {
	var Artist = Backbone.Model.extend({
		defaults: {
			name: null
		}
	});
	
	return Artist;
});