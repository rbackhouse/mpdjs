define(function() {
	var host;
	var port;
	var isDirect = false;
	if (window.cordova) {
		host = localStorage["mpdjs.host"];
		port = localStorage["mpdjs.port"];
		//isDirect = localStorage["mpdjs.isDirect"] === "true" ? true : false;
		isDirect = true;
	} else {
		host = ".";
		wsUrl = 'ws://' + window.location.host;
	}
	console.log("host : "+host);
	console.log("port : "+port);
	console.log("isDirect : "+isDirect);
	return {
		getBaseUrl: function() {
			if (host === ".") {
				return host;
			} else {
				return "http://"+host+":"+port;
			}
		},
		getWSUrl: function() {
			if (host === ".") {
				return 'ws://' + window.location.host;
			} else {
				return 'ws://'+host+":"+port;
			}
		},
		getHost: function() {
			return host;
		},
		getPort: function() {
			return port;
		},
		setHost: function(newHost) {
			host = newHost;
			localStorage["mpdjs.host"] = host;
		},
		setPort: function(newPort) {
			port = newPort;
			localStorage["mpdjs.port"] = port;
		},
		promptForUrl: function() {
			return window.cordova && host === undefined ? true : false;
		},
		isDirect: function() {
			return isDirect;
		},
		setIsDirect: function(direct) {
			isDirect = direct;
			localStorage["mpdjs.isDirect"] = isDirect === true ? "true" : "false";
		}
	}
});