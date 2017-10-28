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
		'./BaseView',
		'../uiconfig',
		'../mpd/MPDClient',
		'text!templates/SongList.html',
		'text!templates/SongListAlt.html'], 
function($, Backbone, _, BaseView, config, MPDClient, template, templateAlt){
	var View = BaseView.extend({
		events: function() {
		    return _.extend({}, BaseView.prototype.events, {
				"click #addAllButtonAlt" : function() {
					$.mobile.loading("show", { textVisible: false });
					if (config.isDirect()) {
						MPDClient.addAlbumToPlayList(this.album, this.artist, function() {
							$.mobile.loading("hide");
						});
					} else {
						$.ajax({
							url: config.getBaseUrl()+"/music/playlist/album/"+this.album+"/"+this.artist,
							type: "PUT",
							contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
							dataType: "text",
							success: function(data, textStatus, jqXHR) {
								$.mobile.loading("hide");
							},
							error: function(jqXHR, textStatus, errorThrown) {
								$.mobile.loading("hide");
								console.log("addalbum failed :"+errorThrown);
							}
						});
					}
				},
				"click #songList li" : function(evt) {
					var id = evt.target.id;
					if (id === "") {
						id = evt.target.parentNode.id;
					}
					if (id !== "") {
						var song = id.substring(5);
						$.mobile.loading("show", { textVisible: false });
						if (config.isDirect()) {
							MPDClient.addSongToPlayList(decodeURIComponent(atob(song)), function() {
								$.mobile.loading("hide");
							});
						} else {
							$.ajax({
								url: config.getBaseUrl()+"/music/playlist/song/"+song,
								type: "PUT",
								contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
								dataType: "text",
								success: function(data, textStatus, jqXHR) {
									$.mobile.loading("hide");
								},
								error: function(jqXHR, textStatus, errorThrown) {
									$.mobile.loading("hide");
									console.log("addsong failed :"+errorThrown);
								}
							});
						}
					}					
				}				
		    });	
		},
		initialize: function(options) {
			options.header = {
				title: "Songs"
			};
			this.constructor.__super__.initialize.apply(this, [options]);
			this.album = options.album;
			this.artist = options.artist;
			if (config.isSongToPlaylist()) {
				this.template = _.template( template ) ( { songs: options.songs.toJSON(), album: options.album, artist: options.artist } );
			} else {
				this.template = _.template( templateAlt ) ( { songs: options.songs.toJSON(), album: options.album, artist: options.artist } );
			}
		},
		render: function(){
			$(this.el).html( this.headerTemplate + this.template + this.footerTemplate + this.menuTemplate + this.playingTemplate );
		}
	});
	
	return View;
});
