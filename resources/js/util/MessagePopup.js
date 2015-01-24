define(['jquery'], function($) {
	return {
		create: function(title, msg, html, cb, showCancel) {
			var $popUp = $("<div/>").popup({
				dismissible : false,
				theme : "a",
				overlayTheme : "a",
				transition : "pop"
			}).bind("popupafterclose", function() {
				$(this).remove();
			});			
			$popUp.addClass("ui-content");
			$("<h4/>", {
		        text : title
		    }).appendTo($popUp);
		    if (msg) {
				$("<p/>", {
					text : msg
				}).appendTo($popUp);
		    } else if (html) {
				$("<span/>", {
					html : html
				}).appendTo($popUp);
		    }
			$("<a>", {
				text : "Ok"
			}).buttonMarkup({
				inline : true,
				icon : "check"
			}).bind("click", function() {
				$popUp.popup("close");
				if (cb) cb();
			}).appendTo($popUp);
			
			if (showCancel) {
				$("<a>", {
					text : "Cancel"
				}).buttonMarkup({
					inline : true
				}).bind("click", function() {
					$popUp.popup("close");
				}).appendTo($popUp);
			}
			$popUp.popup("open").trigger("create");
		}
	}
});