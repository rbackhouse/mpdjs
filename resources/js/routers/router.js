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
	'jquerymobile',
	'models/ArtistList',
	'models/AlbumList',
	'models/SongList',
	'models/PlayList',
	'views/ArtistListView',
	'views/AlbumListView',
	'views/SongListView',
	'views/PlayListView',
	'views/SongSearchView',
	'views/ConnectionListView',
	'views/SettingsView',
	'views/FileListView',
	'uiconfig',
	'mpd/MPDClient',
	'util/MessagePopup',
	'applewatch/AppleWatchUtil'
	], 
function(
	$, 
	Backbone, 
	_, 
	mobile, 
	ArtistList, 
	AlbumList, 
	SongList, 
	PlayList, 
	ArtistListView, 
	AlbumListView, 
	SongListView, 
	PlayListView, 
	SongSearchView, 
	ConnectionListView, 
	SettingsView, 
	FileListView,
	config, 
	MPDClient, 
	MessagePopup
) {
	window.onerror = function (errorMsg, url, lineNumber, column, errorObj) {
    	console.log('Error: ' + errorMsg + ' Script: ' + url + ' Line: ' + lineNumber + ' Column: ' + column + ' StackTrace: ' +  errorObj);
    	MessagePopup.create('Error: ' + errorMsg + ' Script: ' + url + ' Line: ' + lineNumber + ' Column: ' + column+ ' StackTrace: ' +  errorObj);
	}
	var Router = Backbone.Router.extend({
		initialize: function() {
			$('.back').on('click', function(event) {
	            window.history.back();
	            return false;
	        });
	        this.firstPage = true;			
	        this.on("route:addsong", function(song) {
				$.mobile.loading("show", { textVisible: false });
				if (config.isDirect()) {
					MPDClient.addSongToPlayList(decodeURIComponent(atob(song)), function() {
						$.mobile.loading("hide");
						this.fetchPlayList();
					}.bind(this));
				} else {
					$.ajax({
						url: config.getBaseUrl()+"/music/playlist/song/"+song,
						type: "PUT",
						contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
						dataType: "text",
						success: function(data, textStatus, jqXHR) {
							$.mobile.loading("hide");
							this.fetchPlayList();
						}.bind(this),
						error: function(jqXHR, textStatus, errorThrown) {
							$.mobile.loading("hide");
							console.log("addsong failed :"+errorThrown);
						}
					});
				}
	        });
	        this.on("route:addalbum", function(album, artist) {
				$.mobile.loading("show", { textVisible: false });
				if (config.isDirect()) {
					MPDClient.addAlbumToPlayList(album, artist, function() {
						$.mobile.loading("hide");
						this.fetchPlayList();
					}.bind(this));
				} else {
					$.ajax({
						url: config.getBaseUrl()+"/music/playlist/album/"+album+"/"+artist,
						type: "PUT",
						contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
						dataType: "text",
						success: function(data, textStatus, jqXHR) {
							$.mobile.loading("hide");
							this.fetchPlayList();
						}.bind(this),
						error: function(jqXHR, textStatus, errorThrown) {
							$.mobile.loading("hide");
							console.log("addalbum failed :"+errorThrown);
						}
					});
	        	}
	        });
	        this.on("route:playlist", function() {
	        	this.connectIfRequired(function(proceed) {
	        		if (!proceed) return;
		        	this.fetchPlayList();
	        	}.bind(this));
			});
			this.on("route:songs", function(album, artist) {
				if (artist === "null") {
					artist = undefined;
				}
	        	this.connectIfRequired(function(proceed) {
	        		if (!proceed) return;
					var songlist = new SongList({album: album, artist: artist});
					$.mobile.loading("show", { textVisible: false });
					songlist.fetch({
						success: function(collection, response, options) {
							$.mobile.loading("hide");
							this.changePage(new SongListView({songs: collection, album: album, artist: artist}));
						}.bind(this),
						error: function(collection, xhr, options) {
							$.mobile.loading("hide");
							console.log("get songs failed :"+xhr.status);
						}
					});
	        	}.bind(this));
			});
			this.on("route:albums", function(artist) {
	        	this.connectIfRequired(function(proceed) {
	        		if (!proceed) return;
					var albumslist = new AlbumList({artist: artist, index: 0, filterValue: "all"});
					$.mobile.loading("show", { textVisible: false });
					albumslist.fetch({
						success: function(collection, response, options) {
							$.mobile.loading("hide");
							this.changePage(new AlbumListView({albums: collection}));
						}.bind(this),
						error: function(collection, xhr, options) {
							$.mobile.loading("hide");
							if (config.isDirect()) {
								Backbone.history.navigate("connections", {replace: true});
								this.changePage(new ConnectionListView({}));
							}
						}.bind(this)
					});
	        	}.bind(this));
			});
			this.on("route:artists", function() {
	        	this.connectIfRequired(function(proceed) {
	        		if (!proceed) return;
					var artistlist = new ArtistList();
					$.mobile.loading("show", { textVisible: false });
					artistlist.fetch({
						success: function(collection, response, options) {
							$.mobile.loading("hide");
							this.changePage(new ArtistListView({artists: collection}));
						}.bind(this),
						error: function(collection, xhr, options) {
							$.mobile.loading("hide");
							if (config.isDirect()) {
								Backbone.history.navigate("connections", {replace: true});
								this.changePage(new ConnectionListView({}));
							}
						}.bind(this)
					});
	        	}.bind(this));
			});
			this.on("route:search", function() {
	        	this.connectIfRequired(function(proceed) {
	        		if (!proceed) return;
					this.changePage(new SongSearchView({}));
	        	}.bind(this));
			});
			this.on("route:connections", function() {
				this.changePage(new ConnectionListView({}));
			});
			this.on("route:settings", function() {
				this.changePage(new SettingsView({}));
			});
			this.on("route:files", function() {
	        	this.connectIfRequired(function(proceed) {
	        		if (!proceed) return;
					this.changePage(new FileListView({}));
	        	}.bind(this));
			});
			Backbone.history.start();
			
			var checkScroll = function(evt) {
				var activePage = $(':mobile-pagecontainer').pagecontainer('getActivePage');
				var screenHeight = $.mobile.getScreenHeight();
				var contentHeight = $(".ui-content", activePage).outerHeight();
				var header = $(".ui-header", activePage).outerHeight() - 1;
				var scrolled = $(window).scrollTop();
				var footer = $(".ui-footer", activePage).outerHeight() - 1;
				var scrollEnd = contentHeight - screenHeight + header + footer;
				if (scrolled >= scrollEnd && scrolled > 0) {
					if (this.currentPage && this.currentPage.loadMore) {
						this.currentPage.loadMore(function() {
						});
					}
				}
			}.bind(this);
			
			$(document).on("scrollstop", checkScroll);
		},
		fetchPlayList: function(statusJSON) {
			this.checkForConnection(function() {
				this.navigate("playlist", {replace: true});
				if (this.currentView) {
					this.currentView.close();
					this.currentView.remove();
					this.currentView.unbind();
				}
				var playlist = new PlayList();
				$.mobile.loading("show", { textVisible: false });
				playlist.fetch({
					success: function(collection, response, options) {
		        		$.mobile.loading("hide");
						this.currentView = new PlayListView({playlist: collection})
						this.changePage(this.currentView);
					}.bind(this),
					error: function(collection, xhr, options) {
		        		$.mobile.loading("hide");
		        		if (config.isDirect()) {
			        		Backbone.history.navigate("connections", {replace: true});
							this.changePage(new ConnectionListView({}));
						}
					}.bind(this)
				});
			}.bind(this));
		},
	    changePage:function (page, dontCheck) {
	    	this.currentPage = page;
	    	function cp() {
				$(page.el).attr('data-role', 'page');
				page.render();
				$('body').append($(page.el));
				mobile.changePage($(page.el), {changeHash:false, reverse: false});
	    	}
	    	if (dontCheck) {
				cp();
	    	} else {
				this.checkForConnection(function() {
					cp();
				});
			}
	    },
	    checkForConnection: function(cb) {
			if (config.promptForConnection()) {
				this.changePage(new ConnectionListView({}), true);
			} else {
				cb();
			}
	    },
	    connectIfRequired: function(cb) {
	        if (config.isDirect() && !MPDClient.isConnected()) {
	        	if (config.getConnections().length < 1) {
	        		Backbone.history.navigate("connections", {replace: true});
					this.changePage(new ConnectionListView({}));
					cb(false);
	        	} else {
					MPDClient.connect(function(error) {
						if (error) {
							MessagePopup.create("Connection Failure", "Failed to connect to "+config.getConnection().host+":"+config.getConnection().port+" Error: "+error);
			        		Backbone.history.navigate("connections", {replace: true});
							this.changePage(new ConnectionListView({}));
							cb(false);
						} else {
							cb(true);
						}
					}.bind(this));
	        	}
	    	} else {
	    		cb(true);
	    	}
	    },
		routes: {
			'playlist': 'playlist',
			'playlist/song/:song': 'addsong',
			'playlist/album/:album/:artist': 'addalbum',
			'songs/:album/:artist': 'songs',
			'albums/:artist': 'albums',
			'artists': 'artists',
			'albums': 'albums',
			'songs': 'songs',
			'search': 'search',
			'connections': 'connections',
			'settings': 'settings',
			'files': 'files',
			'': config.getStartPage()
		}
	});
	
	return Router;
});
