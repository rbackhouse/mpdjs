mpdjs
======

Music Player Daemon client written in javascript. 

A proxy running on a nodejs server provides the connection to the Music Play Daemon process. The Frontend is written using JQuery/JQuery Mobile/Backbone/Underscore.
JavaScript optimization provided by Zazl (https://github.com/zazl/optimizer). A WebSocket is used to push status updates to the browser.

Prereqs: nodejs V0.8 or greater

To use:

git clone git@github.com:rbackhouse/mpdjs.git

npm install

node index.js [http port] [MPD hostname] [MPD port]

e.g

node index.js 8080 localhost 6600

Point browser to http://[host]:[http port]/mpd.html
