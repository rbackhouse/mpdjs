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
	'uiconfig',
	'mpd/MPDClient',
	'util/MessagePopup'
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
	        this.on("route:addalbum", function(album) {
				$.mobile.loading("show", { textVisible: false });
				if (config.isDirect()) {
					MPDClient.addAlbumToPlayList(album, function() {
						$.mobile.loading("hide");
						this.fetchPlayList();
					}.bind(this));
				} else {
					$.ajax({
						url: config.getBaseUrl()+"/music/playlist/album/"+album,
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
	        	if (config.isDirect() && MPDClient.isConnected() == false) {
	        		Backbone.history.navigate("connections", {replace: true});
					this.changePage(new ConnectionListView({}));
	        	} else {
		        	this.fetchPlayList();
	        	}
			});
			this.on("route:songs", function(album) {
	        	if (config.isDirect() && MPDClient.isConnected() == false) {
	        		Backbone.history.navigate("connections", {replace: true});
					this.changePage(new ConnectionListView({}));
					return;
	        	}
				
				var songlist = new SongList({album: album});
				$.mobile.loading("show", { textVisible: false });
				songlist.fetch({
					success: function(collection, response, options) {
		        		$.mobile.loading("hide");
						this.changePage(new SongListView({songs: collection, album: album}));
					}.bind(this),
					error: function(collection, xhr, options) {
		        		$.mobile.loading("hide");
						console.log("get songs failed :"+xhr.status);
					}
				});
			});
			this.on("route:albums", function(artist) {
	        	if (config.isDirect() && MPDClient.isConnected() == false) {
	        		Backbone.history.navigate("connections", {replace: true});
					this.changePage(new ConnectionListView({}));
					return;
	        	}
				var albumslist = new AlbumList({artist: artist, index: 0, filterValue: "all"});
				$.mobile.loading("show", { textVisible: false });
				albumslist.fetch({
					success: function(collection, response, options) {
		        		$.mobile.loading("hide");
						this.changePage(new AlbumListView({albums: collection}));
					}.bind(this),
					error: function(collection, xhr, options) {
		        		$.mobile.loading("hide");
						console.log("get albums failed :"+xhr.status);
					}
				});
			});
			this.on("route:artists", function() {
	        	if (config.isDirect() && MPDClient.isConnected() == false) {
	        		Backbone.history.navigate("connections", {replace: true});
					this.changePage(new ConnectionListView({}));
					return;
	        	}
				var artistlist = new ArtistList();
				$.mobile.loading("show", { textVisible: false });
				artistlist.fetch({
					success: function(collection, response, options) {
		        		$.mobile.loading("hide");
						this.changePage(new ArtistListView({artists: collection}));
					}.bind(this),
					error: function(collection, xhr, options) {
		        		$.mobile.loading("hide");
						console.log("get artists failed :"+xhr.status);
					}
				});
			});
			this.on("route:search", function() {
	        	if (config.isDirect() && MPDClient.isConnected() == false) {
	        		Backbone.history.navigate("connections", {replace: true});
					this.changePage(new ConnectionListView({}));
					return;
	        	}
				this.changePage(new SongSearchView({}));
			});
			this.on("route:connections", function() {
				this.changePage(new ConnectionListView({}));
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
				if (scrolled >= scrollEnd) {
					if (this.currentPage && this.currentPage.loadMore) {
						$(document).off("scrollstop");
						this.currentPage.loadMore(function() {
							$(document).on("scrollstop", checkScroll);
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
						console.log("get playlist failed :"+xhr.status);
					}
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
	    checkForConnection : function(cb) {
			if (config.promptForConnection()) {
				this.changePage(new ConnectionListView({}), true);
			} else {
				cb();
			}
	    },
		routes: {
			'playlist': 'playlist',
			'playlist/song/:song': 'addsong',
			'playlist/album/:album': 'addalbum',
			'songs/:album': 'songs',
			'albums/:artist': 'albums',
			'artists': 'artists',
			'albums': 'albums',
			'songs': 'songs',
			'search': 'search',
			'connections': 'connections',
			'': 'playlist'
		}
	});
	
	return Router;
});
