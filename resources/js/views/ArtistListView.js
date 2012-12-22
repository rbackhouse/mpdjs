define([
		'jquery', 
		'backbone',
		'underscore', 
		'text!templates/ArtistList.html'], 
function($, Backbone, _, template){
	var View = Backbone.View.extend({
		initialize: function(options) {
			this.template = _.template( template, { artists: options.artists.toJSON() } );
		},
		render: function(){
			$(this.el).html( this.template );
		}
	});
	
	return View;
});
