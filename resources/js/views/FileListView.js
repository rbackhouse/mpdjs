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
		'../util/MessagePopup',
		'text!templates/FileList.html'], 
function($, Backbone, _, BaseView, config, MPDClient, MessagePopup, template){
	var View = BaseView.extend({
		events: function() {
		    return _.extend({}, BaseView.prototype.events, {
				"click #fileList li" : function(evt) {
					$("#filterFiles").val("");
					var id = evt.target.id;
					if (id === "") {
						id = evt.target.parentNode.id;
					}
					if (id !== "") {
						if (id.indexOf("dir_") === 0) {
							var dir = id.substring("dir_".length);
							this.load(dir);	
							this.dirs.push(dir);
						} else {
							var file = id.substring("file_".length);
							var path = "";
							this.dirs.forEach(function(dir) {
								path += atob(dir);
								path += "/";
							});
							path += atob(file);
							$.mobile.loading("show", { textVisible: false });
							if (config.isDirect()) {
								MPDClient.addSongToPlayList(decodeURIComponent(path), 
									function() {
										$.mobile.loading("hide");
									},
									function(err) {
										$.mobile.loading("hide");
										MessagePopup.create("Add Song Failed", "Error : "+err);
									}
								);
							} else {
								path = btoa(path);
								$.ajax({
									url: config.getBaseUrl()+"/music/playlist/song/"+path,
									type: "PUT",
									contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
									dataType: "text",
									success: function(data, textStatus, jqXHR) {
										$.mobile.loading("hide");
									},
									error: function(jqXHR, textStatus, errorThrown) {
										$.mobile.loading("hide");
										MessagePopup.create("Add Song Failed", "Error : "+errorThrown);
									}
								});
							}	
						}
					}					
				},
				"click #updir" : function(evt) {
					if (this.dirs.length > 0) {
						this.dirs.pop();
						this.load();	
					}				
				},
				"click #adddir" : function(evt) {
					var path = "";
					this.dirs.forEach(function(dir) {
						path += atob(dir);
						path += "/";
					});
					$.mobile.loading("show", { textVisible: false });
					if (config.isDirect()) {
						MPDClient.addDirectoryToPlayList(decodeURIComponent(path), 
							function() {
								$.mobile.loading("hide");
							},
							function(err) {
								$.mobile.loading("hide");
								MessagePopup.create("Add Directory Failed", "Error : "+err);
							}
						);
					} else {
						path = btoa(path);
						$.ajax({
							url: config.getBaseUrl()+"/music/playlist/directory/"+path,
							type: "PUT",
							contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
							dataType: "text",
							success: function(data, textStatus, jqXHR) {
								$.mobile.loading("hide");
							},
							error: function(jqXHR, textStatus, errorThrown) {
								$.mobile.loading("hide");
								MessagePopup.create("Add Song Failed", "Error : "+decodeURIComponent(errorThrown));
							}
						});
					}	
				}
		    });	
		},
		initialize: function(options) {
			options.header = {
				title: "Files",
				backLink: false
			};
			this.constructor.__super__.initialize.apply(this, [options]);
			this.template = _.template( template ) ( {} );
			this.dirs = [];
		},	
		render: function() {
			$(this.el).html( this.headerTemplate + this.template + this.menuTemplate );
			setTimeout(function() {
				this.load();
			}.bind(this), 500);
		},
		load: function(uri) {
			var path = "";
			this.dirs.forEach(function(dir) {
				path += atob(dir);
				path += "/";
			});
			if (uri) {
				path += atob(uri);
			}
			$.mobile.loading("show", { textVisible: false });
			if (config.isDirect()) {
				MPDClient.listFiles(path, 
					function(files) {
						$.mobile.loading("hide");
						$("#fileList li").remove();
						files.dirs.forEach(function(dir) {
							$("#fileList").append('<li><a id="dir_'+dir.b64dir+'"><p style="white-space:normal">'+dir.dir+'</p></a></li>');								
						});						
						files.files.forEach(function(file) {
							$("#fileList").append('<li data-icon="plus"><a id="file_'+file.b64file+'"><p style="white-space:normal">'+file.file+'</p></a></li>');								
						});						
						$("#fileList").listview('refresh');
					}.bind(this),
					function(err) {
						$.mobile.loading("hide");
						MessagePopup.create("List Files Failed", "Error : "+err);
					}
				);								
			} else {
				path = btoa(path);
				var url = config.getBaseUrl()+"/music/files";
				$.ajax({
					url: url+"/"+path,
					type: "GET",
					headers: { "cache-control": "no-cache" },
					success: function(files, textStatus, jqXHR) {
						$.mobile.loading("hide");
						$("#fileList li").remove();
						files.dirs.forEach(function(dir) {
							$("#fileList").append('<li><a id="dir_'+dir.b64dir+'"><p style="white-space:normal">'+dir.dir+'</p></a></li>');								
						});						
						files.files.forEach(function(file) {
							$("#fileList").append('<li data-icon="plus"><a id="file_'+file.b64file+'"><p style="white-space:normal">'+file.file+'</p></a></li>');								
						});						
						$("#fileList").listview('refresh');
					}.bind(this),
					error: function(jqXHR, textStatus, errorThrown) {
						$.mobile.loading("hide");
					}
				});
			}
		}
	});
	
	return View;
});
