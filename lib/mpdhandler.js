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
var url = require('url');
var path = require('path');
var qs = require('querystring');
var mpdconnector = require("./mpdconnector");
var ws = require('ws');

MPDHandler = function(host, port, password) {
	this.ready = false;
	this.connection = mpdconnector(host, port);
	this.connection.connect(function() {
		this.ready = true;
	}.bind(this));
	if(password) {
		this.connection.login(password);
	} else {
		console.log("No password speficied on cmdline");
	}
};

MPDHandler.prototype = {
	startWebSocketServer: function(server) {
		var wss = new ws.Server({server: server});
		wss.on('connection', function(ws) {
			var id = setInterval(function() {
				this.connection.getStatus(function(status) {
					ws.send(JSON.stringify(status), function(){});
				}, function(error) {
				});
  			}.bind(this), 1000);
			ws.on('close', function() {
			    clearInterval(id);
			});  			
		}.bind(this));
	}, 
	handle: function(request, response, next) {
		var path = request.url;
		if (path.charAt(0) == '/') {
			path = path.substring(1);
		}
		var segments = path.split("/");
		if (request.method === "GET") {
			this._handleGet(request, response, segments);
		} else if (request.method === "POST") {
			this._handlePost(request, response, segments);
		} else if (request.method === "PUT") {
			this._handlePut(request, response, segments);
		} else if (request.method === "DELETE") {
			this._handleDelete(request, response, segments);
		}
	},
	_handleGet: function(request, response, segments) {
		if (segments.length > 0) {
			response.setHeader('Content-Type', '"test/json"; charset=UTF-8');
			if (segments[0] === "artists") {
				var index = -1;
				var filter;
				if (segments.length > 1) {
					index = parseInt(segments[1]);
					filter = qs.unescape(segments[2]);
					if (filter === "all") {
						filter = undefined;
					}
				}
				this.connection.getAllArtists(filter, function(artists) {
					var subset;
					var end = index + 50 > artists.length ? artists.length : index + 50;
					if (index > -1) {
						subset = artists.slice(index, end);
					} else {
						subset = artists;
					}
					var resp = {
						artists: subset,
						index : end,
						total : artists.length
					};
					response.write(JSON.stringify(resp));
					response.end();
				});
			} else if (segments[0] === "albums") {
				if (segments.length > 1) {
					var artistName = qs.unescape(segments[1]);
					if (artistName === "all") {
						var index = -1;
						var filter;
						if (segments.length > 2) {
							index = parseInt(segments[2]);
							filter = qs.unescape(segments[3]);
							if (filter === "all") {
								filter = undefined;
							}
						}
						this.connection.getAllAlbums(filter, function(albums) {
							var subset;
							var end = index + 50 > albums.length ? albums.length : index + 50;
							if (index > -1) {
								subset = albums.slice(index, end);
							} else {
								subset = albums;
							}
							var resp = {
								albums: subset,
								index : end,
								total : albums.length
							};
							response.write(JSON.stringify(resp));
							response.end();
						}, function(error) {
							response.writeHead(500, error);
							response.end();
						});
					} else {
						this.connection.getAlbumsForArtist(artistName, function(albums) {
							var resp = {
								albums: albums,
								index : 0,
								total : albums.length
							};
							response.write(JSON.stringify(resp));
							response.end();
						}, function(error) {
							response.writeHead(500, error);
							response.end();
						});
					}
				}
			} else if (segments[0] === "songs") {
				if (segments.length > 1) {
					var albumName = qs.unescape(segments[1]);
					var artistName;
					if (segments.length > 2) {
					 	artistName = qs.unescape(segments[2]);
					}
					this.connection.getSongsForAlbum(albumName, artistName, function(songs) {
						response.write(JSON.stringify(songs));
						response.end();
					}, function(error) {
						response.writeHead(500, error);
						response.end();
					});
				}			
			} else if (segments[0] === "playlist") {
				this.connection.getPlayListInfo(function(playlist) {
					response.write(JSON.stringify(playlist));
					response.end();
				}, function(error) {
					response.writeHead(500, error);
					response.end();
				});
			} else if (segments[0] === "volume") {
				this.connection.getStatus(function(status) {
					if (status.volume) {
						response.write("{\"volume\": "+status.volume+"}");
					} else {
						response.write("{\"volume\": 0}");
					}
					response.end();
				}, function(error) {
					response.writeHead(500, error);
					response.end();
				});
			} else if (segments[0] === "status") {
				this._sendStatus(response);
			} else if (segments[0] === "search") {
				if (segments.length > 1) {
					var search = qs.unescape(segments[1]);
					var type;
					if (segments.length > 2) {
						type = qs.unescape(segments[2]);
					}
					this.connection.getSongs(search, type, function(songs) {
						response.write(JSON.stringify(songs));
						response.end();
					}, function(error) {
						response.writeHead(500, error);
						response.end();
					});
				}
			} else if (segments[0] === "files") {
				var uri;
				if (segments.length > 1) {
					uri = new Buffer(segments[1], 'base64').toString('ascii');
				}
				this.connection.listFiles(uri, function(files) {
					response.write(JSON.stringify(files));
					response.end();
				}, function(error) {
					response.writeHead(500, error);
					response.end();
				});
			} else if (segments[0] === "playlists") {
				this.connection.listPlayLists(function(playlists) {
					response.write(JSON.stringify(playlists));
					response.end();
				}, function(error) {
					response.writeHead(500, error);
					response.end();
				});
			} else if (segments[0] === "outputs") {
				this.connection.getOutputs(function(outputs) {
					response.write(JSON.stringify(outputs));
					response.end();
				}, function(error) {
					response.writeHead(500, error);
					response.end();
				});
			}
		}
	},
	_handlePost: function(request, response, segments) {
		if (segments.length > 0) {
			if (segments[0] === "play") {
				var songid;
				if (segments.length > 1) {
					songid = parseInt(segments[1]);
				}
				this.connection.play(songid);
			} else if (segments[0] === "pause") {
				this.connection.pause();
			} else if (segments[0] === "stop") {
				this.connection.stop();
			} else if (segments[0] === "previous") {
				this.connection.previous();
			} else if (segments[0] === "next") {
				this.connection.next();
			} else if (segments[0] === "volume") {
				var volume = parseInt(segments[1]);
				this.connection.setVolume(volume);
			} else if (segments[0] === "update") {
				this.connection.update();
			} else if (segments[0] === "enableoutput") {
				this.connection.enableOutput(segments[1]);
			} else if (segments[0] === "disableoutput") {
				this.connection.disableOutput(segments[1]);
			} else if (segments[0] === "shuffle") {
				var on = segments[1] === "true" ? true : false;
				this.connection.shuffle(on);
			} else if (segments[0] === "repeat") {
				var on = segments[1] === "true" ? true : false;
				this.connection.repeat(on);
			} else if (segments[0] === "consume") {
				var on = segments[1] === "true" ? true : false;
				this.connection.consume(on);
			} else if (segments[0] === "single") {
				var on = segments[1] === "true" ? true : false;
				this.connection.single(on);
			} else if (segments[0] === "replaygain") {
				var mode = segments[1];
				this.connection.replayGainMode(mode);
			} else if (segments[0] === "crossfade") {
				try {
					var seconds = parseInt(segments[1]);
					this.connection.crossfade(seconds);
				} catch (e) {
					console.log("Crossfade failed invalid seconds value : "+segments[1]);
				}	
			}
		}
		response.end();
	},
	_handlePut: function(request, response, segments) {
		var sendStatus = true;
		if (segments.length > 0) {
			if (segments[0] === "playlist") {
				if (segments[1] === 'song') {
					var file = new Buffer(segments[2], 'base64').toString('ascii');
					this.connection.addSongToPlayList(file, function(){
						response.end();
					});
				} else if (segments[1] === 'album') {
					var albumName = qs.unescape(segments[2]);
					var artistName = qs.unescape(segments[3]);
					this.connection.addAlbumToPlayList(albumName, artistName, function(){
						response.end();
					});
				} else if (segments[1] === 'directory') {
					var dir = new Buffer(segments[2], 'base64').toString('ascii');
					this.connection.addDirectoryToPlayList(dir, 
						function() {
							response.end();
						},
						function(error) {
							console.log(error);
							response.writeHead(500, encodeURIComponent(error));
							response.end();
						}
					);
				} else if (segments[1] === 'random') {
					var type;
					var typevalue;
					if (segments.length > 3) {
						type = qs.unescape(segments[2]);
						typevalue = qs.unescape(segments[3]);
					}
					sendStatus = false;
					this.connection.clearPlayList();
					this.connection.randomPlayList(type, typevalue, 
						function() {
							response.end();
						},
						function(error) {
							response.writeHead(500, error);
							response.end();
						}
					);
				} else if (segments[1] === 'save') {
					var plname = qs.unescape(segments[2]);
					this.connection.deletePlayList(plname);
					this.connection.savePlayList(plname,
						function() {
							response.end();
						},
						function(error) {
							response.writeHead(500, error);
							response.end();
						}
					);
				} else if (segments[1] === 'load') {
					var plname = qs.unescape(segments[2]);
					this.connection.loadPlayList(plname,
						function() {
							response.end();
						},
						function(error) {
							response.writeHead(500, error);
							response.end();
						}
					);
				} else if (segments[1] === 'delete') {
					var plname = qs.unescape(segments[2]);
					this.connection.deletePlayList(plname,
						function() {
							response.end();
						},
						function(error) {
							response.writeHead(500, error);
							response.end();
						}
					);
				} else if (segments[1] === 'loadCue') {
					var path = "";
					segments.forEach(function(segment, index) {
						if (index > 1) {
							path += "/"
							path += qs.unescape(segment);
						}
					});
					this.connection.loadPlayList(path.substring(1),
						function() {
							response.end();
						},
						function(error) {
							response.writeHead(500, error);
							response.end();
						}
					);
				}
			}
		}
	},
	_handleDelete: function(request, response, segments) {
		if (segments.length > 0) {
			if (segments[0] === "playlist") {
				if (segments.length > 1) {
					this.connection.removeSong(segments[1]);
				} else {
					this.connection.clearPlayList();
				}
			}
		}
		response.end();
	},
	_sendStatus: function(response) {
		response.setHeader('Content-Type', '"test/json"; charset=UTF-8');
		this.connection.getStatus(function(status) {
			response.write(JSON.stringify(status));
			response.end();
		}, function(error) {
			response.writeHead(500, error);
			response.end();
		});
	}	
};

function createHandler(host, port, password) {
	return new MPDHandler(host, port, password);
}

exports = module.exports = createHandler;
