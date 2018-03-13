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
		'jquery', 
		'backbone',
		'underscore', 
		'./BaseView',
		'../mpd/MPDClient',
		'../uiconfig',
		'text!templates/Settings.html'], 
function($, Backbone, _, BaseView, MPDClient, config, template) {
	var View = BaseView.extend({
		events: function() {
		    return _.extend({}, BaseView.prototype.events, {
				"click #update" : function() {
					this.sendControlCmd("update");
				},
				"click #clearCache" : function() {
					if (config.isDirect()) {
						MPDClient.clearCache();	
					}
				},
				"change #randomByType" : function() {
					var randomPlaylistConfig = {
						enabled: $("#randomByType").is(":checked"),
						type: config.getRandomPlaylistConfig().type,
						typevalue: config.getRandomPlaylistConfig().typevalue
					};
					config.setRandomPlaylistConfig(randomPlaylistConfig);
				},
				"change #startPage" : function(evt) {
					var option = $("#startPage").find('option:selected').val();
					config.setStartPage(option);
				},
				"change #isSongToPlaylist" : function() {
					config.setSongToPlaylist($("#isSongToPlaylist").is(":checked"));
				},
				"change #tapToPlaySong" : function() {
					config.setTapToPlaySong($("#tapToPlaySong").is(":checked"));
				}
		    });	
		},
		initialize: function(options) {
			options.header = {
				title: "Settings",
				backLink: false
			};
			this.constructor.__super__.initialize.apply(this, [options]);
			this.template = _.template( template ) ( 
				{
					randomPlaylistConfig: config.getRandomPlaylistConfig(), 
					startPage: config.getStartPage(),
					version: config.getVersionNumber(),
					isSongToPlaylist: config.isSongToPlaylist(),
					tapToPlaySong: config.isTapToPlaySong()
				}
			);
		},
		render: function(){
			$(this.el).html( this.headerTemplate + this.template + this.footerTemplate + this.menuTemplate + this.playingTemplate );
		},
		sendControlCmd: function(type) {
			$.mobile.loading("show", { textVisible: false });
			if (config.isDirect()) {
				MPDClient.sendControlCmd(type, function() {
					$.mobile.loading("hide");
				}.bind(this));
			} else {
				$.ajax({
					url: config.getBaseUrl()+"/music/"+type,
					type: "POST",
					headers: { "cache-control": "no-cache" },
					contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
					dataType: "text",
					success: function(data, textStatus, jqXHR) {
						$.mobile.loading("hide");
					}.bind(this),
					error: function(jqXHR, textStatus, errorThrown) {
						$.mobile.loading("hide");
						console.log("control cmd error: "+textStatus);
					}
				});
			}
		}
	});
	
	return View;
});
