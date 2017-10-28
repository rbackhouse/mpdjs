/*
* The MIT License (MIT)
* 
* Copyright (c) 2017 Richard Backhouse
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
		'jquery', 
		'backbone',
		'underscore', 
		'./BaseView',
		'../uiconfig',
		'../mpd/MPDClient',
		'text!templates/OutputList.html',
		'text!templates/OutputListItem.html'], 
function($, Backbone, _, BaseView, config, MPDClient, template, itemTemplate){
	var View = BaseView.extend({
		events: function() {
		    return _.extend({}, BaseView.prototype.events, {
				"click #outputList li" : function(evt) {
					var id = evt.target.id;
					if (id === "") {
						id = evt.target.parentNode.id;
					}
					if (id) {
						var output = this.outputs.get(id);
						var enabled = output.get("enabled");
						$.mobile.loading("show", { textVisible: false });
						if (config.isDirect()) {
							if (enabled) {
								MPDClient.disableOutput(id, function() {
									$.mobile.loading("hide");
									output.set("enabled", false);
									this.refresh();
								}.bind(this));
							} else {
								MPDClient.enableOutput(id, function() {
									$.mobile.loading("hide");
									output.set("enabled", true);
									this.refresh();
								}.bind(this));
							}	
						} else {
							var cmd = enabled ? "disableoutput" : "enableoutput";
							$.ajax({
								url: config.getBaseUrl()+"/music/"+cmd+"/"+id,
								type: "POST",
								contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
								dataType: "text",
								success: function(data, textStatus, jqXHR) {
									$.mobile.loading("hide");
									output.set("enabled", !enabled);
									this.refresh();
								}.bind(this),
								error: function(jqXHR, textStatus, errorThrown) {
									$.mobile.loading("hide");
									console.log("addsong failed :"+errorThrown);
								}
							});
						}
					}
		    	}
		    });	
		},
		initialize: function(options) {
			this.outputs = options.outputs;
			options.header = {
				title: "Outputs",
				backLink: false
			};
			this.constructor.__super__.initialize.apply(this, [options]);
			this.template = _.template( template ) ( { outputs: options.outputs.toJSON() } );
		},
		render: function() {
			$(this.el).html( this.headerTemplate + this.template + this.footerTemplate + this.menuTemplate + this.playingTemplate );
		},
		refresh: function() {
			$("#outputList li").remove();
			this.outputs.each(function(output) {
				$("#outputList").append(_.template( itemTemplate) ( {output: output} ));
			});
			$("#outputList").listview('refresh');
		}
	});
	
	return View;
});
