define(function() {
	var baseUrl;
	var wsUrl;
	if (window.cordova) {
		baseUrl = "";
		wsUrl = "";
	} else {
		baseUrl = ".";
		wsUrl = 'ws://' + window.location.host;
	}
	return {
		baseUrl: baseUrl,
		wsUrl: wsUrl
	}
});