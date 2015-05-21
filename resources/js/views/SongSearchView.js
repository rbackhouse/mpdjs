/*
* The MIT License (MIT)
* 
* Copyright (c) 2014 Richard Backhouse
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
		'../models/SongSearchList',
		'text!templates/SongSearch.html'], 
function($, Backbone, _, BaseView, SongSearchList, template){
	var View = BaseView.extend({
		events: function() {
		    return _.extend({}, BaseView.prototype.events, {
		    });	
		},
		initialize: function(options) {
			this.songSearchList = new SongSearchList({});
			options.header = {
				title: "Song Search"
			};
			this.constructor.__super__.initialize.apply(this, [options]);
			this.template = _.template( template) ( {} );
			$.mobile.document.one("filterablecreate", "#songList", function() {
				$("#songList").on( "filterablebeforefilter", function(e, data) { 
					e.preventDefault();
		            var $input = $( data.input );
		            var value = $input.val();
		            if (value && value.length > 2) {
						this.songSearchList.searchValue = value;
			            this.load();
		            } else {
						this.songSearchList.searchValue = undefined;
						$("#songList li").remove();
						$("#songList").listview('refresh');
		            }
				}.bind(this));
				$("#songlist").filterable("option", "filterCallback", function( index, searchValue ) {
		            return false;
				});
			}.bind(this));
		},
		render: function(){
			$(this.el).html( this.headerTemplate + this.template + this.menuTemplate );
		},
		load: function() {
			$.mobile.loading("show", { textVisible: false });
			this.songSearchList.fetch({
				success: function(collection, response, options) {
					$.mobile.loading("hide");
					$("#songList li").remove();
					collection.each(function(song) {
						$("#songList").append("<li data-icon=\"plus\"><a href='#playlist/song/"+song.get("b64file")+"'><p style=\"white-space:normal\">"+song.get("title")+" : " + song.get("artist") + " : "+song.get("album")+"</p></a></li>");
					});
					$("#songList").listview('refresh');
				}.bind(this),
				error: function(collection, xhr, options) {
					$.mobile.loading("hide");
					console.log("search song failed :"+xhr.status);
				}
			});
		}
	});
	
	return View;
});
