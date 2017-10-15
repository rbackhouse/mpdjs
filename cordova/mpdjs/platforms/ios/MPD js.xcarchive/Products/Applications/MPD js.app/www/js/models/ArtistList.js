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
define(['jquery', 'backbone', './Artist', '../uiconfig', '../mpd/MPDClient', '../util/MessagePopup'], function($, Backbone, Artist, config, MPDClient, MessagePopup) {
	var ArtistList = Backbone.Collection.extend({
		index: 0,
		total: 0,
		filterValue: "all",
		model: Artist,
		url: function() {
			return config.getBaseUrl()+"/music/artists/"+this.index+"/"+encodeURIComponent(this.filterValue);
		},
		fetch: function(options) {
			if (config.isDirect()) {
				MPDClient.getAllArtists(this.index, this.filterValue, function(resp) {
					this.index = resp.index;
					this.total = resp.total;
					this.set(resp.artists, options);
			        options.success(this, resp.artists, options);
        			this.trigger('sync', this, resp.artists, options);
				}.bind(this),
				function(err) {
					options.error(undefined, {status: err}, options);
					MessagePopup.create("Get Artists Failed", "Error : "+err);
				});								
			} else {
				this.constructor.__super__.fetch.apply(this, [options]);
			}
		},
		set: function(resp, options) {
			var models = resp;
			if ($.isPlainObject(resp)) {
				this.index = resp.index;
				this.total = resp.total;
				models = resp.artists;
			}
			return Backbone.Collection.prototype.set.call(this, models, options);
		},
		reset: function(resp, options) {
			var models = resp;
			if ($.isPlainObject(resp)) {
				this.index = resp.index;
				this.total = resp.total;
				models = resp.artists;
			}
			return Backbone.Collection.prototype.reset.call(this, models, options);
		},
		hasMore: function() {
			return this.index < this.total; 
		}
	});
	return ArtistList;
});
