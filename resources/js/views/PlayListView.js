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
		'./BaseView',
		'../mpd/MPDClient',
		'../util/MessagePopup',
		'text!templates/PlayList.html',
		'text!templates/PlayingConfig.html'
		], 
function($, Backbone, _, PlayList, mobile, config, BaseView, MPDClient, MessagePopup, template, configTemplate) {
	var View = BaseView.extend({
		events: function() {
		    return _.extend({}, BaseView.prototype.events, {
				"click #update" : function() {
					this.sendControlCmd("update");
				},
				"click #editButton" : "editPlayList",
				"click #randomButton" : "randomPlayList",
				"click #clearButton" : "clearPlayList",
				"click #playLists li" : "loadPlayList",
				"click #saveButton" : "savePlayList",
				"click #playingList li" : "removeSong",
				"click #configButton" : "config",
				"change #shuffle" : "shuffle",
				"change #repeat" : "repeat",
				"change #consume" : "consume",
				"change #single" : "single"
		    });	
		},
		initialize: function(options) {
			options.header = {
				title: "Play List",
				backLink: false
			};
			this.volumeSet = false;
			this.constructor.__super__.initialize.apply(this, [options]);
			this.playlist = options.playlist;
			this.template = _.template( template ) ( { playlist: options.playlist.toJSON() } );
			this.configTemplate = _.template(configTemplate) ( {} );
			if (config.isDirect()) {
				var statusListener = function(status) {
					this.showStatus(status);
				}.bind(this);
				this.statusListener = statusListener;
				MPDClient.addStatusListener(statusListener);
			} else {
				this.openWebSocket();
			}
		},
		render: function(){
			$(this.el).html( this.headerTemplate + this.template + this.menuTemplate + this.configTemplate);
			this.loadPlayLists();
		},
		editPlayList: function() {
			$("#playingList li").remove();
			if (this.editing) {
				this.editing = undefined;
				this.playlist.each(function(song) {
					$("#playingList").append('<li><p style="white-space:normal">'+song.get("artist")+' : '+song.get("title")+'<span class="ui-li-count">'+song.get("time")+'</span></p></li>');	
				});
			} else {
				this.editing = true;
				this.playlist.each(function(song) {
					$("#playingList").append('<li data-icon="minusIcon"><a href="#playlist" id="'+song.get("id")+'"><p style="white-space:normal">'+song.get("artist")+' : '+song.get("title")+'<span class="ui-li-count">'+song.get("time")+'</span></p></a></li>');	
				});
			}
			$("#playingList").listview('refresh');
		},
		randomPlayList: function() {
			if (config.getRandomPlaylistConfig().enabled) {
				var $popUp = $("<div/>").popup({
					dismissible : false,
					theme : "a",
					overlyaTheme : "a",
					transition : "pop"
				}).bind("popupafterclose", function() {
					$(this).remove();
				});			
				$popUp.addClass("ui-content");
				$("<h3/>", {
					text : "Random Playlist Type"
				}).appendTo($popUp);
			
				$("<p/>", {
					text : "Type:"
				}).appendTo($popUp);
			
				var $select = $("<select/>", {
					id : "type"
				}).appendTo($popUp);
				
				var $artist = $("<option/>", {
					value : "artist",
				}).appendTo($select);
				$artist.text("By Artist");
				
				var $album = $("<option/>", {
					value : "album",
				}).appendTo($select);
				$album.text("By Album");
				
				var $title = $("<option/>", {
					value : "title",
				}).appendTo($select);
				$title.text("By Title");
				
				var $genre = $("<option/>", {
					value : "genre",
				}).appendTo($select);
				$genre.text("By Genre");
				
				if (config.getRandomPlaylistConfig().type === "artist") {
					$artist.attr("selected", "true");
				} if (config.getRandomPlaylistConfig().type === "album") {
					$album.attr("selected", "true");
				} if (config.getRandomPlaylistConfig().type === "title") {
					$title.attr("selected", "true");
				} if (config.getRandomPlaylistConfig().type === "genre") {
					$genre.attr("selected", "true");
				}
				
				$select.selectmenu();
				
				$("<p/>", {
					text : "Type Value:"
				}).appendTo($popUp);
				
				$("<input/>", {
					id : "typevalue",
					type : "text",
					value : config.getRandomPlaylistConfig().typevalue,
					autocapitalize: "off"
				}).appendTo($popUp);
				
				$("<a>", {
					text : "Ok"
				}).buttonMarkup({
					inline : true,
					icon : "check"
				}).bind("click", function() {
					$popUp.popup("close");
					var type = $("#type").find('option:selected').val();
					var typevalue = $("#typevalue").val();
					if (typevalue || typevalue !== "") {
						config.setRandomPlaylistConfig({enabled: true, type: type, typevalue: typevalue});
						this.randomPlayListRequest(type, typevalue);
					}
				}.bind(this)).appendTo($popUp);
			
				$("<a>", {
					text : "Cancel"
				}).buttonMarkup({
					inline : true,
					icon : "delete"
				}).bind("click", function() {
					$popUp.popup("close");
				}).appendTo($popUp);
			
				$popUp.popup("open").trigger("create");
			} else {
				this.randomPlayListRequest();
			}
		},
		randomPlayListRequest: function(type, typevalue) {	
			$.mobile.loading("show", { textVisible: false });
			if (config.isDirect()) {
				if (type) {
					MPDClient.randomPlayListByType(type, typevalue, function() {
						$.mobile.loading("hide");
						this.fetchPlayList();
					}.bind(this));
				} else {
					MPDClient.randomPlayList(function() {
						$.mobile.loading("hide");
						this.fetchPlayList();
					}.bind(this));
				}
			} else {
				var url = config.getBaseUrl()+"/music/playlist/random";
				if (type) {
					url += "/"+type+"/"+encodeURIComponent(typevalue);
				}
				$.ajax({
					url: url,
					type: "PUT",
					headers: { "cache-control": "no-cache" },
					contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
					dataType: "text",
					success: function(data, textStatus, jqXHR) {
						$.mobile.loading("hide");
						this.fetchPlayList();
					}.bind(this),
					error: function(jqXHR, textStatus, errorThrown) {
						$.mobile.loading("hide");
						console.log("random playlist error : "+textStatus);
					}
				});
			}
		},
		clearPlayList: function() {
			$.mobile.loading("show", { textVisible: false });
			if (config.isDirect()) {
				MPDClient.clearPlayList(function() {
					$.mobile.loading("hide");
					this.fetchPlayList();
				}.bind(this));
			} else {
				$.ajax({
					url: config.getBaseUrl()+"/music/playlist",
					type: "DELETE",
					headers: { "cache-control": "no-cache" },
					contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
					dataType: "text",
					success: function(data, textStatus, jqXHR) {
						$.mobile.loading("hide");
						this.fetchPlayList();
					}.bind(this),
					error: function(jqXHR, textStatus, errorThrown) {
						$.mobile.loading("hide");
						console.log("clear playlist error : "+textStatus);
					}
				});
			}
		},
		removeSong: function(evt) {
			if (this.editing) {			
				$.mobile.loading("show", { textVisible: false });
				if (config.isDirect()) {
					MPDClient.removeSong(evt.target.id, function() {
						$.mobile.loading("hide");
						this.fetchPlayList();
					}.bind(this));
				} else {
					$.ajax({
						url: config.getBaseUrl()+"/music/playlist/"+evt.target.id,
						type: "DELETE",
						headers: { "cache-control": "no-cache" },
						contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
						dataType: "text",
						success: function(data, textStatus, jqXHR) {
							$.mobile.loading("hide");
							this.fetchPlayList();
						}.bind(this),
						error: function(jqXHR, textStatus, errorThrown) {
							$.mobile.loading("hide");
							console.log("remove song error : "+textStatus);
						}
					});
				}
			}
		},
		fetchPlayList: function() {
			$.mobile.loading("show", { textVisible: false });
			this.playlist.fetch({
				success: function(collection, response, options) {
		        	$.mobile.loading("hide");
					this.playlist.reset(collection.toJSON());
					$("#playingList li").remove();
					this.playlist.each(function(song) {
						if (this.editing) {
							$("#playingList").append('<li data-icon="minusIcon"><a href="#playlist" id="'+song.get("id")+'"><p style="white-space:normal">'+song.get("artist")+' : '+song.get("title")+'<span class="ui-li-count">'+song.get("time")+'</span></p></a></li>');	
						} else {
							$("#playingList").append('<li><p style="white-space:normal">'+song.get("artist")+' : '+song.get("title")+'<span class="ui-li-count">'+song.get("time")+'</span></p></li>');	
						}
					}.bind(this));
					$("#playingList").listview('refresh');
				}.bind(this),
				error: function(jqXHR, textStatus, errorThrown) {
		        	$.mobile.loading("hide");
					console.log("fetch playlist error : "+textStatus);
				}
			});
		},
		loadPlayList: function(evt) {
			var name = evt.target.id;
			if (name === "") {
				name = evt.target.parentNode.id;
			}
			if (name.indexOf("del-") != -1) {
				name = name.substring("del-".length);
				MessagePopup.create("Delete Playlist", "Are you sure you want to delete the Playlist ?", undefined, function() {
					if (config.isDirect()) {
						MPDClient.deletePlayList(name, function() {
							$.mobile.loading("hide");
							this.loadPlayLists();
						}.bind(this));
					} else {
						$.ajax({
							url: config.getBaseUrl()+"/music/playlist/delete/"+name,
							type: "PUT",
							contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
							dataType: "text",
							success: function(data, textStatus, jqXHR) {
								$.mobile.loading("hide");
								this.loadPlayLists();
							}.bind(this),
							error: function(jqXHR, textStatus, errorThrown) {
								$.mobile.loading("hide");
								console.log("delete playlist failed :"+errorThrown);
							}
						});
					}
				}.bind(this), true);
			} else {
				if (config.isDirect()) {
					MPDClient.loadPlayList(name, function() {
						$.mobile.loading("hide");
						this.fetchPlayList();
					}.bind(this));
				} else {
					$.ajax({
						url: config.getBaseUrl()+"/music/playlist/load/"+name,
						type: "PUT",
						contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
						dataType: "text",
						success: function(data, textStatus, jqXHR) {
							$.mobile.loading("hide");
							this.fetchPlayList();
						}.bind(this),
						error: function(jqXHR, textStatus, errorThrown) {
							$.mobile.loading("hide");
							console.log("save playlist failed :"+errorThrown);
						}
					});
				}
			}
		},		
		savePlayList: function() {
			var $popUp = $("<div/>").popup({
				dismissible : false,
				theme : "a",
				overlyaTheme : "a",
				transition : "pop"
			}).bind("popupafterclose", function() {
				$(this).remove();
			});			
			$popUp.addClass("ui-content");
			$("<h3/>", {
				text : "Save Playlist"
			}).appendTo($popUp);
			
			$("<p/>", {
				text : "Name:"
			}).appendTo($popUp);
			
			$("<input/>", {
				id : "plname",
				type : "text",
				value : "",
				autocapitalize: "off"
			}).appendTo($popUp);
			
			$("<a>", {
				text : "Ok"
			}).buttonMarkup({
				inline : true,
				icon : "check"
			}).bind("click", function() {
				$popUp.popup("close");
				var plname = $("#plname").val();
				$.mobile.loading("show", { textVisible: false });
				if (config.isDirect()) {
					MPDClient.savePlayList(plname, function() {
						$.mobile.loading("hide");
						this.loadPlayLists();
					}.bind(this));
				} else {
					$.ajax({
						url: config.getBaseUrl()+"/music/playlist/save/"+plname,
						type: "PUT",
						contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
						dataType: "text",
						success: function(data, textStatus, jqXHR) {
							$.mobile.loading("hide");
							this.loadPlayLists();
						}.bind(this),
						error: function(jqXHR, textStatus, errorThrown) {
							$.mobile.loading("hide");
							console.log("save playlist failed :"+errorThrown);
						}
					});
				}
			}.bind(this)).appendTo($popUp);
			
			$("<a>", {
				text : "Cancel"
			}).buttonMarkup({
				inline : true,
				icon : "delete"
			}).bind("click", function() {
				$popUp.popup("close");
			}).appendTo($popUp);
			
			$popUp.popup("open").trigger("create");
		},
		loadPlayLists: function() {
			$.mobile.loading("show", { textVisible: false });
			if (config.isDirect()) {
				MPDClient.listPlayLists(function(playlists) {
					$.mobile.loading("hide");
					$("#playLists li").remove();
					playlists.forEach(function(playlist) {
						$("#playLists").append('<li data-icon="minusIcon"><a id="'+playlist+'"><p style="white-space:normal">'+playlist+'</p></a><a id="del-'+playlist+'"></a></li>');								
					});						
					$("#playLists").listview('refresh');
				}.bind(this));
			} else {
				$.ajax({
					url: config.getBaseUrl()+"/music/playlists",
					type: "GET",
					headers: { "cache-control": "no-cache" },
					success: function(playlists, textStatus, jqXHR) {
						$.mobile.loading("hide");
						$("#playLists li").remove();
						playlists.forEach(function(playlist) {
							$("#playLists").append('<li data-icon="minusIcon"><a id="'+playlist+'"><p style="white-space:normal">'+playlist+'</p></a><a id="del-'+playlist+'"></a></li>');								
						});						
						$("#playLists").listview('refresh');
					}.bind(this),
					error: function(jqXHR, textStatus, errorThrown) {
						$.mobile.loading("hide");
					}
				});
			}
		},
		showStatus: function(data) {
			BaseView.prototype.showStatus.apply(this, arguments);
			var status; 
			if (config.isDirect()) {
				status = data;
			} else {
				status = JSON.parse(data);
			}
			
			if (this.currentSongId && status.songid && this.consume == 1) {
				if (status.songid !== this.currentSongId) {
					this.fetchPlayList();
				}				
			}
			this.currentSongId = status.songid;
		},
		config: function() {
			$("#shuffle").prop( "checked", (this.random == 1) ? true : false ).checkboxradio('refresh');
			$("#repeat").prop( "checked", (this.repeat == 1) ? true : false ).checkboxradio('refresh');
			$("#consume").prop( "checked", (this.consume == 1) ? true : false ).checkboxradio('refresh');
			$("#single").prop( "checked", (this.single == 1) ? true : false ).checkboxradio('refresh');
			var $popUp = $( "#playingConfigPanel" ).popup("open", {
				transition: "flow"
			}).trigger("create");
			$( "#playingConfigPanel" ).popup( "option", "history", false );
		},
		shuffle: function() {
			if (config.isDirect()) {
				var on = $("#shuffle").is(":checked")
				MPDClient.shuffle(on, function() {
				});
			} else {
			}			
		},
		repeat: function() {
			if (config.isDirect()) {
				var on = $("#repeat").is(":checked") 
				MPDClient.repeat(on, function() {
				});
			} else {
			}			
		},
		consume: function() {
			if (config.isDirect()) {
				var on = $("#consume").is(":checked") 	
				MPDClient.consume(on, function() {
				});
			} else {
			}			
		},
		single: function() {
			if (config.isDirect()) {
				var on = $("#single").is(":checked") 	
				MPDClient.single(on, function() {
				});
			} else {
			}			
		},
		close: function() {
			if (config.isDirect()) {
				MPDClient.removeStatusListener(this.statusListener);				
			} else {
				this.ws.close();
			}
		}
	});
	
	return View;
});
