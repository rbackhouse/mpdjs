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
	var available = false;
	var previousStatus;
	
	function statusHasChanged(status) {
		if (previousStatus) {
			if (status.state !== previousStatus.state) {
				return true;				
			} 
			if (status.volume !== previousStatus.volume) {
				return true;				
			} 
			if (status.currentsong) {
				if (status.currentsong.title !== previousStatus.currentsong.title) {
					return true;				
				} 
				if (status.currentsong.artist !== previousStatus.currentsong.artist) {
					return true;				
				} 
				if (status.currentsong.album !== previousStatus.currentsong.album) {
					return true;				
				} 
			}
			return false;
		} else {
			return true;
		}
	}
	
	var statusListener = function(status) {
		var sendStatus = true;
		//if (statusHasChanged(status)) {
			var currentSong = {artist: "", album: "", title: ""};
			var strTime = "";
			var volume = -1;
			if (status.currentsong && status.currentsong.artist && status.state != "stop") {
				currentSong = status.currentsong;
				var time = Math.floor(parseInt(status.time));
				var minutes = Math.floor(time / 60);
				var seconds = time - minutes * 60;
				seconds = (seconds < 10 ? '0' : '') + seconds;
				strTime = minutes+":"+seconds;
				volume = parseInt(status.volume)
			}
			var message = {state: status.state, volume: volume, currentSong: currentSong, time: strTime};
			applewatch.sendMessage(message, "mpdjsStatus", 
				function() {
				},
				function(err) {
					console.log("Apple Watch sending message failed "+err);
				}
			);
		//}
		previousStatus = status;
	}.bind(this);
	
	
	if (window.cordova) {
		require(['deviceReady!'], function() {
			applewatch.init(function (appGroupId) {
				console.log("Apple Watch initialized");
				available = true;
				MPDClient.addStatusListener(statusListener);
				applewatch.addListener("mpdjsCommand", function (command) {
					previousStatus = undefined;
					console.log("Apple Watch Command : "+JSON.stringify(command));
					if (command.command === "changeVolume") {
						MPDClient.changeVolume(command.value, function() {});
					} else {
						MPDClient.sendControlCmd(command.command, function() {});
					}
				});		
			}, function (err) {
				console.log("Apple Watch error :"+err);
			},
			"group.org.potpie.mpdjs");
		});
	}
	
	return {}
});