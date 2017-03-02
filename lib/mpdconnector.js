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
var ARTIST_PREFIX = "Artist: ";
var ALBUM_PREFIX = "Album: ";
var TITLE_PREFIX = "Title: ";
var TRACK_PREFIX = "Track: ";
var FILE_PREFIX = "file: ";
var TIME_PREFIX = "Time: ";
var ID_PREFIX = "Id: ";
var POS_PREFIX = "Pos: ";
var DIR_PREFIX = "directory: ";
var PLAYLIST_PREFIX = "playlist: ";
var OUTPUTID_PREFIX = "outputid: "
var OUTPUTNAME_PREFIX = "outputname: "
var OUTPUTENABLED_PREFIX = "outputenabled: "

var INITIAL = 0;
var WRITTEN = 1;
var READING = 2;
var COMPLETE = 3;

var net = require("net");

MPDConnection = function(host, port) {
	this.host = host;
	this.port = port;
	this.queue = [];
};

MPDConnection.prototype = {
	connect: function(callback) {
		this.socket = net.createConnection(this.port, this.host);
		this.socket.setEncoding("utf8");
		this.socket.on('connect', function(connect) {
			if (callback) {
				callback();
			}
		});
		this.socket.on('data', function(data) {
			var lines = this._lineSplit(data);
			var lastLine = lines[lines.length-1];
			if (lastLine.match(/^OK MPD/)) {
				console.log("MPD connection is ready");
			} else if (lastLine == "OK") {
				if (this.queue.length > 0) {
					var task = this.queue.shift();
					task.response += data.substring(0, data.indexOf("OK\n"));
					task.state = COMPLETE;
					//console.log("cmd ["+task.cmd+"] complete");
					var result;
					if (task.process) {
						result = task.process(task.response);
					}
					if (task.cb) {
						task.cb(result);
					}
					processQueue();
				}
			} else if (lastLine.match(/^ACK /)) {
				var error = data;
				if (this.queue.length > 0) {
					var task = this.queue.shift();
					task.error = error;
					task.state = COMPLETE;
					if (task.errorcb) {
						task.errorcb(task.error);
					}
					console.log("Error running task ["+task.cmd+"] : "+task.error);
				} else {
					console.log("Error  : "+data);
				}
			} else {
				if (this.queue.length > 0) {
					var task = this.queue[0];
					task.state = READING;
					task.response += data;
				}
			}
		}.bind(this));
		this.socket.on('end', function(connect) {
			console.log("Connection closed");
			this.connect();
		}.bind(this));
		this.socket.on('error', function(error) {
			console.log("Connection error : "+error.toString());
			if (this.queue.length > 0) {
				var task = this.queue[0];
				task.error = error.toString();
				task.state = COMPLETE;
			}
			if (error.toString() === "Error: read ETIMEDOUT") {
				this.connect();
			}
		}.bind(this));
	
		var processQueue = function() {
			if (this.queue.length > 0 && this.queue[0].state === INITIAL) {
				//console.log("cmd ["+this.queue[0].cmd+"] started");
				this.socket.write(this.queue[0].cmd+"\n");
				this.queue[0].state = WRITTEN;
			}
		}.bind(this);
		
		var poller = function() {
			processQueue();
			setTimeout(poller, 500);
		}.bind(this);
		poller();
	},
	disconnect: function() {
		this.socket.destroy();
	},
	getAllArtists: function(filter, cb, errorcb) {
		var processor = function(data) {
			var lines = this._lineSplit(data);
			var artists = [];
			for (var i = 0; i < lines.length; i++) {
				var name = lines[i].substring(ARTIST_PREFIX.length);
				if (name.trim().length > 0) {
					if (filter) {
						if (name.toLowerCase().indexOf(filter.toLowerCase()) === 0) {
							artists.push({name: name});
						}
					} else {
						artists.push({name: name});
					}
				}
			}
			artists.sort(function(a,b) {
				if (a.name < b.name) {
					return -1;
				} else if (a.name > b.name) {
					return 1;
				} else {
					return 0;
				}
			});
			return artists;
		}.bind(this);
		this.queue.push({
			cmd: "list artist",
			process: processor,
			cb: cb,
			errorcb: errorcb,
			response: "",
			state: INITIAL
		});
	},
	getAllAlbums: function(filter, cb, errorcb) {
		var processor = function(data) {
			var lines = this._lineSplit(data);
			var albums = [];
			var line;
			var album;
			for (var i = 0; i < lines.length; i++) {
				line = lines[i];
				if (line.indexOf(ARTIST_PREFIX) === 0) {
					var artist = lines[i].substring(ARTIST_PREFIX.length);
					if (name.trim().length > 0 && album) {
						album.artist = artist;
					}
				} else if (line.indexOf(ALBUM_PREFIX) === 0) {
					var name = lines[i].substring(ALBUM_PREFIX.length);
					if (name.trim().length > 0) {
						album = {name: name};
						if (filter) {
							if (name.toLowerCase().indexOf(filter.toLowerCase()) === 0) {
								albums.push(album);
							} else {
								album = undefined;
							}
						} else {
							albums.push(album);
						}
					}
				}
			}
			albums.sort(function(a,b) {
				if (a.name < b.name) {
					return -1;
				} else if (a.name > b.name) {
					return 1;
				} else {
					return 0;
				}
			});
			return albums;
		}.bind(this);
		this.queue.push({
			cmd: "list album group artist",
			process: processor,
			cb: cb,
			errorcb: errorcb,
			response: "",
			state: INITIAL
		});
	},
	getStatus: function(cb, errorcb) {
		var processor = function(data) {
			var lines = this._lineSplit(data);
			var status = {};
			var line;
			for (var i = 0; i < lines.length; i++) {
				line = lines[i];
				var key = line.substring(0, line.indexOf(':'));
				var value = line.substring(line.indexOf(':')+2);
				status[key] = value;
			}			
			return status;
		}.bind(this);
		var callback = function(status) {
			this.getCurrentSong(function(currentsong) {
				status.currentsong = currentsong;
				cb(status);
			});
		}.bind(this);
		this.queue.push({
			cmd: "status",
			process: processor,
			cb: callback,
			errorcb: errorcb,
			response: "",
			state: INITIAL
		});
	},
	getStats: function(cb, errorcb) {
		var processor = function(data) {
			var lines = this._lineSplit(data);
			var stats = {};
			var line;
			for (var i = 0; i < lines.length; i++) {
				line = lines[i];
				var key = line.substring(0, line.indexOf(':'));
				var value = line.substring(line.indexOf(':')+2);
				stats[key] = value;
			}			
			return stats;
		}.bind(this);
		this.queue.push({
			cmd: "stats",
			process: processor,
			cb: cb,
			errorcb: errorcb,
			response: "",
			state: INITIAL
		});
	},
	getCurrentSong: function(cb, errorcb) {
		var processor = function(data) {
			var lines = this._lineSplit(data);
			var currentsong = {};
			for (var i = 0; i < lines.length; i++) {
				var line = lines[i];
				if (line.indexOf(TITLE_PREFIX) === 0) {
					currentsong.title = lines[i].substring(TITLE_PREFIX.length);
				} else if (line.indexOf(ARTIST_PREFIX) === 0) {
					currentsong.artist = lines[i].substring(ARTIST_PREFIX.length);
				} else if (line.indexOf(ALBUM_PREFIX) === 0) {
					currentsong.album = lines[i].substring(ALBUM_PREFIX.length);
				} 
			}
			return currentsong;
		}.bind(this);
		this.queue.push({
			cmd: "currentsong",
			process: processor,
			errorcb: errorcb,
			cb: cb,
			response: "",
			state: INITIAL
		});
	},
	getAlbumsForArtist: function(artist, cb, errorcb) {
		var processor = function(data) {
			var lines = this._lineSplit(data);
			var albums = [];
			for (var i = 0; i < lines.length; i++) {
				var name = lines[i].substring(ALBUM_PREFIX.length);
				if (name.trim().length > 0) {
					albums.push({name: name, artist: artist});
				}
			}
			albums.sort(function(a,b) {
				if (a.name < b.name) {
					return -1;
				} else if (a.name > b.name) {
					return 1;
				} else {
					return 0;
				}
			});
			return albums;
		}.bind(this);
		this.queue.push({
			cmd: "list album artist \""+artist+"\"",
			process: processor,
			cb: cb,
			errorcb: errorcb,
			response: "",
			state: INITIAL
		});
	},
	getSongsForAlbum: function(album, artist, cb, errorcb) {
		var processor = function(data) {
			var lines = this._lineSplit(data);
			var songs = [];
			var song;
			for (var i = 0; i < lines.length; i++) {
				var line = lines[i];
				if (line.indexOf(TITLE_PREFIX) === 0) {
					song.title = line.substring(TITLE_PREFIX.length);
				} else if (line.indexOf(TRACK_PREFIX) === 0) {
					song.track = line.substring(TRACK_PREFIX.length);
				} else if (line.indexOf(TIME_PREFIX) === 0) {
					song.time = this._convertTime(line.substring(TIME_PREFIX.length));
				} else if (line.indexOf(FILE_PREFIX) === 0) {
					song = {};
					songs.push(song);
					var file = line.substring(FILE_PREFIX.length);
					var b64file = new Buffer(file).toString("base64");
					song.file = file;
					song.b64file = b64file;
				}
			}				
			return songs;
		}.bind(this);
		var cmd = "find album \""+album.replace(/"/g, "\\\"")+"\"";
		if (artist) {
			cmd += " artist \""+artist.replace(/"/g, "\\\"")+"\"";
		}
		this.queue.push({
			cmd: cmd,
			process: processor,
			cb: cb,
			errorcb: errorcb,
			response: "",
			state: INITIAL
		});
	},
	getSongs: function(songFilter, cb, errorcb) {
		var processor = function(data) {
			var lines = this._lineSplit(data);
			var songs = [];
			var song;
			var count = 0;
			for (var i = 0; i < lines.length; i++) {
				var line = lines[i];
				if (line.indexOf(ARTIST_PREFIX) === 0) {
					song.artist = line.substring(ARTIST_PREFIX.length);
				} else if (line.indexOf(ALBUM_PREFIX) === 0) {
					song.album = line.substring(ALBUM_PREFIX.length);
				} else if (line.indexOf(TITLE_PREFIX) === 0) {
					song.title = line.substring(TITLE_PREFIX.length);
				} else if (line.indexOf(TRACK_PREFIX) === 0) {
					song.track = line.substring(TRACK_PREFIX.length);
				} else if (line.indexOf(TIME_PREFIX) === 0) {
					song.time = this._convertTime(line.substring(TIME_PREFIX.length));
				} else if (line.indexOf(FILE_PREFIX) === 0) {
					song = {};
					if (count++ > 99) {
						break;
					}
					songs.push(song);
					var file = line.substring(FILE_PREFIX.length);
					var b64file = new Buffer(file).toString("base64");
					song.file = file;
					song.b64file = b64file;
				}
			}				
			return songs;
		}.bind(this);
		this.queue.push({
			cmd: "search title \""+songFilter.replace(/"/g, "\\\"")+"\"",
			process: processor,
			cb: cb,
			errorcb: errorcb,
			response: "",
			state: INITIAL
		});
	},
	getPlayListInfo: function(cb, errorcb) {
		var processor = function(data) {
			var lines = this._lineSplit(data);
			var songs = [];
			var song;
			for (var i = 0; i < lines.length; i++) {
				var line = lines[i];
				if (line.indexOf(ARTIST_PREFIX) === 0) {
					song.artist = line.substring(ARTIST_PREFIX.length);
				} else if (line.indexOf(ALBUM_PREFIX) === 0) {
					song.album = line.substring(ALBUM_PREFIX.length);
				} else if (line.indexOf(TITLE_PREFIX) === 0) {
					song.title = line.substring(TITLE_PREFIX.length);
				} else if (line.indexOf(TRACK_PREFIX) === 0) {
					song.track = line.substring(TRACK_PREFIX.length);
				} else if (line.indexOf(TIME_PREFIX) === 0) {
					song.time = this._convertTime(line.substring(TIME_PREFIX.length));
				} else if (line.indexOf(FILE_PREFIX) === 0) {
					song = {};
					songs.push(song);
					song.file = line.substring(FILE_PREFIX.length);
				} else if (line.indexOf(ID_PREFIX) === 0) {
					song.id = parseInt(line.substring(ID_PREFIX.length));
				} else if (line.indexOf(POS_PREFIX) === 0) {
					song.pos = parseInt(line.substring(POS_PREFIX.length));
				}
			}
			return songs;
		}.bind(this);
		this.queue.push({
			cmd: "playlistinfo",
			process: processor,
			cb: cb,
			errorcb: errorcb,
			response: "",
			state: INITIAL
		});
	},
	next: function() {
		this.queue.push({
			cmd: "next",
			response: "",
			state: INITIAL
		});
	},
	previous: function() {
		this.queue.push({
			cmd: "previous",
			response: "",
			state: INITIAL
		});
	},
	play: function() {
		this.queue.push({
			cmd: "play",
			response: "",
			state: INITIAL
		});
	},
	pause: function() {
		this.queue.push({
			cmd: "pause",
			response: "",
			state: INITIAL
		});
	},
	stop: function() {
		this.queue.push({
			cmd: "stop",
			response: "",
			state: INITIAL
		});
	},
	setVolume: function(volume) {
		this.queue.push({
			cmd: "setvol "+volume,
			response: "",
			state: INITIAL
		});
	},
	addAlbumToPlayList: function(albumName, artistName, cb) {
		this.getSongsForAlbum(albumName, artistName, function(songs) {
			var cmd = "command_list_begin\n";
			for (var i = 0; i < songs.length; i++) {
				cmd += "add \""+songs[i].file+"\"\n";
			}
			cmd += "command_list_end";
			this.queue.push({
				cmd: cmd,
				cb: cb,
				response: "",
				state: INITIAL
			});
		}.bind(this));
	},
	addSongToPlayList: function(song, cb) {
		this.queue.push({
			cmd: "add \""+song+"\"",
			cb: cb,
			response: "",
			state: INITIAL
		});
	},
	addSongsToPlayList: function(songs, cb) {
		var cmd = "command_list_begin\n";
		for (var i = 0; i < songs.length; i++) {
			cmd += "add \""+songs[i]+"\"\n";
		}
		cmd += "command_list_end";
		this.queue.push({
			cmd: cmd,
			cb: cb,
			response: "",
			state: INITIAL
		});
	},
	clearPlayList: function() {
		this.queue.push({
			cmd: "clear",
			response: "",
			state: INITIAL
		});
	},
	removeSong: function(songid) {
		this.queue.push({
			cmd: "deleteid "+songid,
			response: "",
			state: INITIAL
		});
	},
	update: function() {
		var cb = function() {
		}.bind(this);
		this.queue.push({
			cmd: "update ",
			cb: cb,
			response: "",
			state: INITIAL
		});
	},
	login: function(password) {
		this.queue.push({
			cmd: "password "+password,
			response: "",
			state: INITIAL
		});
	},
	runCommand: function(cmd, cb, errorcb) {
		var processor = function(data) {
			var lines = this._lineSplit(data);
			return lines;
		}.bind(this);
		this.queue.push({
			cmd: cmd,
			process: processor,
			cb: cb,
			errorcb: errorcb,
			response: "",
			state: INITIAL
		});
	},
	randomPlayList: function(type, typevalue, cb, errorcb) {
		var callback = function(songs) {
			var random = [];
			if (songs.length > 60) {
				var count = 0;
				while (count < 50) {
					var index = Math.floor((Math.random()*songs.length-1)+1);
					if (random.indexOf(songs[index]) < 0) {
						count++;
						random.push(songs[index]);
					}
				}
			} else {
				for (var i = 0; songs.length > 50 ? i < 50 : i < songs.length; i++) {
					random.push(songs[i]);
				}
			}
			this.addSongsToPlayList(random, function() {
				cb();
			});
		}.bind(this);
		var processor = function(data) {
			var lines = this._lineSplit(data);
			var songs = [];
			var count = 0;
			for (var i = 0; i < lines.length; i++) {
				var line = lines[i];
				if (line.indexOf(FILE_PREFIX) === 0) {
					songs.push(line.substring(FILE_PREFIX.length));
				}
			}				
			return songs;
		}.bind(this);
		var cmd = "search ";
		if (type) {
			cmd += type;
			cmd += " \"";
			cmd += typevalue;
			cmd += "\"";
		} else {
			cmd += "title \"\"";
		}
		this.queue.push({
			cmd: cmd,
			process: processor,
			cb: callback,
			errorcb: errorcb,
			response: "",
			state: INITIAL
		});
	},
	listFiles: function(uri, cb, errorcb) {
		var processor = function(data) {
			var lines = this._lineSplit(data);
			var dirs = [];
			var files = [];
			for (var i = 0; i < lines.length; i++) {
				var line = lines[i];
				if (line.indexOf(FILE_PREFIX) === 0) {
					var file = line.substring(FILE_PREFIX.length);
					var b64file = new Buffer(file).toString("base64");
					files.push({file: file, b64file: b64file});
				} else if (line.indexOf(DIR_PREFIX) === 0) {
					var dir = line.substring(DIR_PREFIX.length);
					var b64dir = new Buffer(dir).toString("base64");
					dirs.push({dir: dir, b64dir: b64dir});
				}				
			}
			return {files: files, dirs: dirs};			
		}.bind(this);
		var cmd = "listfiles";
		if (uri && uri !== "") {
			cmd += " \""+uri + "\"";
		}
		this.queue.push({
			cmd: cmd,
			process: processor,
			cb: cb,
			errorcb: errorcb,
			response: "",
			state: INITIAL
		});
	},
	listPlayLists: function(cb, errorcb) {
		var processor = function(data) {
			var lines = this._lineSplit(data);
			var playlists = [];
			lines.forEach(function(line) {
				if (line.indexOf(PLAYLIST_PREFIX) === 0) {
					playlists.push(line.substring(PLAYLIST_PREFIX.length));
				}				
			});
			return playlists;
		}.bind(this);
		this.queue.push({
			cmd: "listplaylists",
			process: processor,
			cb: cb,
			errorcb: errorcb,
			response: "",
			state: INITIAL
		});
	},
	loadPlayList: function(name, cb, errorcb) {
		this.queue.push({
			cmd: "load \""+name+"\"",
			cb: cb,
			errorcb: errorcb,
			response: "",
			state: INITIAL
		});
	},
	savePlayList: function(name, cb, errorcb) {
		this.getPlayListInfo(
			function(songs) {
				var cmd = "command_list_begin\n";
				songs.forEach(function(song) {
					cmd += "playlistadd \""+name+"\" \""+song.file+"\"\n";
				})
				cmd += "command_list_end";
				this.queue.push({
					cmd: cmd,
					cb: cb,
					errorcb: errorcb,
					response: "",
					state: INITIAL
				});
			}.bind(this),
			function(err) {
				errorcb(err);
			}
		);	
	},
	deletePlayList: function(name, cb, errorcb) {
		this.queue.push({
			cmd: "rm \""+name+"\"",
			cb: cb,
			errorcb: errorcb,
			response: "",
			state: INITIAL
		});
	},
	getOutputs: function(cb, errorcb) {
		var processor = function(data) {
			var lines = this._lineSplit(data);
			var outputs = [];
			var output;
			lines.forEach(function(line) {
				if (line.indexOf(OUTPUTID_PREFIX) === 0) {
					output = {};
					output.id = line.substring(OUTPUTID_PREFIX.length);
					outputs.push(output);
				} else if (line.indexOf(OUTPUTNAME_PREFIX) === 0) {
					output.name = line.substring(OUTPUTNAME_PREFIX.length);
				} else if (line.indexOf(OUTPUTENABLED_PREFIX) === 0) {
					output.enabled = line.substring(OUTPUTENABLED_PREFIX.length) === "1" ? true : false;
				}				
			});
			return outputs;
		}.bind(this);
		this.queue.push({
			cmd: "outputs",
			process: processor,
			cb: cb,
			errorcb: errorcb,
			response: "",
			state: INITIAL
		});
		
	},
	enableOutput: function(id, cb, errorcb) {
		this.queue.push({
			cmd: "enableoutput "+id,
			cb: cb,
			errorcb: errorcb,
			response: "",
			state: INITIAL
		});
	},
	disableOutput: function(id, cb, errorcb) {
		this.queue.push({
			cmd: "disableoutput "+id,
			cb: cb,
			errorcb: errorcb,
			response: "",
			state: INITIAL
		});
	},
	_lineSplit: function(data) {
		var lines = [];
		var split = data.split(/\n\r|\n|\r/);
		while(split.length) {
			var line = split.shift().replace(/^\s\s*/, '').replace(/\s\s*$/, '');
			if (line !== "") {
				lines.push(line);
			}
		}
		return lines;
	},
	_countEntries: function(lines) {
		var entry = {};
		var entryCount = 0;
		for (var i = 0; i < lines.length; i++) {
			var prefix = lines[i].substring(0, lines[i].indexOf(':'));
			if (entry[prefix]) {
				break;
			} else {
				entryCount++;
				entry[prefix] = lines[i];
			}
		}
		return entryCount;
	},
	_convertTime: function(rawTime) {
		var time = Math.floor(parseInt(rawTime));
		var minutes = Math.floor(time / 60);
		var seconds = time - minutes * 60;
		seconds = (seconds < 10 ? '0' : '') + seconds;
		return minutes+":"+seconds; 
	}
};

function createConnection(host, port) {
	return new MPDConnection(host, port);
}

exports = module.exports = createConnection;
