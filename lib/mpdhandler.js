var url = require('url');
var path = require('path');
var qs = require('querystring');
var mpdconnector = require("./mpdconnector");

MPDHandler = function(host, port) {
	this.ready = false;
	this.connection = mpdconnector(host, port);
	this.connection.connect(function() {
		this.ready = true;
	}.bind(this));
};

MPDHandler.prototype = {
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
		response.setHeader('Content-Type', '"test/json"; charset=UTF-8');
		this.connection.getStatus(function(status) {
			response.write(JSON.stringify(status));
			response.end();
		}, function(error) {
			response.writeHead(500, error);
			response.end();
		});
	},
	_handlePut: function(request, response, segments) {
		if (segments.length > 0) {
			if (segments[0] === "playlist") {
				if (segments[1] === 'song') {
					var file = new Buffer(segments[2], 'base64').toString('ascii');
					this.connection.addSongToPlayList(file);
				} else if (segments[1] === 'album') {
					var albumName = qs.unescape(segments[2]);
					this.connection.addAlbumToPlayList(albumName);
				} else if (segments[1] === 'random') {
					
				}
			}
		}
		response.setHeader('Content-Type', '"test/json"; charset=UTF-8');
		this.connection.getStatus(function(status) {
			response.write(JSON.stringify(status));
			response.end();
		}, function(error) {
			response.writeHead(500, error);
			response.end();
		});
	},
	_handleDelete: function(request, response, segments) {
		if (segments.length > 0) {
			if (segments[0] === "playlist") {
				this.connection.clearPlayList();
			}
		}
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
