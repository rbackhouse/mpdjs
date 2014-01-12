define(function() {
	var url = localStorage["mpdjs.baseURL"] || window.location.host;
	var baseUrl;
	var wsUrl;
	if (window.cordova) {
		baseUrl = url;
		wsUrl = url;
	} else {
		baseUrl = ".";
		wsUrl = window.location.host;
	}
	return {
		getBaseUrl : function() {
			if (baseUrl === ".") {
				return baseUrl;
			} else {
				return 'http://'+baseUrl;
			}
			return
		},
		getWSUrl : function() {
			return 'ws://' + wsUrl;
		},
		setUrl: function(newUrl) {
			baseUrl = newUrl;
			wsUrl = newUrl;
			localStorage["mpdjs.baseURL"] = newUrl;
		},
		promptForUrl: function() {
			return window.cordova ? true : false;
		}
	}
});