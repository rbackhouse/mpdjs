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
		'text!templates/ArtistList.html'], 
function($, Backbone, _, BaseView, template){
	var View = BaseView.extend({
		events: function() {
		    return _.extend({}, BaseView.prototype.events, {
		    });	
		},
		initialize: function(options) {
			options.header = {
				title: "Artists",
				backLink: false
			};
			this.artists = options.artists;
			this.constructor.__super__.initialize.apply(this, [options]);
			this.template = _.template( template ) ( { artists: options.artists.toJSON(), total: options.artists.total } );
			$.mobile.document.one("filterablecreate", "#artistList", function() {
				$("#artistList").on( "filterablebeforefilter", function(e, data) { 
					e.preventDefault();
		            var $input = $( data.input );
		            var value = $input.val();
		            if (value && value.length > 0) {
						this.artists.filterValue = value;
		            } else {
						this.artists.filterValue = "all";
		            }
		            this.artists.index = 0;
		            this.artists.total = 0;
		            this.load(false);
				}.bind(this));
				$("#artistList").filterable("option", "filterCallback", function( index, searchValue ) {
		            return false;
				});
				$("#artistlistFilterForm").submit( function( evt ) {
					evt.preventDefault();
					$("#artistlistFilter").blur();
				});
			}.bind(this));
		},
		render: function(){
			$(this.el).html( this.headerTemplate + this.template + this.menuTemplate );
		},
		load: function(loadMore, cb) {
			$.mobile.loading("show", { textVisible: false });
			this.artists.fetch({
				success: function(collection, response, options) {
					$.mobile.loading("hide");
					if (!loadMore) {
						$("#artistList li").remove();
					}
					this.artists.each(function(artist) {
						var li = '<li data-icon="arrow-r"><a href="#albums/'+encodeURIComponent(artist.get("name"))+'"><p style="white-space:normal">'+artist.get("name")+'</p></a></li>'; 
						$("#artistList").append(li);
					}.bind(this));
					$("#artistList").listview('refresh');
					$("#total").text(this.artists.total);
					if (cb) {
						cb();
					}
				}.bind(this),
				error: function(collection, xhr, options) {
					$.mobile.loading("hide");
					console.log("get artists failed :"+xhr.status);
					if (cb) {
						cb();
					}
				}
			});
		},
		loadMore: function(cb) {
			if (this.artists.hasMore()) {
				this.load(true, cb);
			} else {
				cb();
			}
		}
	});
	
	return View;
});
