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

define([
	'../mpd/MPDClient'
],
function(MPDClient) {
	var listeners = [];
	var available = false;
	
	if (window.cordova) {
		require(['deviceReady!'], function() {
			applewatch.init(function (appGroupId) {
				console.log("Apple Watch initialized");
				available = true;
				applewatch.addListener("mpdjsCommand", function (command) {
					console.log("Apple Watch Command : "+JSON.stringify(command));
					if (command.command === "changeVolume") {
						MPDClient.changeVolume(command.value, function() {});
					} else {
						MPDClient.sendControlCmd(command.command, function() {});
					}
					listeners.forEach(function(listener) {
						listener(command);
					});
				});		
			}, function (err) {
				console.log("Apple Watch error :"+err);
			},
			"group.org.potpie.mpdjs");
		});
	}
	
	return {
		sendMessage: function(message) {
			if (available) {
				applewatch.sendMessage(message, "mpdjsStatus", 
					function() {
					},
					function(err) {
						console.log("Apple Watch sending message failed "+err);
					}
				);
			}
		},
		addListener: function(listener) {
			listeners.push(listener);
		},
		removeListener: function(listener) {
			var index = listeners.indexOf(listener);
			if (index > -1) {
				listeners.splice(index, 1);
			}
		}
	}
});