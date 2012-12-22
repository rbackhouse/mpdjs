define([
		'jquery', 
		'backbone',
		'underscore', 
		'text!templates/AlbumList.html'], 
function($, Backbone, _, template){
	var View = Backbone.View.extend({
		initialize: function(options) {
			this.template = _.template( template, { albums: options.albums.toJSON() } );
		},
		render: function(){
			$(this.el).html( this.template );
		}
	});
	
	return View;
});
