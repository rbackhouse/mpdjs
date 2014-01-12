/*
* The MIT License (MIT)
* 
* Copyright (c) 2012 Richard Backhouse
* 
* Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"),
* to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
* and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
* DEALINGS IN THE SOFTWARE.
*/
define([
		'jquery', 
		'backbone',
		'underscore',
		'models/PlayList',
		'jquerymobile',
		'../uiconfig',
		'text!templates/PlayList.html'], 
function($, Backbone, _, PlayList, mobile, config, template){
	var View = Backbone.View.extend({
		events: {
			"click #previous" : function() {
				this.sendControlCmd("previous");
			},
			"click #next" : function() {
				this.sendControlCmd("next");
			},
			"click #playPause" : function() {
				if (this.state === "play") {
					this.sendControlCmd("pause");
				} else {
					this.sendControlCmd("play");
				}
			},
			"click #stop" : function() {
				this.sendControlCmd("stop");
			},
			"click #update" : function() {
				this.sendControlCmd("update");
			},
			"click #editButton" : "editPlayList",
			"click #randomButton" : "randomPlayList",
			"click #clearButton" : "clearPlayList",
			"click #playingList li" : "removeSong",
			"change #volume" : "changeVolume"
		},
		initialize: function(options) {
			this.playlist = options.playlist;
			this.template = _.template( template, { playlist: options.playlist.toJSON() } );
			this._openWebSocket();
		},
		render: function(){
			$(this.el).html( this.template );
		},
		editPlayList: function() {
			$("#playingList li").remove();
			if (this.editing) {
				this.editing = undefined;
				$("#editButton").val("Edit");
				$("#editButton").button("refresh");
				this.playlist.each(function(song) {
					$("#playingList").append('<li>'+song.get("artist")+' : '+song.get("title")+'<span class="ui-li-count">'+song.get("time")+'</span></li>');	
				});
			} else {
				this.editing = true;
				$("#editButton").val("Done");
				$("#editButton").button("refresh");
				this.playlist.each(function(song) {
					$("#playingList").append('<li data-icon="minusIcon"><a href="#playlist" id="'+song.get("id")+'">'+song.get("artist")+' : '+song.get("title")+'<span class="ui-li-count">'+song.get("time")+'</span></a></li>');	
				});
			}
			$("#playingList").listview('refresh');
		},
		randomPlayList: function() {
        	$.ajax({
        		url: config.baseUrl+"/music/playlist/random",
        		type: "PUT",
				headers: { "cache-control": "no-cache" },
	        	contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
	        	dataType: "text",
	        	success: function(data, textStatus, jqXHR) {
		        	this.fetchPlayList();
	        	}.bind(this),
	        	error: function(jqXHR, textStatus, errorThrown) {
					console.log("random playlist error : "+textStatus);
	        	}
        	});
		},
		clearPlayList: function() {
        	$.ajax({
        		url: config.baseUrl+"/music/playlist",
        		type: "DELETE",
				headers: { "cache-control": "no-cache" },
	        	contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
	        	dataType: "text",
	        	success: function(data, textStatus, jqXHR) {
		        	this.fetchPlayList();
	        	}.bind(this),
	        	error: function(jqXHR, textStatus, errorThrown) {
					console.log("clear playlist error : "+textStatus);
	        	}
        	});
		},
		removeSong: function(evt) {
			if (this.editing) {			
				$.ajax({
					url: config.baseUrl+"/music/playlist/"+evt.target.id,
					type: "DELETE",
					headers: { "cache-control": "no-cache" },
					contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
					dataType: "text",
					success: function(data, textStatus, jqXHR) {
						this.fetchPlayList();
					}.bind(this),
					error: function(jqXHR, textStatus, errorThrown) {
						console.log("remove song error : "+textStatus);
					}
				});
			}
		},
		fetchPlayList: function() {
			this.playlist.fetch({
				success: function(collection, response, options) {
					this.playlist.reset(collection.toJSON());
					$("#playingList li").remove();
					this.playlist.each(function(song) {
						if (this.editing) {
							$("#playingList").append('<li data-icon="minusIcon"><a href="#playlist" id="'+song.get("id")+'">'+song.get("artist")+' : '+song.get("title")+'<span class="ui-li-count">'+song.get("time")+'</span></a></li>');	
						} else {
							$("#playingList").append('<li>'+song.get("artist")+' : '+song.get("title")+'<span class="ui-li-count">'+song.get("time")+'</span></li>');	
						}
					}.bind(this));
					$("#playingList").listview('refresh');
				}.bind(this),
				error: function(jqXHR, textStatus, errorThrown) {
					console.log("fetch playlist error : "+textStatus);
				}
			});
		},
		changeVolume: function() {
			var vol = $("#volume").val();
			if (vol !== this.volume) {
				$.ajax({
					url: config.baseUrl+"/music/volume/"+vol,
					type: "POST",
					headers: { "cache-control": "no-cache" },
					contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
					dataType: "text",
					success: function(data, textStatus, jqXHR) {
					}.bind(this),
					error: function(jqXHR, textStatus, errorThrown) {
						console.log("change volume error: "+textStatus);
					}
				});
        	}
		},
		sendControlCmd: function(type) {
        	$.ajax({
        		url: config.baseUrl+"/music/"+type,
        		type: "POST",
				headers: { "cache-control": "no-cache" },
	        	contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
	        	dataType: "text",
	        	success: function(data, textStatus, jqXHR) {
	        	}.bind(this),
	        	error: function(jqXHR, textStatus, errorThrown) {
	        		console.log("control cmd error: "+textStatus);
	        	}
        	});
		},
		showStatus: function(data) {
			var status = JSON.parse(data);
			this.state = status.state;
			this.volume = status.volume;
			if (status.state === "play") {
				$("#playPause").val('Pause');
				$("#playPause").button('option', {icon : "pauseIcon" });
				$("#playPause").button("refresh");
			} else {
				$("#playPause").val('Play');
				$("#playPause").button('option', {icon : "playIcon" });
				$("#playPause").button("refresh");
			}
			if (status.currentsong && (status.state === "play" || status.state === "pause")) {
				var volume = parseInt(status.volume);
				if (volume > -1) {
					$("#volume").val(status.volume);
				} else {
					$("#volume").val("0");
				}
				$("#volume").slider('refresh');
				var time = Math.floor(parseInt(status.time));
				var minutes = Math.floor(time / 60);
				var seconds = time - minutes * 60;
				seconds = (seconds < 10 ? '0' : '') + seconds;
				$("#currentlyPlaying").text("Playing ["+status.currentsong+"] "+minutes+":"+seconds);
			} else {
				$("#currentlyPlaying").text("Playing []");
			}
		},
		_openWebSocket: function() {
			if (window.WebSocket) {
				this.ws = new WebSocket(config.wsUrl);
			} else if (window.MozWebSocket) {
				this.ws = new MozWebSocket(config.wsUrl);
			} else {
				alert("No WebSocket Support !!!");
			}
		    this.ws.onmessage = function(event) {
		    	this.showStatus(event.data);
      		}.bind(this);
      		this.ws.onerror = function (error) {
  				console.log('WebSocket Error ' + error);
  				this.ws.close();
  				this._openWebSocket();
			}.bind(this);
		},
		close: function() {
			this.ws.close();
		}
	});
	
	return View;
});
