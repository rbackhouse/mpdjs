mpdjs
=====

**Note** mpdjs is no longer actively developed. See [MaximumMPD](https://github.com/rbackhouse/MaximumMPD) for a replacement

Music Player Daemon client written in javascript.

A proxy running on a nodejs server provides the connection to the Music Play Daemon process. The Frontend is written using JQuery/JQuery Mobile/Backbone/Underscore.
JavaScript optimization provided by Zazl (https://github.com/zazl/zazloptimizer). A WebSocket is used to push status updates to the browser.

Install
-------

From npm

	npm install mpdjs

From git

	git clone git@github.com:rbackhouse/mpdjs.git
	(or download the zipped source from https://github.com/rbackhouse/mpdjs/archive/master.zip)
	cd mpdjs
	npm install

Usage
-----

	node node_modules/mpdjs [http port] [MPD hostname] [MPD port] [javascript compression] [MPD password]

e.g

	node node_modules/mpdjs 8080 localhost 6600 false mypass

Point browser to http://[host]:[http port]

iOS App
-------

You can install a iOS based version of MPDjs from iTunes via https://itunes.apple.com/in/app/mpdjs/id965553250?mt=8
