/*
* The MIT License (MIT)
* 
* Copyright (c) 2017 Richard Backhouse
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
'use strict';

(function(factory) {
	if (typeof define === "function" && define.amd) {
		define(function() {
			return factory();
		});
	} else if (typeof exports !== 'undefined') {
		factory(exports);
	}
} (function(exports) {

const ARTIST_PREFIX = "Artist: ";
const ALBUM_PREFIX = "Album: ";
const TITLE_PREFIX = "Title: ";
const TRACK_PREFIX = "Track: ";
const FILE_PREFIX = "file: ";
const TIME_PREFIX = "Time: ";
const ID_PREFIX = "Id: ";
const POS_PREFIX = "Pos: ";
const DIR_PREFIX = "directory: ";
const PLAYLIST_PREFIX = "playlist: ";
const OUTPUTID_PREFIX = "outputid: "
const OUTPUTNAME_PREFIX = "outputname: "
const OUTPUTENABLED_PREFIX = "outputenabled: "
const SUFFIX_PREFIX = "suffix: "

const INITIAL = 0;
const WRITTEN = 1;
const READING = 2;
const COMPLETE = 3;

class MPDConnectionBase {
	constructor(host, port) {
		this.host = host;
		this.port = port;
		this.queue = [];
	}
	
	getAllArtists(filter, cb, errorcb) {
		var processor = function(data) {
			var lines = MPDConnectionBase._lineSplit(data);
			var artists = [];
			for (var i = 0; i < lines.length; i++) {
				var name = lines[i].substring(ARTIST_PREFIX.length);
				if (name && name.trim().length > 0) {
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
	}
	
	getAllAlbums(filter, cb, errorcb) {
		var processor = function(data) {
			var lines = MPDConnectionBase._lineSplit(data);
			var albums = [];
			var line;
			var album;
			for (var i = 0; i < lines.length; i++) {
				line = lines[i];
				if (line.indexOf(ARTIST_PREFIX) === 0) {
					var artist = lines[i].substring(ARTIST_PREFIX.length);
					if (artist && artist.trim().length > 0 && album) {
						album.artist = artist;
					}
				} else if (line.indexOf(ALBUM_PREFIX) === 0) {
					var name = lines[i].substring(ALBUM_PREFIX.length);
					if (name && name.trim().length > 0) {
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
	}
	
	getStatus(cb, errorcb) {
		var processor = function(data) {
			var lines = MPDConnectionBase._lineSplit(data);
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
	}
	
	getStats(cb, errorcb) {
		var processor = function(data) {
			var lines = MPDConnectionBase._lineSplit(data);
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
	}
	
	getCurrentSong(cb, errorcb) {
		var processor = function(data) {
			var lines = MPDConnectionBase._lineSplit(data);
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
	}
	
	getAlbumsForArtist(artist, cb, errorcb) {
		var processor = function(data) {
			var lines = MPDConnectionBase._lineSplit(data);
			var albums = [];
			for (var i = 0; i < lines.length; i++) {
				var name = lines[i].substring(ALBUM_PREFIX.length);
				if (name && name.trim().length > 0) {
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
	}
	
	getSongsForAlbum(album, artist, cb, errorcb) {
		var processor = function(data) {
			var lines = MPDConnectionBase._lineSplit(data);
			var songs = [];
			var song;
			for (var i = 0; i < lines.length; i++) {
				var line = lines[i];
				if (line.indexOf(TITLE_PREFIX) === 0) {
					song.title = line.substring(TITLE_PREFIX.length);
				} else if (line.indexOf(TRACK_PREFIX) === 0) {
					song.track = line.substring(TRACK_PREFIX.length);
				} else if (line.indexOf(TIME_PREFIX) === 0) {
					song.time = MPDConnectionBase._convertTime(line.substring(TIME_PREFIX.length));
				} else if (line.indexOf(FILE_PREFIX) === 0) {
					song = {};
					songs.push(song);
					var file = line.substring(FILE_PREFIX.length);
					song.file = file;
					song.b64file = this.toBase64(file);
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
	}
	
	getSongs(songFilter, type, cb, errorcb) {
		var processor = function(data) {
			var lines = MPDConnectionBase._lineSplit(data);
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
					song.time = MPDConnectionBase._convertTime(line.substring(TIME_PREFIX.length));
				} else if (line.indexOf(FILE_PREFIX) === 0) {
					song = {};
					if (count++ > 99) {
						break;
					}
					songs.push(song);
					var file = line.substring(FILE_PREFIX.length);
					song.file = file;
					song.b64file = this.toBase64(file);
				}
			}				
			return songs;
		}.bind(this);
		if (!type) {
			type = "title";
		}
		this.queue.push({
			cmd: "search "+type+" \""+songFilter.replace(/"/g, "\\\"")+"\"",
			process: processor,
			cb: cb,
			errorcb: errorcb,
			response: "",
			state: INITIAL
		});
	}
	
	getPlayListInfo(cb, errorcb) {
		var processor = function(data) {
			var lines = MPDConnectionBase._lineSplit(data);
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
					song.time = MPDConnectionBase._convertTime(line.substring(TIME_PREFIX.length));
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
	}
	
	next() {
		this.queue.push({
			cmd: "next",
			response: "",
			state: INITIAL
		});
	}
	
	previous() {
		this.queue.push({
			cmd: "previous",
			response: "",
			state: INITIAL
		});
	}
	
	play() {
		this.queue.push({
			cmd: "play",
			response: "",
			state: INITIAL
		});
	}
	
	pause() {
		this.queue.push({
			cmd: "pause",
			response: "",
			state: INITIAL
		});
	}
	
	stop() {
		this.queue.push({
			cmd: "stop",
			response: "",
			state: INITIAL
		});
	}
	
	setVolume(volume) {
		this.queue.push({
			cmd: "setvol "+volume,
			response: "",
			state: INITIAL
		});
	}
	
	addAlbumToPlayList(albumName, artistName, cb) {
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
	}
	
	addSongToPlayList(song, cb, errorcb) {
		this.queue.push({
			cmd: "add \""+song+"\"",
			cb: cb,
			response: "",
			errorcb: errorcb,
			state: INITIAL
		});
	}
	
	addSongsToPlayList(songs, cb) {
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
	}
	
	addDirectoryToPlayList(dir, cb, errorcb) {
		this.listFiles(dir, function(filelist) {
			var cmd = "command_list_begin\n";
			filelist.files.forEach(function(fileEntry) {
				if (fileEntry.file.indexOf('.cue', fileEntry.file.length - '.cue'.length) === -1) {
					cmd += "add \""+dir+fileEntry.file+"\"\n";
				}
			});
			cmd += "command_list_end";
			this.queue.push({
				cmd: cmd,
				cb: cb,
				errorcb: errorcb,
				response: "",
				state: INITIAL
			});
		}.bind(this));
	}
	
	clearPlayList() {
		this.queue.push({
			cmd: "clear",
			response: "",
			state: INITIAL
		});
	}
	
	removeSong(songid) {
		this.queue.push({
			cmd: "deleteid "+songid,
			response: "",
			state: INITIAL
		});
	}
	
	update() {
		var cb = function() {
		}.bind(this);
		this.queue.push({
			cmd: "update ",
			cb: cb,
			response: "",
			state: INITIAL
		});
	}
	
	login(password) {
		this.queue.push({
			cmd: "password "+password,
			response: "",
			state: INITIAL
		});
	}
	
	runCommand(cmd, cb, errorcb) {
		var processor = function(data) {
			var lines = MPDConnectionBase._lineSplit(data);
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
	}
	
	randomPlayList(type, typevalue, cb, errorcb) {
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
			var lines = MPDConnectionBase._lineSplit(data);
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
	}
	
	listFiles(uri, cb, errorcb) {
		var processor = function(data) {
			var lines = MPDConnectionBase._lineSplit(data);
			var dirs = [];
			var files = [];
			for (var i = 0; i < lines.length; i++) {
				var line = lines[i];
				if (line.indexOf(FILE_PREFIX) === 0) {
					var file = line.substring(FILE_PREFIX.length);
					this.fileSuffixes.forEach(function(suffix) {
						if (MPDConnectionBase._endsWith(file, suffix)) {
							var b64file = this.toBase64(file);
							files.push({file: file, b64file: b64file});
						}
					}.bind(this));	
				} else if (line.indexOf(DIR_PREFIX) === 0) {
					var dir = line.substring(DIR_PREFIX.length);
					var b64dir = this.toBase64(dir);
					dirs.push({dir: dir, b64dir: b64dir});
				}				
			}
			return {files: files, dirs: dirs};			
		}.bind(this);
		var cmd = "listfiles";
		if (uri && uri !== "") {
			cmd += " \""+this.decode(uri) + "\"";
		}
		this.queue.push({
			cmd: cmd,
			process: processor,
			cb: cb,
			errorcb: errorcb,
			response: "",
			state: INITIAL
		});
	}
	
	listPlayLists(cb, errorcb) {
		var processor = function(data) {
			var lines = MPDConnectionBase._lineSplit(data);
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
	}
	
	loadPlayList(name, cb, errorcb) {
		this.queue.push({
			cmd: "load \""+name+"\"",
			cb: cb,
			errorcb: errorcb,
			response: "",
			state: INITIAL
		});
	}
	
	savePlayList(name, cb, errorcb) {
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
	}
	
	deletePlayList(name, cb, errorcb) {
		this.queue.push({
			cmd: "rm \""+name+"\"",
			cb: cb,
			errorcb: errorcb,
			response: "",
			state: INITIAL
		});
	}
	
	getOutputs(cb, errorcb) {
		var processor = function(data) {
			var lines = MPDConnectionBase._lineSplit(data);
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
		
	}
	
	enableOutput(id, cb, errorcb) {
		this.queue.push({
			cmd: "enableoutput "+id,
			cb: cb,
			errorcb: errorcb,
			response: "",
			state: INITIAL
		});
	}
	
	disableOutput(id, cb, errorcb) {
		this.queue.push({
			cmd: "disableoutput "+id,
			cb: cb,
			errorcb: errorcb,
			response: "",
			state: INITIAL
		});
	}
	
	shuffle(on, cb, errorcb) {
		var state = (on === true) ? 1 : 0;
		this.queue.push({
			cmd: "random "+state,
			cb: cb,
			errorcb: errorcb,
			response: "",
			state: INITIAL
		});
	}
	
	repeat(on, cb, errorcb) {
		var state = (on === true) ? 1 : 0;
		this.queue.push({
			cmd: "repeat "+state,
			cb: cb,
			errorcb: errorcb,
			response: "",
			state: INITIAL
		});
	}
	
	consume(on, cb, errorcb) {
		var state = (on === true) ? 1 : 0;
		this.queue.push({
			cmd: "consume "+state,
			cb: cb,
			errorcb: errorcb,
			response: "",
			state: INITIAL
		});
	}
	
	single(on, cb, errorcb) {
		var state = (on === true) ? 1 : 0;
		this.queue.push({
			cmd: "single "+state,
			cb: cb,
			errorcb: errorcb,
			response: "",
			state: INITIAL
		});
	}
	
	_loadFileSuffixes() {
		this.fileSuffixes = ['cue'];
		var processor = function(data) {
			var lines = MPDConnectionBase._lineSplit(data);
			lines.forEach(function(line) {
				var suffix = line.substring(SUFFIX_PREFIX.length);
				if (line.indexOf(SUFFIX_PREFIX) === 0 && this.fileSuffixes.indexOf(suffix) === -1) {
					this.fileSuffixes.push(suffix);
				}
			}.bind(this));
		}.bind(this);
			
		this.queue.push({
			cmd: "decoders",
			process: processor,
			response: "",
			state: INITIAL
		});
	}
	
	static _lineSplit(data) {
		var lines = [];
		var split = data.split(/\n\r|\n|\r/);
		while(split.length) {
			var line = split.shift().replace(/^\s\s*/, '').replace(/\s\s*$/, '');
			if (line !== "") {
				lines.push(line);
			}
		}
		return lines;
	}
	
	static _convertTime(rawTime) {
		var time = Math.floor(parseInt(rawTime));
		var minutes = Math.floor(time / 60);
		var seconds = time - minutes * 60;
		seconds = (seconds < 10 ? '0' : '') + seconds;
		return minutes+":"+seconds; 
	}
		
	static _endsWith(subjectString, searchString, position) {
		if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
			position = subjectString.length;
		}
		position -= searchString.length;
		var lastIndex = subjectString.lastIndexOf(searchString, position);
		return lastIndex !== -1 && lastIndex === position;
	}
	
	static get INITIAL() {
    	return INITIAL;
  	}
  	
	static get WRITTEN() {
    	return WRITTEN;
  	}
  	
	static get READING() {
    	return READING;
  	}
  	
	static get COMPLETE() {
    	return COMPLETE;
  	}
}

if (exports) {
	exports.baseclass = MPDConnectionBase;
}	
return MPDConnectionBase;

}));