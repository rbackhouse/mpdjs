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

MPDHandler = function(host, port) {
	this.ready = false;
	this.connection = mpdconnector(host, port);
	this.connection.connect(function() {
		this.ready = true;
	}.bind(this));
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
		var requestURL = url.parse(request.url);
		var path = requestURL.pathname;
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
				this.connection.getAllArtists(function(artists) {
					response.write(JSON.stringify(artists));
					response.end();
				});
			} else if (segments[0] === "albums") {
				if (segments.length > 1) {
					var artistName = qs.unescape(segments[1]);
					console.log("artistName : "+artistName);
					this.connection.getAlbumsForArtist(artistName, function(albums) {
						response.write(JSON.stringify(albums));
						response.end();
					}, function(error) {
						response.writeHead(500, error);
						response.end();
					});
				} else {
					this.connection.getAllAlbums(function(albums) {
						response.write(JSON.stringify(albums));
						response.end();
					}, function(error) {
						response.writeHead(500, error);
						response.end();
					});
				}
			} else if (segments[0] === "songs") {
				if (segments.length > 1) {
					var albumName = qs.unescape(segments[1]);
					this.connection.getSongsForAlbum(albumName, function(songs) {
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
			}
		}
	},
	_handlePost: function(request, response, segments) {
		if (segments.length > 0) {
			if (segments[0] === "play") {
				this.connection.play();
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
					this.connection.addAlbumToPlayList(albumName, function(){
						response.end();
					});
				} else if (segments[1] === 'random') {
					sendStatus = false;
					this.connection.clearPlayList();
					this.connection.getAllArtists(function(artists) {
						var songlist = [];
						for (var i = 0; i < 50; i++) {
							var state = {connection: this.connection, _sendStatus: this._sendStatus, count: i};
							var artistindex = Math.floor((Math.random()*artists.length-1)+1);
							var artistName = artists[artistindex].name;
							this.connection.getAlbumsForArtist(artistName, function(albums) {
								var state1 = {connection: this.connection, _sendStatus: this._sendStatus, count: this.count};
								var albumindex = Math.floor((Math.random()*albums.length-1)+1);
								var albumName = albums[albumindex].name;
								this.connection.getSongsForAlbum(albumName, function(songs) {
									var state2 = {connection: this.connection, _sendStatus: this._sendStatus, count: this.count};
									var songindex = Math.floor((Math.random()*songs.length-1)+1);
									var song = songs[songindex];
									songlist.push(song.file);
									if (this.count === 49) {
										this.connection.addSongsToPlayList(songlist, function() {
											response.end();
										});
									}
								}.bind(state1), function(error) {
									response.writeHead(500, error);
									response.end();
								});
							}.bind(state), function(error) {
								response.writeHead(500, error);
								response.end();
							});
						}
					}.bind(this), function(error) {
						response.writeHead(500, error);
						response.end();
					});
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

function createHandler(host, port) {
	return new MPDHandler(host, port);
}

exports = module.exports = createHandler;
