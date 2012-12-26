define(['backbone'], function(Backbone){
	var Song = Backbone.Model.extend({
		defaults: {
			title: null,
			track: 0,
			time: null,
			file: null,
			b64file: null
		}
	});
	
	return Song;
});
