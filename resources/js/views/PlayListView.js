define([
		'jquery', 
		'backbone',
		'underscore',
		'models/PlayList',
		'jquerymobile',
		'text!templates/PlayList.html',
		'text!templates/PlayListList.html'], 
function($, Backbone, _, PlayList, mobile, template, listtemplate){
	var View = Backbone.View.extend({
		events: {
			"click #previous" : function() {
				this.sendControlCmd("previous");
			},
			"click #next" : function() {
				this.sendControlCmd("next");
			},
			"click #playPause" : function() {
				this.sendControlCmd("play");
			},
			"click #stop" : function() {
				this.sendControlCmd("stop");
			},
			"click #randomButton" : "randomPlayList",
			"click #clearButton" : "clearPlayList",
			"change #volume" : "changeVolume"
		},
		initialize: function(options) {
			this.model = options.playlist;
			this.template = _.template( template, { playlist: options.playlist.toJSON() } );
		},
		render: function(){
			$(this.el).html( this.template );
		},
		randomPlayList: function() {
        	$.ajax({
        		url: "./music/playlist/random",
        		type: "PUT",
	        	contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
	        	dataType: "text",
	        	success: function(data, textStatus, jqXHR) {
		        	this.fetchPlayList(data);
	        	}.bind(this),
	        	error: function(jqXHR, textStatus, errorThrown) {
	        	}
        	});
		},
		clearPlayList: function() {
        	$.ajax({
        		url: "./music/playlist",
        		type: "DELETE",
	        	contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
	        	dataType: "text",
	        	success: function(data, textStatus, jqXHR) {
		        	this.fetchPlayList(data);
	        	}.bind(this),
	        	error: function(jqXHR, textStatus, errorThrown) {
	        	}
        	});
		},
		fetchPlayList: function(data) {
			if (data) {
				var status = JSON.parse(data);
				var volume = parseInt(status.volume);
				if (volume > -1) {
					$("#volume").val(status.volume);
				}
				if (status.currentsong) {
					$("#currentlyPlaying").text("Currently Playing ["+currentsong+"]");
				}
			}
			this.model.fetch({
				success: function(collection, response, options) {
					this.model.reset(collection.toJSON());
					this.listtemplate = _.template( listtemplate, { playlist: this.model.toJSON() } );
					this.$el.find("ol").html(this.listtemplate);
				}.bind(this),
				error: function(collection, xhr, options) {
					console.log("failed!!!");
				}
			});
		},
		changeVolume: function() {
        	$.ajax({
        		url: "./music/volume/"+$("#volume").val(),
        		type: "POST",
	        	contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
	        	dataType: "text",
	        	success: function(data, textStatus, jqXHR) {
	        	}.bind(this),
	        	error: function(jqXHR, textStatus, errorThrown) {
	        	}
        	});
		},
		sendControlCmd: function(type) {
        	console.log("type = "+type);
        	$.ajax({
        		url: "./music/"+type,
        		type: "POST",
	        	contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
	        	dataType: "text",
	        	success: function(data, textStatus, jqXHR) {
	        		
	        	}.bind(this),
	        	error: function(jqXHR, textStatus, errorThrown) {
	        	}
        	});
		}
	});
	
	return View;
});
