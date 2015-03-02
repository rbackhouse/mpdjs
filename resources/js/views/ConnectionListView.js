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
		'text!templates/ConnectionListItem.html'], 
function($, Backbone, _, BaseView, config, MPDClient, MessagePopup, template, itemTemplate){
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
							$("#connectionList li").remove();
							config.getConnections().forEach(function(connection, index) {
								$("#connectionList").append(_.template( itemTemplate, { connection: connection, index: index, selectedIndex: config.getSelectedIndex() }));
							});
							$("#connectionList").listview('refresh');
							if (reconnect) {
								this.connect();
							}
						}.bind(this), true);
					} else {
						index = parseInt(id);
						config.setSelectedIndex(index);
						if (MPDClient.isConnected()) {
							MPDClient.disconnect();
							$("#connect").val("Connect");
							$("#connect").button('option', {icon : "check" });
							$("#connect").button("refresh");
						}						
						$("#connectionList li").remove();
						config.getConnections().forEach(function(connection, index) {
							$("#connectionList").append(_.template( itemTemplate, { connection: connection, index: index, selectedIndex: config.getSelectedIndex() }));
						});
						$("#connectionList").listview('refresh');
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
			this.template = _.template( template, { connections: config.getConnections(), selectedIndex: config.getSelectedIndex(), isConnected: MPDClient.isConnected() } );
			if (!MPDClient.isConnected() && config.getConnection()) {
				this.connect();
			}
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
			
			$("<a>", {
				text : "Ok"
			}).buttonMarkup({
				inline : true,
				icon : "check"
			}).bind("click", function() {
				$popUp.popup("close");
				var host = $("#host").val();
				var port = $("#port").val();
				var dup = false;
				config.getConnections().forEach(function(connection, index) {
					if (connection.host === host && connection.port === port) {
						dup = true;
					}					
				});
				if (!dup) {
					var index = config.addConnection(host, port);
					$("#connectionList").append(_.template( itemTemplate, { connection: {host: host, port: port }, index: index, selectedIndex: config.getSelectedIndex() }));
					$("#connectionList").listview('refresh');
				}
			}).appendTo($popUp);
			
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
			} else {
				MPDClient.connect(function(error) {
					if (error) {
						MessagePopup.create("Connection Failure", "Failed to connect to "+config.getConnection().host+":"+config.getConnection().port+" Error: "+error);
					} else {
						$("#connect").val("Disconnect");
						$("#connect").button('option', {icon : "minus" });
						$("#connect").button("refresh");
						MessagePopup.create("Connected", "Connected to "+config.getConnection().host+":"+config.getConnection().port);
						this.updateMenu();
					}
				}.bind(this));
			}
		}
	});
	
	return View;
});
