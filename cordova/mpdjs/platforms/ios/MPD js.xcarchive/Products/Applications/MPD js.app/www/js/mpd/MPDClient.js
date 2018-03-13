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

define(['./MPDConnector', '../uiconfig', '../util/MessagePopup', './FS'], function(MPDConnector, config, MessagePopup, FS) {
	var connection;
	var statusListeners = [];
	var intervalId;
	var active = true;
	var audio;
	var streamurl;
	
	function errorHandler(err, cb) {
		MessagePopup.create("MPD Error", "Error : "+err);
		if (cb) {
			cb(err);
		}
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
		connection = new MPDConnector(config.getConnectionConfig().host, config.getConnectionConfig().port);
		if (connection) {	
			connection.connect(function(error) {
				if (error) {
					errorHandler(error, cb);
					return;
				}
				if (config.getConnectionConfig().streamingport !== "") {
					streamurl = "http://"+config.getConnectionConfig().host+":"+config.getConnectionConfig().streamingport;
					createAudio();
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
				if (config.getConnectionConfig().pwd) {
					connection.login(config.getConnectionConfig().pwd);
				}
				cb();
			});
		}
	}
	
	function createAudio() {
		console.log("creating audio tag for "+streamurl);
		audio = new Audio(streamurl);
		console.log("can play flac = "+audio.canPlayType("audio/flac; codecs=\"vorbis\""));
		audio.addEventListener("error", function() {
			console.log("error playing audio");
		}, false);
		audio.addEventListener("canplay", function() {
			console.log("can play audio");
		}, false);
		audio.addEventListener("waiting", function() {
			console.log("waiting for audio");
		}, false);
		audio.addEventListener("playing", function() {
			console.log("playing audio");
		}, false);
		audio.addEventListener("ended", function() {
			console.log("audio ended");
		}, false);
		audio.addEventListener("canplaythrough", function() {
			console.log("can play through");
		}, false);
		var eventListener = function(e) {
			console.log("media event: "+e.type);
		}
		audio.addEventListener('durationchange', eventListener, false);
		audio.addEventListener('emptied', eventListener, false);
		audio.addEventListener('error', eventListener, false);
		audio.addEventListener('loadeddata', eventListener, false);
		audio.addEventListener('loadedmetadata', eventListener, false);
		audio.addEventListener('loadstart', eventListener, false);
		audio.addEventListener('pause', eventListener, false);
		audio.addEventListener('progress', eventListener, false);
		audio.addEventListener('ratechange', eventListener, false);
		audio.addEventListener('readystatechange', eventListener, false);
		audio.addEventListener('seeked', eventListener, false);
		audio.addEventListener('seeking', eventListener, false);
		audio.addEventListener('stalled', eventListener, false);
		audio.addEventListener('suspend', eventListener, false);
		audio.addEventListener('volumechange', eventListener, false);
	}
	
	config.addDiscoverListener(function(evt) {
		if (evt.removed && connection) {
			if (evt.removed.host === connection.host && evt.removed.port === connection.port) {
				disconnect();
				config.setDiscoveredIndex(-1);
			}
		}
	});
	
	function disconnect() {
		connection.disconnect();
		connection = undefined;
		if (audio) {
			audio = undefined;
			streamurl = undefined;
		}
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = undefined;
		}
	}
	
	return {
		isConnected: function() {
			return connection === undefined ? false : true;
		},
		connect: function(cb) {
			if (connection) {
				this.disconnect();
			}
			this.artists = undefined;
			this.albums = undefined;
			createConnection(function(error) {
				if (error) {
					connection = undefined;
				}
				cb(error);
			});
		},
		disconnect: function() {
			if (connection) {
				disconnect();	
			}
		},
		getAllArtists: function(index, filter, cb, errcb) {
			if (!connection) {
				errorHandler("Connection has been lost", cb);
				return;
			}
			if (filter === "all") {
				filter = undefined;
			}
			
			var filterArtists = function(artists) {
				this.artists = artists;
				if (filter) {
					var filtered = [];
					artists.forEach(function(artist) {
						if (artist.name.toLowerCase().indexOf(filter.toLowerCase()) === 0) {
							filtered.push(artist);
						}
					});
					processArtists(filtered);
				} else {
					processArtists(artists);
				}
			}.bind(this);
			
			var processArtists = function(artists) {
				var end = index + 50 > artists.length ? artists.length : index + 50;
				var subset = artists.slice(index, end);
				var resp = {
					artists: subset,
					index : end,
					total : artists.length
				};
				cb(resp);
			};
			
			if (this.artists) {
				filterArtists(this.artists);
				return;
			}
			
			var fileName = config.getConnectionConfig().host+"_"+config.getConnectionConfig().port+"_artists.json";
			FS.readFile(
				fileName, 
				filterArtists, 
				function(err) {
					connection.getAllArtists(filter, function(artists) {
						this.artists = artists;
						processArtists(artists);
						FS.writeFile(fileName, artists, function() {
							console.log(fileName+" written");
						});
					}.bind(this), errcb);
				}.bind(this)
			);
		},
		getAlbums: function(artist, index, filter, cb, errcb) {
			if (!connection) {
				errorHandler("Connection has been lost", cb);
				return;
			}
			if (artist) {
				connection.getAlbumsForArtist(artist, function(albums) {
					var resp = {
						albums: albums,
						index : 0,
						total : albums.length
					};
					cb(resp);
				}, errcb);
			} else {
				if (filter === "all") {
					filter = undefined;
				}
				
				var filterAlbums = function(albums) {
					this.albums = albums;
					if (filter) {
						var filtered = [];
						albums.forEach(function(album) {
							if (album.name.toLowerCase().indexOf(filter.toLowerCase()) === 0) {
								filtered.push(album);
							}
						});
						processAlbums(filtered);
					} else {
						processAlbums(albums);
					}
				}.bind(this);
				
				var processAlbums = function(albums) {
					var end = index + 50 > albums.length ? albums.length : index + 50;
					var subset = albums.slice(index, end);
					var resp = {
						albums: subset,
						index : end,
						total : albums.length
					};
					cb(resp);
				};
				
				if (this.albums) {
					filterAlbums(this.albums);
					return;
				}
				var fileName = config.getConnectionConfig().host+"_"+config.getConnectionConfig().port+"_albums.json";
				FS.readFile(fileName, 
					filterAlbums,
					function(err) {
						connection.getAllAlbums(filter, function(albums) {
							this.albums = albums;
							processAlbums(albums);
							FS.writeFile(fileName, albums, function() {
								console.log(fileName+" written");
							});
						}.bind(this), errcb);
					}.bind(this)
				);
			}
		},
		getSongs: function(album, artist, cb, errcb) {
			if (!connection) {
				errorHandler("Connection has been lost", cb);
				return;
			}
			connection.getSongsForAlbum(album, artist, cb, errcb);
		},
		getPlayList: function(cb, errcb) {
			if (!connection) {
				errorHandler("Connection has been lost", cb);
				return;
			}
			connection.getPlayListInfo(cb, errcb);
		},
		searchSongs: function(searchValue, searchType, cb, errcb) {
			if (!connection) {
				errorHandler("Connection has been lost", cb);
				return;
			}
			connection.getSongs(searchValue, searchType,cb, errcb);
		},
		addSongToPlayList: function(song, cb, errcb) {
			if (!connection) {
				errorHandler("Connection has been lost", cb);
				return;
			}
			connection.addSongToPlayList(song, cb, errcb);
		},
		addAlbumToPlayList: function(album, artist, cb) {
			if (!connection) {
				errorHandler("Connection has been lost", cb);
				return;
			}
			connection.addAlbumToPlayList(album, artist, cb);
		},
		addDirectoryToPlayList: function(dir, cb, errorcb) {
			if (!connection) {
				errorHandler("Connection has been lost", cb);
				return;
			}
			connection.addDirectoryToPlayList(dir, cb, errorcb);
		},
		randomPlayList: function(cb) {
			if (!connection) {
				errorHandler("Connection has been lost", cb);
				return;
			}
			connection.clearPlayList();
			
			function createPlaylist(albums) {
				var songlist = [];
				for (var i = 0; i < 50; i++) {
					var albumindex = Math.floor((Math.random()*albums.length-1)+1);
					var albumName = albums[albumindex].name;
					connection.getSongsForAlbum(albumName, undefined, function(songs) {
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
			}
			
			if (this.albums) {
				createPlaylist(this.albums);
			} else {
				connection.getAllAlbums(undefined, function(albums) {
					createPlaylist(albums);
				}, errorHandler);
			}
		},
		randomPlayListByType: function(type, typevalue, cb) {
			if (!connection) {
				errorHandler("Connection has been lost", cb);
				return;
			}
			connection.clearPlayList();
			connection.randomPlayList(type, typevalue, function() {
				cb();
			});
		},
		clearPlayList: function(cb) {
			if (!connection) {
				errorHandler("Connection has been lost", cb);
				return;
			}
			connection.clearPlayList();
			cb();
		},
		removeSong: function(song, cb) {
			if (!connection) {
				errorHandler("Connection has been lost", cb);
				return;
			}
			connection.removeSong(song);
			cb();
		},
		changeVolume: function(volume, cb) {
			if (!connection) {
				errorHandler("Connection has been lost", cb);
				return;
			}
			connection.setVolume(volume);
			cb();
		},
		sendControlCmd: function(type, cb) {
			if (!connection) {
				errorHandler("Connection has been lost", cb);
				return;
			}
			if (type === "play") {
				connection.play();
				if (audio) {
					audio.play();
				}
			} else if (type === "pause") {
				connection.pause();
				if (audio) {
					audio.play();
				}
			} else if (type === "stop") {
				connection.stop();
				if (audio) {
					audio.pause();
					audio = undefined;
					createAudio();
				}
			} else if (type === "previous") {
				connection.previous();
				if (audio) {
					audio.pause();
					audio = undefined;
					createAudio();
					audio.play();
				}
			} else if (type === "next") {
				connection.next();
				if (audio) {
					audio.pause();
					audio = undefined;
					createAudio();
					audio.play();
				}
			} else if (type === "update") {
				connection.update();
			}
			cb();
		},
		playSongId: function(songid, cb) {
			if (!connection) {
				errorHandler("Connection has been lost", cb);
				return;
			}
			connection.play(songid);
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
		},
		clearCache: function() {
			this.artists = undefined;
			this.albums = undefined;
			var artistsFileName = config.getConnectionConfig().host+"_"+config.getConnectionConfig().port+"_artists.json";
			var albumsFileName = config.getConnectionConfig().host+"_"+config.getConnectionConfig().port+"_albums.json";

			FS.deleteFile(artistsFileName, function() {
				console.log(artistsFileName+" deleted");
			}, function(err) {
				console.log("Error deleting "+artistsFileName+" : "+err);
			});
			FS.deleteFile(albumsFileName, function() {
				console.log(albumsFileName+" deleted");
			}, function(err) {
				console.log("Error deleting "+albumsFileName+" : "+err);
			});
		},
		listFiles: function(uri, cb, errorcb) {
			if (!connection) {
				errorHandler("Connection has been lost", errorcb);
				return;
			}
			connection.listFiles(uri, cb, errorcb);			
		},
		listPlayLists: function(cb, errorcb) {
			if (!connection) {
				errorHandler("Connection has been lost", errorcb);
				return;
			}
			connection.listPlayLists(cb, errorcb);			
		},
		loadPlayList: function(name, cb, errorcb) {
			if (!connection) {
				errorHandler("Connection has been lost", errorcb);
				return;
			}
			connection.loadPlayList(name, cb, errorcb);			
		},
		savePlayList: function(name, cb, errorcb) {
			if (!connection) {
				errorHandler("Connection has been lost", errorcb);
				return;
			}
			connection.deletePlayList(name);
			connection.savePlayList(name, cb, errorcb);			
		},
		deletePlayList: function(name, cb, errorcb) {
			if (!connection) {
				errorHandler("Connection has been lost", errorcb);
				return;
			}
			connection.deletePlayList(name, cb, errorcb);			
		},
		getOutputs: function(cb, errorcb) {
			if (!connection) {
				errorHandler("Connection has been lost", errorcb);
				return;
			}
			connection.getOutputs(cb, errorcb);			
		},
		enableOutput: function(id, cb, errorcb) {
			if (!connection) {
				errorHandler("Connection has been lost", errorcb);
				return;
			}
			connection.enableOutput(id, cb, errorcb);			
		},
		disableOutput: function(id, cb, errorcb) {
			if (!connection) {
				errorHandler("Connection has been lost", errorcb);
				return;
			}
			connection.disableOutput(id, cb, errorcb);			
		},
		shuffle: function(on, cb, errorcb) {
			if (!connection) {
				errorHandler("Connection has been lost", errorcb);
				return;
			}
			connection.shuffle(on, cb, errorcb);			
		},
		repeat: function(on, cb, errorcb) {
			if (!connection) {
				errorHandler("Connection has been lost", errorcb);
				return;
			}
			connection.repeat(on, cb, errorcb);			
		},
		consume: function(on, cb, errorcb) {
			if (!connection) {
				errorHandler("Connection has been lost", errorcb);
				return;
			}
			connection.consume(on, cb, errorcb);			
		},
		single: function(on, cb, errorcb) {
			if (!connection) {
				errorHandler("Connection has been lost", errorcb);
				return;
			}
			connection.single(on, cb, errorcb);			
		}
	};
});
