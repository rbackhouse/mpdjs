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
define(['backbone', './Song', '../uiconfig', '../mpd/MPDClient', '../util/MessagePopup'], function(Backbone, Song, config, MPDClient, MessagePopup) {
	var SongSearchList = Backbone.Collection.extend({
		initialize: function(options) {
		},
		model: Song,
		url: function() {
			var url = config.getBaseUrl()+"/music/search/";
			if (this.searchValue && this.searchValue !== "") {
				url += encodeURIComponent(this.searchValue);
			}
			if (this.searchType && this.searchType !== "") {
				url += "/"+encodeURIComponent(this.searchType);
			}
			return url;
		},
		fetch: function(options) {
			if (config.isDirect()) {
				MPDClient.searchSongs(this.searchValue, this.searchType, function(songs) {
					this.set(songs, options);
			        options.success(this, songs, options);
        			this.trigger('sync', this, songs, options);
				}.bind(this),
				function(err) {
					options.error(undefined, {status: err}, options);
					MessagePopup.create("Search Songs Failed", "Error : "+err);
				});								
			} else {
				this.constructor.__super__.fetch.apply(this, [options]);
			}
		}
	});
	return SongSearchList;
});
