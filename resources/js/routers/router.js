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
	], 
function($, Backbone, _, mobile, ArtistList, AlbumList, SongList, PlayList, ArtistListView, AlbumListView, SongListView, PlayListView){
	var Router = Backbone.Router.extend({
		initialize: function() {
			$('.back').live('click', function(event) {
	            window.history.back();
	            return false;
	        });
	        this.firstPage = true;			
	        this.on("route:addsong", function(song) {
	        	console.log("song = "+song);
	        	$.ajax({
	        		url: "./music/playlist/song/"+song,
	        		type: "PUT",
		        	contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
		        	dataType: "text",
		        	success: function(data, textStatus, jqXHR) {
			        	this.fetchPlayList();
		        	}.bind(this),
		        	error: function(jqXHR, textStatus, errorThrown) {
		        	}
	        	});
	        });
	        this.on("route:addalbum", function(album) {
	        	console.log("album = "+album);
	        	$.ajax({
	        		url: "./music/playlist/album/"+album,
	        		type: "PUT",
		        	contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
		        	dataType: "text",
		        	success: function(data, textStatus, jqXHR) {
			        	this.fetchPlayList();
		        	}.bind(this),
		        	error: function(jqXHR, textStatus, errorThrown) {
		        	}
	        	});
	        });
	        this.on("route:playlist", function() {
	        	this.fetchPlayList();
			});
			this.on("route:songs", function(album) {
				var songlist = new SongList({album: album});
				songlist.fetch({
					success: function(collection, response, options) {
						this.changePage(new SongListView({songs: collection, album: album}));
					}.bind(this),
					error: function(collection, xhr, options) {
						console.log("failed!!!");
					}
				});
			});
			this.on("route:albums", function(artist) {
				var albumslist = new AlbumList({artist: artist});
				albumslist.fetch({
					success: function(collection, response, options) {
						this.changePage(new AlbumListView({albums: collection}));
					}.bind(this),
					error: function(collection, xhr, options) {
						console.log("failed!!!");
					}
				});
			});
			this.on("route:artists", function() {
				var artistlist = new ArtistList();
				artistlist.fetch({
					success: function(collection, response, options) {
						this.changePage(new ArtistListView({artists: collection}));
					}.bind(this),
					error: function(collection, xhr, options) {
						console.log("failed!!!");
					}
				});
			});
			this.on("route:removesong", function(song) {
				console.log("remove "+song);
			});
			Backbone.history.start();
		},
		fetchPlayList: function(statusJSON) {
			var playlist = new PlayList();
			playlist.fetch({
				success: function(collection, response, options) {
					this.changePage(new PlayListView({playlist: collection}));
				}.bind(this),
				error: function(collection, xhr, options) {
					console.log("failed!!!");
				}
			});
		},
	    changePage:function (page) {
	        $(page.el).attr('data-role', 'page');
	        page.render();
	        $('body').append($(page.el));
	        var transition = mobile.defaultPageTransition;
	        if (this.firstPage) {
	            transition = 'none';
	            this.firstPage = false;
	        }
	        mobile.changePage($(page.el), {changeHash:false, transition: transition});
	    },
		routes: {
			'playlist': 'playlist',
			'playlist/song/:song': 'addsong',
			'playlist/album/:album': 'addalbum',
			'playlist/remove/:song': 'removesong',
			'songs/:album': 'songs',
			'albums/:artist': 'albums',
			'artists': 'artists',
			'albums': 'albums',
			'songs': 'songs',
			'': 'playlist'
		}
	});
	
	return Router;
});
