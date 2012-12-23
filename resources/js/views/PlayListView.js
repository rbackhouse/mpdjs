define([
		'jquery', 
		'backbone',
		'underscore',
		'models/PlayList',
		'jquerymobile',
		'text!templates/PlayList.html'], 
function($, Backbone, _, PlayList, mobile, template){
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
			this.playlist = options.playlist;
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
			this.playlist.fetch({
				success: function(collection, response, options) {
					this.playlist.reset(collection.toJSON());
					$("#playingList li").remove();
					this.playlist.each(function(song) {
						$("#playingList").append('<li data-icon="delete"><a href="#playlist/remove/'+song.get("id")+'">'+song.get("artist")+' : '+song.get("title")+'</a></li>');	
					});
					$("#playingList").listview('refresh');
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
