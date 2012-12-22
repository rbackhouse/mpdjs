var http = require('http');
var fs = require('fs');
var connect = require('connect');
var zazloptimizer = require('zazloptimizer');
var mpdhandler = require("./mpdhandler");

var defaultPort = process.env.npm_package_config_port || 8080;
var defaultMPDPort = process.env.npm_package_config_mpdport || 6600;
var resourcecdir = fs.realpathSync("./resources");
var port = process.argv.length > 2 ? parseInt(process.argv[2]) : defaultPort;
var mpdhost = process.argv.length > 3 ? process.argv[3] : "localhost";
var mpdport = process.argv.length > 4 ? parseInt(process.argv[4]) : defaultMPDPort;

var optimizer = zazloptimizer.createConnectOptimizer(resourcecdir, false);

var app = connect()
	.use("/_javascript", optimizer)
	.use("/music", mpdhandler(mpdhost, mpdport))
	.use(connect.static(resourcecdir))
	.use(connect.static(zazloptimizer.getLoaderDir()));

http.createServer(app).listen(port);

console.log("MPD Web Client available on HTTP port ["+port+"] connected to MPD server ["+mpdhost+":"+mpdport+"]");

