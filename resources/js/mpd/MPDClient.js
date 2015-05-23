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

define(['./MPDConnector', '../uiconfig', '../util/MessagePopup'], function(MPDConnector, config, MessagePopup) {
	var connection;
	var statusListeners = [];
	var intervalId;
	var active = true;
	
	function errorHandler(err) {
		MessagePopup.create("MPD Error", "Error : "+err);
	}
	
	if (window.cordova) {
		require(['deviceReady!'], function() {
			SocketConnection.setActiveListener(function(status) {
				if (status === "paused") {
					console.log("paused");
					active = false;
				} else {
					console.log("resumed");
					active = true;
				}
			});
		});
	}
	
	function createConnection(cb) {
		connection = new MPDConnector(config.getConnection().host, config.getConnection().port);
		connection.connect(function(error) {
			if (error) {
				cb(error);
				return;
			}
			if (intervalId) {
				clearInterval(intervalId);
				intervalId = undefined;
			}
			intervalId = setInterval(function() {
				if (active && connection) {
					connection.getStatus(function(status) {
						statusListeners.forEach(function(listener) {
							listener(status);
						});
					});
				}
			}, 1000);
			cb();
		});
	}
	
	return {
		isConnected: function() {
			return connection === undefined ? false : true;
		},
		connect: function(cb) {
			if (connection) {
				this.disconnect();
			}
			createConnection(function(error) {
				if (error) {
					connection = undefined;
				}
				cb(error);
			});
		},
		disconnect: function() {
			if (connection) {
				connection.disconnect();
				connection = undefined;
				if (intervalId) {
					clearInterval(intervalId);
					intervalId = undefined;
				}
			}
		},
		getAllArtists: function(index, filter, cb) {
			if (!connection) {
				errorHandler("notconnected");
			}
			if (filter === "all") {
				filter = undefined;
			}
			connection.getAllArtists(filter, function(artists) {
				var end = index + 50 > artists.length ? artists.length : index + 50;
				var subset = artists.slice(index, end);
				var resp = {
					artists: subset,
					index : end,
					total : artists.length
				};
				cb(resp);
			}, errorHandler);
		},
		getAlbums: function(artist, index, filter, cb) {
			if (!connection) {
				errorHandler("notconnected");
			}
			if (artist) {
				connection.getAlbumsForArtist(artist, function(albums) {
					var resp = {
						albums: albums,
						index : 0,
						total : albums.length
					};
					cb(resp);
				}, errorHandler);
			} else {
				if (filter === "all") {
					filter = undefined;
				}
				connection.getAllAlbums(filter, function(albums) {
					var end = index + 50 > albums.length ? albums.length : index + 50;
					var subset = albums.slice(index, end);
					var resp = {
						albums: subset,
						index : end,
						total : albums.length
					};
					cb(resp);
				}, errorHandler);
			}
		},
		getSongs: function(album, cb) {
			if (!connection) {
				errorHandler("notconnected");
			}
			connection.getSongsForAlbum(album, cb, errorHandler);
		},
		getPlayList: function(cb) {
			if (!connection) {
				errorHandler("notconnected");
			}
			connection.getPlayListInfo(cb, errorHandler);
		},
		searchSongs: function(searchValue, cb) {
			if (!connection) {
				errorHandler("notconnected");
			}
			connection.getSongs(searchValue, cb, errorHandler);
		},
		addSongToPlayList: function(song, cb) {
			connection.addSongToPlayList(song, cb);
		},
		addAlbumToPlayList: function(album, cb) {
			connection.addAlbumToPlayList(album, cb);
		},
		randomPlayList: function(cb) {
			connection.clearPlayList();
			connection.getAllAlbums(undefined, function(albums) {
				var songlist = [];
				for (var i = 0; i < 50; i++) {
					var albumindex = Math.floor((Math.random()*albums.length-1)+1);
					var albumName = albums[albumindex].name;
					connection.getSongsForAlbum(albumName, function(songs) {
						var songindex = Math.floor((Math.random()*songs.length-1)+1);
						var song = songs[songindex];
						if (song) {
							songlist.push(song.file);
							if (songlist.length > 49) {
								connection.addSongsToPlayList(songlist, function() {
									cb();
								}, errorHandler);
							}
						}
					}, errorHandler);
				}				
			}, errorHandler);
		},
		clearPlayList: function(cb) {
			connection.clearPlayList();
			cb();
		},
		removeSong: function(song, cb) {
			connection.removeSong(song);
			cb();
		},
		changeVolume: function(volume, cb) {
			connection.setVolume(volume);
			cb();
		},
		sendControlCmd: function(type, cb) {
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
