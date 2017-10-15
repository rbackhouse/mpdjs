/*
* The MIT License (MIT)
* 
* Copyright (c) 2015 Richard Backhouse
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

define(function() {
	var root;
	var mpdjsDir;
	
	function toArray(list) {
  		return Array.prototype.slice.call(list || [], 0);
	}
	
	function onError(err) {
		console.log("File System error : "+JSON.stringify(err));
	}
	
	function onFileWriteError(err) {
		console.log("File Write error : "+JSON.stringify(err));
	}
	
	function onFileDeleteError(err) {
		console.log("File Delete error : "+JSON.stringify(err));
	}
	
	
	function listDirectory(dir, cb, individual) {
		var dirReader = dir.createReader();
		var entries = [];

		var readEntries = function() {
			dirReader.readEntries (function(results) {
				if (!results.length) {
					if (individual) {
						entries.forEach(function(entry) {
							if (entry.isFile) {
								cb(entry);
							} else {
								listDirectory(entry, cb, individual);
							}
						});				
					} else {
						cb(entries);
					}
				} else {
					entries = entries.concat(toArray(results));
					readEntries();
				}
			}, onError);
		}
		readEntries();
	}
	
	function writeDataToFile(data, fileEntry, cb) {
		fileEntry.createWriter(
			function(fileWriter) {
				fileWriter.onwriteend = function(e) {
					cb();
				};
				fileWriter.onerror = onFileWriteError;
				//console.log("data written ["+fileEntry.fullPath+"] ["+JSON.stringify(data)+"]");
				var blob = new Blob([JSON.stringify(data)], {type: 'text/plain'});
				fileWriter.write(blob);
			}, 
			function(err) {
				cb(err);
			}
		);
	}
	
	function readDataFromFile(fileEntry, cb, cbError) {
		fileEntry.file(
			function(file) {
				var reader = new FileReader();
				reader.onloadend = function(e) {
					console.log("data read ["+fileEntry.fullPath+"]");
					try {
						var data = JSON.parse(this.result);
						cb(data);
					} catch (e) {
						console.log("Failed to parse data from file ["+fileEntry.fullPath+"] : "+e);
						cbError(e);
					}
				};
				reader.readAsText(file);
			}, 
			function(err) {
				cbError(err);
			}
		);		
	}
	
	if (window.cordova) {
		require(['deviceReady!'], function() {
			window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
				root = fileSystem.root;
				console.log("fileSystem : "+cordova.file.dataDirectory);
				root.getDirectory("mpdjs", {create: true}, function(dirEntry) {
					listDirectory(dirEntry, function(entry) {
						console.log("file : "+entry.name+" : "+entry.fullPath);
					}, true);
			
					mpdjsDir = dirEntry;
				}, onError);
			});
		});
	}
	
	return {
		readFile: function(fileName, cb, cbError) {
			mpdjsDir.getFile(fileName, {create: false}, function(fileEntry) {
				readDataFromFile(fileEntry, cb, cbError);
			}, cbError);
		},
		writeFile: function(fileName, data, cb, cbError) {
			mpdjsDir.getFile(fileName, {create: true}, function(fileEntry) {
				writeDataToFile(data, fileEntry, function(err) {
					if (err) {
						console.log("Failed to add process err : "+err);
						cbError(err);
					} else {
						cb();
					}
				});
			}, onError);
		},
		deleteFile: function(fileName, cb, cbError) {
			mpdjsDir.getFile(fileName, {create: false}, function(fileEntry) {
				fileEntry.remove(cb, cbError);
			}, onError);
		},
		fileExists: function(fileName, cb) {
			mpdjsDir.getFile(fileName, {create: false}, 
				function(fileEntry) {
					cb(true);
				}, 
				function(err){
					cb(false);
				}
			);
		}
	};
});