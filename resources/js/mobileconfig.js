define(['jquery'], function($) {
	$(document).bind("mobileinit", function() {
		console.log("mobileinit");
	    //$.mobile.ajaxEnabled = false;
	    $.mobile.linkBindingEnabled = false;
	    $.mobile.hashListeningEnabled = false;
	    $.mobile.pushStateEnabled = false;
		/*
	    $('div[data-role="page"]').live('pagehide', function (event, ui) {
	        $(event.currentTarget).remove();
	    });
	    */
	});
});