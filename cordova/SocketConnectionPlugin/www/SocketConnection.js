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

var readListener;

var SocketConnection = {
	connect: function(host, port, cb) {
		cordova.exec(
			function(state) {
				cb(undefined, state);
			},
			function(err) {
				cb(err);
			},
			"SocketConnection",
			"connect",
			[host, port]
		);
	},
	disconnect: function() {
		cordova.exec(
			function() {
			},
			function(err) {
			},
			"SocketConnection",
			"disconnect",
			[]
		);
	},
	writeMessage: function(msg) {
		cordova.exec(
			function() {
			},
			function(err) {
			},
			"SocketConnection",
			"writeMessage",
			[msg]
		);
	},
	listen: function(listener) {
		readListener = listener;
		cordova.exec(
			function(response) {
				readListener(response);
			},
			function(err) {
			},
			"SocketConnection",
			"listen",
			[]
		);
	}
}

module.exports = SocketConnection;
