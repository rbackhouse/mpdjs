/*
* The MIT License (MIT)
* 
* Copyright (c) 2014 Richard Backhouse
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
		'../routers/routes',
		'../uiconfig', 
		'../mpd/MPDClient',
		'text!templates/Menu.html',
		'text!templates/Header.html',
		'text!templates/Playing.html',
		'text!templates/Footer.html'
		], 
function($, Backbone, _, routes, config, MPDClient, menuTemplate, headerTemplate, playingTemplate, footerTemplate){
	var View = Backbone.View.extend({
		events: {
			"click #menuh1" : function() {
				window.dispatchEvent(new Event('resize'));
				$( "#menuPanel" ).popup("open", {transition: "flow"}).trigger("create");
			},
			"click #menu" : function() {
				window.dispatchEvent(new Event('resize'));
				$( "#menuPanel" ).popup("open", {transition: "flow"}).trigger("create");
			},
			"click #back" : function() {
				if (this.backlinkHandler) {
					this.backlinkHandler();
				} else {
					window.history.back();
				}	
			},
			"click #playing" : function() {
				window.dispatchEvent(new Event('resize'));
				this.openPlayingPopup();
			},
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
			"change #volume" : "changeVolume"
		},
		initialize: function(options) {
			if (options.header.backLink === undefined) {
				options.header.backLink = true;
			}
			this.headerTemplate = _.template( headerTemplate ) ( {header: options.header } );
			var menuItems = routes.getMenuItems();
			if (window.cordova && MPDClient.isConnected() == false) {
				menuItems = [routes.getConnectionsMenuItem()];
			}
			this.menuTemplate = _.template(menuTemplate) ( {menuItems: menuItems} );
			this.playingTemplate = _.template(playingTemplate) ( {} );
			this.footerTemplate = _.template(footerTemplate) ( {} );
		},
		updateMenu: function() {
			$("#mpdjsmenu li").remove();
			if (window.cordova && MPDClient.isConnected() == false) {
				$("#mpdjsmenu").append('<li><a href="#'+routes.getConnectionsMenuItem().href+'">'+routes.getConnectionsMenuItem().label+'</a></li>');
			} else {
				routes.getMenuItems().forEach(function(menuItem) {
					$("#mpdjsmenu").append('<li><a href="#'+menuItem.href+'">'+menuItem.label+'</a></li>');
				});
			}
			$("#mpdjsmenu").listview('refresh');
		},
		openPlayingPopup: function() {
			if (config.isDirect()) {
				var statusListener = function(status) {
					this.showStatus(status);
				}.bind(this);
				this.statusListener = statusListener;
				MPDClient.addStatusListener(statusListener);
			} else {
				this.openWebSocket();
			}
			$( "#playingPanel" ).popup("open", {
				transition: "flow"
			}).trigger("create");
			$( "#playingPanel" ).on( "popupafterclose", function(event, ui) {
				if (config.isDirect()) {
					MPDClient.removeStatusListener(this.statusListener);				
				} else {
					this.ws.close();
				}
			}.bind(this));
			$( "#playingPanel" ).popup( "option", "positionTo", "window" );
		},
		openWebSocket: function() {
			if (window.WebSocket) {
				this.ws = new WebSocket(config.getWSUrl());
			} else if (window.MozWebSocket) {
				this.ws = new MozWebSocket(config.getWSUrl());
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
		sendControlCmd: function(type) {
			console.log(type);
			$.mobile.loading("show", { textVisible: false });
			if (config.isDirect()) {
				MPDClient.sendControlCmd(type, function() {
					$.mobile.loading("hide");
				}.bind(this));
			} else {
				$.ajax({
					url: config.getBaseUrl()+"/music/"+type,
					type: "POST",
					headers: { "cache-control": "no-cache" },
					contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
					dataType: "text",
					success: function(data, textStatus, jqXHR) {
						$.mobile.loading("hide");
					}.bind(this),
					error: function(jqXHR, textStatus, errorThrown) {
						$.mobile.loading("hide");
						console.log("control cmd error: "+textStatus);
					}
				});
			}
		},
		showStatus: function(data) {
			var status; 
			if (config.isDirect()) {
				status = data;
			} else {
				status = JSON.parse(data);
			}
			this.state = status.state;
			this.volume = status.volume;
			if (status.state === "play") {
				$("#playPause").button('option', {icon : "pauseIcon" });
				$("#playPause").button("refresh");
			} else {
				$("#playPause").button('option', {icon : "playIcon" });
				$("#playPause").button("refresh");
			}
			if (status.currentsong && (status.state === "play" || status.state === "pause")) {
				if (!this.volumeSet) {
					var volume = parseInt(status.volume);
					if (volume > -1) {
						$("#volume").val(status.volume);
						$("#volume").slider('refresh');
						this.volumeSet = true;
					}
				}
				var time = Math.floor(parseInt(status.time));
				var minutes = Math.floor(time / 60);
				var seconds = time - minutes * 60;
				seconds = (seconds < 10 ? '0' : '') + seconds;
				$("#currentlyPlayingArtist").text(status.currentsong.artist);
				$("#currentlyPlayingAlbum").text(status.currentsong.album);
				$("#currentlyPlayingTitle").text(status.currentsong.title);
				$("#currentlyPlayingTrack").text("Track: "+(parseInt(status.song)+1));
				$("#currentlyPlayingTime").text('Time: '+minutes+":"+seconds);
				$("#currentlyPlaying").attr("style", "display:block");
			} else {
				$("#currentlyPlaying").attr("style", "display:none");
				$("#currentlyPlayingArtist").text("");
				$("#currentlyPlayingAlbum").text("");
				$("#currentlyPlayingTitle").text("");
				$("#currentlyPlayingTrack").text("");
				$("#currentlyPlayingTime").text("");
			}
		},
		changeVolume: function() {
			var vol = $("#volume").val();
			if (vol !== this.volume && this.state === "play") {
				$.mobile.loading("show", { textVisible: false });
				if (config.isDirect()) {
					MPDClient.changeVolume(vol, function() {
						$.mobile.loading("hide");
					}.bind(this));
				} else {
					$.ajax({
						url: config.getBaseUrl()+"/music/volume/"+vol,
						type: "POST",
						headers: { "cache-control": "no-cache" },
						contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
						dataType: "text",
						success: function(data, textStatus, jqXHR) {
							$.mobile.loading("hide");
						}.bind(this),
						error: function(jqXHR, textStatus, errorThrown) {
							$.mobile.loading("hide");
							console.log("change volume error: "+textStatus);
						}
					});
				}
        	}
		}
	});
	
	return View;
});
