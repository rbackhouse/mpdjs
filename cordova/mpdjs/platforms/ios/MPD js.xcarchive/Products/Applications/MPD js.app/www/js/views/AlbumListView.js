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
		'text!templates/AlbumList.html'], 
function($, Backbone, _, BaseView, template){
	var View = BaseView.extend({
		events: function() {
		    return _.extend({}, BaseView.prototype.events, {
		    });	
		},
		initialize: function(options) {
			options.header = {
				title: "Albums",
				backLink: options.backlink
			};
			this.albums = options.albums;
			this.constructor.__super__.initialize.apply(this, [options]);
			this.template = _.template( template ) ( { albums: options.albums.toJSON(), total: options.albums.total } );
			$.mobile.document.one("filterablecreate", "#albumList", function() {
				$("#albumList").on( "filterablebeforefilter", function(e, data) { 
					e.preventDefault();
		            var $input = $( data.input );
		            var value = $input.val();
		            if (value && value.length > 0) {
						this.albums.filterValue = value;
		            } else {
						this.albums.filterValue = "all";
		            }
		            this.albums.index = 0;
		            this.albums.total = 0;
		            this.load(false);
				}.bind(this));
				$("#albumList").filterable("option", "filterCallback", function( index, searchValue ) {
		            return false;
				});
				$("#albumlistFilterForm").submit( function( evt ) {
					evt.preventDefault();
					$("#albumlistFilter").blur();
				});
			}.bind(this));
		},
		render: function(){
			$(this.el).html( this.headerTemplate + this.template + this.footerTemplate + this.menuTemplate + this.playingTemplate );
		},
		load: function(loadMore, cb) {
			if (this.albums.artist) {
				if (cb) {
					cb();
				}
				return;
			}
			$.mobile.loading("show", { textVisible: false });
			this.albums.fetch({
				success: function(collection, response, options) {
					$.mobile.loading("hide");
					if (!loadMore) {
						$("#albumList li").remove();
					}
					this.albums.each(function(album) {
						var li = '<li data-icon="arrow-r"><a href="#songs/'+encodeURIComponent(album.get("name"))+'/'+encodeURIComponent(album.get("artist"))+'"><p style="white-space:normal">'+album.get("name")+' ('+album.get("artist")+')</p></a></li>'; 
						$("#albumList").append(li);
					}.bind(this));
					$("#albumList").listview('refresh');
					$("#total").text(this.albums.total);
					if (cb) {
						cb();
					}
				}.bind(this),
				error: function(collection, xhr, options) {
					$.mobile.loading("hide");
					console.log("get albums failed :"+xhr.status);
					if (cb) {
						cb();
					}
				}
			});
		},
		loadMore: function(cb) {
			if (this.albums.hasMore()) {
				this.load(true, cb);
			} else {
				cb();
			}
		}
	});
	
	return View;
});
