/*
	Copyright (c) 2004-2012, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/

define(function() {
	var ready = false;
	var readyQ = [];

	document.addEventListener("deviceready", function(evt) {
		ready = true;
		var i;
		for (i = 0; i < readyQ.length; i++) {
			readyQ[i](1);
		}
	});

	function deviceReady(callback){
		if (ready) {
			callback(1);
		} else {
			readyQ.push(callback);
		}
	}

	deviceReady.load = function(id, req, load){
		deviceReady(load);
	};

	return deviceReady;
});