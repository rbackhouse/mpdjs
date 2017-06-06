/*
* The MIT License (MIT)
* 
* Copyright (c) 2012 Richard Backhouse
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
		'text!templates/ConnectionList.html',
		'text!templates/ConnectionListItem.html', 
		'text!templates/ConnectionDiscoveredItem.html'], 
function($, Backbone, _, BaseView, config, MPDClient, MessagePopup, template, itemTemplate, discoveredItemTemplate) {
	var View = BaseView.extend({
		events: function() {
		    return _.extend({}, BaseView.prototype.events, {
				"click #add" : function(evt) {
					this.addConnection();
				},
				"click #connect" : function(evt) {
					this.connect();
				},
				"click #connectionList li" : function(evt) {
					var index;
					var id = evt.target.id;
					if (id.indexOf("delete-") != -1) {
						MessagePopup.create("Delete Connection", "Are you sure you want to delete the Connection ?", undefined, function() {
							index = parseInt(id.substring("delete-".length));
							var reconnect = false;
							if (config.getSelectedIndex() === index) {
								reconnect = true;
							}
							config.removeConnection(index);
							this.loadLists();
							if (reconnect) {
								this.connect();
							}
						}.bind(this), true);
					} else {
						index = parseInt(id);
						if (config.getSelectedIndex() !== index) {
							config.setSelectedIndex(index);
							config.setDiscoveredIndex(-1);
							if (MPDClient.isConnected()) {
								MPDClient.disconnect();
								$("#connect").val("Connect");
								$("#connect").button('option', {icon : "check" });
								$("#connect").button("refresh");
							}						
							this.loadLists();
							this.connect();
						}
					}
				},
				"click #discoveredList li" : function(evt) {
					var index;
					var id = evt.target.id;
					if (id === "") {
						id = evt.target.parentNode.id;
					}
					index = parseInt(id);
					if (config.getDiscoveredIndex() !== index) {
						config.setSelectedIndex(-1);
						config.setDiscoveredIndex(index);
						this.loadLists();
						if (MPDClient.isConnected()) {
							MPDClient.disconnect();
						}
						this.connect();
					}
				}
		    });	
		},
		initialize: function() {
			var options = {};
			options.header = {
				title: "Connections"
			};
			this.constructor.__super__.initialize.apply(this, [options]);
			this.template = _.template( template ) ( { 
				connections: config.getConnections(), 
				discoveredList: config.getDiscoveredList(), 
				selectedIndex: config.getSelectedIndex(), 
				discoveredIndex: config.getDiscoveredIndex(), 
				isConnected: MPDClient.isConnected() 
			} );
			if (!MPDClient.isConnected() && config.getConnection()) {
				this.connect();
			}
			this.discoverListener = function() {
				this.loadLists();
			}.bind(this);
			config.addDiscoverListener(this.discoverListener);
		},
		render: function(){
			$(this.el).html( this.headerTemplate + this.template + this.menuTemplate );
		},
		addConnection: function() {
			var $popUp = $("<div/>").popup({
				dismissible : false,
				theme : "a",
				overlyaTheme : "a",
				transition : "pop"
			}).bind("popupafterclose", function() {
				$(this).remove();
			});			
			$popUp.addClass("ui-content");
			$("<h3/>", {
				text : "Add Connection"
			}).appendTo($popUp);
			
			$("<p/>", {
				text : "Host:"
			}).appendTo($popUp);
			
			$("<input/>", {
				id : "host",
				type : "text",
				value : "",
				autocapitalize: "off"
			}).appendTo($popUp);
			
			$("<p/>", {
				text : "Port:"
			}).appendTo($popUp);
			
			$("<input/>", {
				id : "port",
				type : "text",
				value : "6600",
				autocapitalize: "off"
			}).appendTo($popUp);
			
			$("<p/>", {
				text : "Password:"
			}).appendTo($popUp);
			
			$("<input/>", {
				id : "pwd",
				type : "password",
				autocapitalize: "off"
			}).appendTo($popUp);
			
			$("<span/>", {
				id : "errmsg"
			}).appendTo($popUp);
			
			$("#errmsg").addClass("error");
			$("<br/>", {}).appendTo($popUp);
			/*
			$("<p/>", {
				text : "Streaming Port:"
			}).appendTo($popUp);
			
			$("<input/>", {
				id : "streamingport",
				type : "text",
				value : "",
				autocapitalize: "off"
			}).appendTo($popUp);
			*/
			$("<a>", {
				text : "Ok"
			}).buttonMarkup({
				inline : true,
				icon : "check"
			}).bind("click", function() {
				var host = $("#host").val();
				var port = $("#port").val();
				var pwd = $("#pwd").val();
				if (pwd === "") {
					pwd = undefined;
				}
				if (host === "") {
					$("#errmsg").text("Enter a Host value");
					return;
				}	
				if (port === "") {
					$("#errmsg").text("Enter a Port value");
					return;
				}
				$popUp.popup("close");
				//var streamingport = $("#streamingport").val();
				var streamingport = "";
				var dup = false;
				config.getConnections().forEach(function(connection, index) {
					if (connection.host === host && connection.port === port && connection.streamingport === streamingport) {
						dup = true;
					}					
				});
				if (!dup) {
					var index = config.addConnection(host, port, streamingport, pwd);
					$("#connectionList").append(_.template( itemTemplate) ( { connection: {host: host, port: port, streamingport: streamingport }, index: index, selectedIndex: config.getSelectedIndex() }));
					$("#connectionList").listview('refresh');
					if (config.getConnections().length === 1) {
						this.connect();
					}
				}
			}.bind(this)).appendTo($popUp);
			
			$("<a>", {
				text : "Cancel"
			}).buttonMarkup({
				inline : true,
				icon : "delete"
			}).bind("click", function() {
				$popUp.popup("close");
			}).appendTo($popUp);
			
			$popUp.popup("open").trigger("create");
		},
		connect: function() {
			if (MPDClient.isConnected()) {
				MPDClient.disconnect();
				$("#connect").val("Connect");
				$("#connect").button('option', {icon : "check" });
				$("#connect").button("refresh");
				this.updateMenu();
				config.setSelectedIndex(-1);
				config.setDiscoveredIndex(-1);
				this.loadLists();
			} else if (config.getConnectionConfig()) {
				$.mobile.loading("show", { textVisible: false });
				MPDClient.connect(function(error) {
					$.mobile.loading("hide");
					if (error) {
						MessagePopup.create("Connection Failure", "Failed to connect to "+config.getConnectionConfig().host+":"+config.getConnectionConfig().port+" Error: "+error);
						config.setSelectedIndex(-1);
						config.setDiscoveredIndex(-1);
					} else {
						$("#connect").val("Disconnect");
						$("#connect").button('option', {icon : "minus" });
						$("#connect").button("refresh");
						MessagePopup.create("Connected", "Connected to "+config.getConnectionConfig().host+":"+config.getConnectionConfig().port);
						this.updateMenu();
					}
					this.loadLists();
				}.bind(this));
			}
		},
		loadLists: function() {
			$("#connectionList li").remove();
			config.getConnections().forEach(function(connection, index) {
				$("#connectionList").append(_.template( itemTemplate ) ( { connection: connection, index: index, selectedIndex: config.getSelectedIndex() }));
			});
			$("#connectionList").listview('refresh');
			$("#discoveredList li").remove();
			config.getDiscoveredList().forEach(function(discovered, index) {
				$("#discoveredList").append(_.template( discoveredItemTemplate ) ( { discovered: discovered, index: index, selectedIndex: config.getDiscoveredIndex() }));
			});
			$("#discoveredList").listview('refresh');
		},
		cleanup: function() {
			config.removeDiscoverListener(this.discoverListener);
		}
	});
	
	return View;
});
