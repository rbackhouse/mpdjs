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

"use strict";

define(['MPDConnectionBase'], function(MPDConnectionBase) {

class MPDConnection extends MPDConnectionBase {
	constructor(host, port) {
		super(host, port);
		this.isConnected = false;
	}
	
	connect(callback) {
		console.log("Connect to "+this.host+":"+this.port);
		SocketConnection.connect(this.host, this.port, function(error, state) {
			if (error) {
				this.isConnected = false;
				console.log("Connection error : "+error);
				if (this.queue.length > 0) {
					var task = this.queue[0];
					task.error = error;
					task.state = MPDConnectionBase.COMPLETE;
				}
				if (error === "Error: read ETIMEDOUT") {
					this.connect();
				} else if (callback) {
					callback(error);
				}
			} else if (state == "connected") {
				this.queue = [];
				this.isConnected = true;
				console.log("Connected");
				if (callback) {
					callback();
				}
			} else if (state == "internalConnected") {
				this.queue = [];
				this.isConnected = true;
				console.log("Internal Connected");
			} else if (state == "disconnected") {
				this.isConnected = false;
				console.log("Disconnected");
				//this.connect();
			}
		}.bind(this));
		
		var data = "";
		
		SocketConnection.listen(function(buffer) {
			data += buffer;
			var lastChar = buffer.charAt(buffer.length-1);
			if (lastChar != "\n" && lastChar != "\r") {
				return;
			}
			var lines = MPDConnectionBase._lineSplit(data);
			var lastLine = lines[lines.length-1];
			if (lastLine.match(/^OK MPD/)) {
				console.log("MPD connection is ready");
				this._loadFileSuffixes();
			} else if (lastLine.match(/^OK$/)) {
				if (this.queue.length > 0) {
					var task = this.queue.shift();
					task.response += data.substring(0, data.length - 4);
					task.state = MPDConnectionBase.COMPLETE;
					//console.log("cmd ["+task.cmd+"] complete");
					var result;
					if (task.process) {
						try {
							result = task.process(task.response);
						} catch(err) {
							if (task.errorcb) {
								task.errorcb(err);
							}
							console.log("Error running task ["+task.cmd+"] : "+err);
						}
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
					task.error = error.trim();
					task.state = MPDConnectionBase.COMPLETE;
					if (task.errorcb) {
						task.errorcb(task.error);
					}
					console.log("Error running task ["+task.cmd+"] : "+task.error);
				} else {
					console.log("Error : "+error);
				}
			} else {
				if (this.queue.length > 0) {
					var task = this.queue[0];
					task.state = MPDConnectionBase.READING;
					task.response += data;
				}
			}
			data = "";
		}.bind(this));
		var processQueue = function() {
			if (this.isConnected && this.queue.length > 0) {
				if (this.queue[0].state === MPDConnectionBase.INITIAL) {
					//console.log("cmd ["+this.queue[0].cmd+"] started");
					SocketConnection.writeMessage(this.queue[0].cmd+"\n");
					this.queue[0].state = MPDConnectionBase.WRITTEN;
					this.queue[0].count = 0;
				}
				if (this.queue[0].count > 20) {
					var task = this.queue.shift();
					if (task.errorcb) {
						task.errorcb("Timeout on "+task.cmd);
					}
					console.log("Timeout on "+task.cmd);
				} else {
					this.queue[0].count++;
				}
			}
		}.bind(this);
		
		var poller = function() {
			processQueue();
			setTimeout(poller, 500);
		}.bind(this);
		poller();
	}
	
	disconnect() {
		this.isConnected = false;
		console.log("Disconnect from "+this.host+":"+this.port);
		SocketConnection.disconnect();
	}
	
	toBase64(value) {
		try {
			return btoa(encodeURIComponent(value));
		} catch(err) {
			console.log(err);
			return "";
		}
	}

	decode(uri) {
		return decodeURIComponent(uri);
	}
}

return MPDConnection;
});
