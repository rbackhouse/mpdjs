define(function() {
	var baseUrl;
	var wsUrl;
	if (window.cordova) {
		baseUrl = localStorage["mpdjs.baseURL"];
		if (baseUrl === undefined) {
			wsUrl = 'ws://';
		} else {
			wsUrl = 'ws://'+baseUrl.substring(7);
		}
	} else {
		baseUrl = ".";
		wsUrl = 'ws://' + window.location.host;
	}
	console.log("baseUrl : "+baseUrl);
	console.log("wsUrl : "+wsUrl);
	return {
		getBaseUrl : function() {
			return baseUrl;
		},
		getWSUrl : function() {
			return wsUrl;
		},
		setUrl: function(newUrl) {
			baseUrl = newUrl;
			wsUrl = 'ws://' + newUrl.substring(7);
			localStorage["mpdjs.baseURL"] = newUrl;
		},
		promptForUrl: function() {
			return window.cordova && baseUrl === undefined ? true : false;
		}
	}
});