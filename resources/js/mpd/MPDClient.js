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

define(['./MPDConnector', '../uiconfig'], function(MPDConnector, config) {
	var connection;
	var statusListeners = [];
	var intervalId;
	var active = true;
	
	cordova.plugins.backgroundMode.onactivate = function() {
		console.log("Background mode activated");
		active = false;
	};
	cordova.plugins.backgroundMode.ondeactivate = function() {
		console.log("Background mode deactivated");
		active = true;
	};
	
	function initialize() {
		if (connection) return;
		connection = new MPDConnector(config.getConnection().host, config.getConnection().port);
		connection.connect(function() {
			if (intervalId) {
				clearInterval(intervalId);
				intervalId = undefined;
			}
			intervalId = setInterval(function() {
				if (active) {
					connection.getStatus(function(status) {
						statusListeners.forEach(function(listener) {
							listener(status);
						});
					});
				}
			}, 1000);
		});
	}
	
	return {
		getAllArtists: function(cb) {
			initialize();
			connection.getAllArtists(cb);
		},
		getAlbums: function(artist, cb) {
			initialize();
			if (artist) {
				connection.getAlbumsForArtist(artist, cb);
			} else {
				connection.getAllAlbums(cb);
			}
		},
		getSongs: function(album, cb) {
			initialize();
			connection.getSongsForAlbum(album, cb);
		},
		getPlayList: function(cb) {
			initialize();
			connection.getPlayListInfo(cb);
		},
		searchSongs: function(searchValue, cb) {
			initialize();
			connection.getSongs(searchValue, cb);
		},
		addSongToPlayList: function(song, cb) {
			initialize();
			connection.addSongToPlayList(song, cb);
		},
		addAlbumToPlayList: function(album, cb) {
			initialize();
			connection.addAlbumToPlayList(album, cb);
		},
		randomPlayList: function(cb) {
			initialize();
			connection.clearPlayList();
			connection.getAllArtists(function(artists) {
				var songlist = [];
				for (var i = 0; i < 50; i++) {
					var artistindex = Math.floor((Math.random()*artists.length-1)+1);
					var artistName = artists[artistindex].name;
					connection.getAlbumsForArtist(artistName, function(albums) {
						var albumindex = Math.floor((Math.random()*albums.length-1)+1);
						var albumName = albums[albumindex].name;
						connection.getSongsForAlbum(albumName, function(songs) {
							var songindex = Math.floor((Math.random()*songs.length-1)+1);
							var song = songs[songindex];
							songlist.push(song.file);
							if (songlist.length > 49) {
								connection.addSongsToPlayList(songlist, function() {
									cb();
								});
							}
						});
					});
				}
			});
		},
		clearPlayList: function(cb) {
			initialize();
			connection.clearPlayList();
			cb();
		},
		removeSong: function(song, cb) {
			initialize();
			connection.removeSong(song);
			cb();
		},
		changeVolume: function(volume, cb) {
			initialize();
			connection.setVolume(volume);
			cb();
		},
		sendControlCmd: function(type, cb) {
			initialize();
			if (type === "play") {
				connection.play();
			} else if (type === "pause") {
				connection.pause();
			} else if (type === "stop") {
				connection.stop();
			} else if (type === "previous") {
				connection.previous();
			} else if (type === "next") {
				connection.next();
			} else if (type === "update") {
				connection.update();
			}
			cb();
		},
		addStatusListener: function(listener) {
			statusListeners.push(listener);
		},
		removeStatusListener: function(listener) {
			var index = statusListeners.indexOf(listener);
			if (index > -1) {
				statusListeners.splice(index, 1);
			}
		}
	};
});
