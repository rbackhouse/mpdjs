define(['jquery', 'mobileconfig', 'routers/router'], function($, mobileconfig, router) {
    $(document).ready(function() {
		console.log("ready");
	    this.router = new router();
	});
	
	return {};
});
