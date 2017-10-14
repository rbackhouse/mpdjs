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

const MPDConnectionBase = require('./basempdconnector').baseclass;
const net = require("net");

class MPDConnection extends MPDConnectionBase {
	constructor(host, port) {
		super(host, port);
	}
	
	connect(callback) {
		this.socket = net.createConnection(this.port, this.host);
		this.socket.setEncoding("utf8");
		this.socket.on('connect', function(connect) {
			if (callback) {
				callback();
			}
		});
		this.socket.on('data', function(data) {
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
					task.error = error.trim();
					task.state = MPDConnectionBase.COMPLETE;
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
					task.state = MPDConnectionBase.READING;
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
				task.state = MPDConnectionBase.COMPLETE;
			}
			if (error.toString() === "Error: read ETIMEDOUT") {
				this.connect();
			}
		}.bind(this));
	
		var processQueue = function() {
			if (this.queue.length > 0 && this.queue[0].state === MPDConnectionBase.INITIAL) {
				//console.log("cmd ["+this.queue[0].cmd+"] started");
				this.socket.write(this.queue[0].cmd+"\n");
				this.queue[0].state = MPDConnectionBase.WRITTEN;
			}
		}.bind(this);
		
		var poller = function() {
			processQueue();
			setTimeout(poller, 500);
		}.bind(this);
		poller();
	}
	
	disconnect() {
		this.socket.destroy();
	}
	
	toBase64(value) {
		return new Buffer(value).toString("base64");
	}

	decode(uri) {
		return uri;
	}
}


function createConnection(host, port) {
	return new MPDConnection(host, port);
}

exports = module.exports = createConnection;
