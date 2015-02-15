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
var http = require('http');
var fs = require('fs');
var connect = require('connect');
var serveStatic = require('serve-static');
var zazloptimizer = require('zazloptimizer');
var mpdhandler = require("./mpdhandler");

var defaultPort = process.env.npm_package_config_port || 8080;
var defaultMPDPort = process.env.npm_package_config_mpdport || 6600;
var resourcecdir = fs.realpathSync(__dirname+"/../resources");
var port = process.argv.length > 2 ? parseInt(process.argv[2]) : defaultPort;
var mpdhost = process.argv.length > 3 ? process.argv[3] : "localhost";
var mpdport = process.argv.length > 4 ? parseInt(process.argv[4]) : defaultMPDPort;
var compressString = process.argv.length > 5 ? process.argv[5] : "true";
var mpdpassword = process.argv.length > 6 ? process.argv[6] : "";
var compress = compressString === "true" ? true : false;

var optimizer = zazloptimizer.createConnectOptimizer(resourcecdir, compress);
var mpdHandler = mpdhandler(mpdhost, mpdport, mpdpassword);
var app = connect()
	.use("/_javascript", optimizer)
	.use("/music", mpdHandler)
	.use(serveStatic(resourcecdir))
	.use(serveStatic(zazloptimizer.getLoaderDir()));

var server = http.createServer(app).listen(port);
mpdHandler.startWebSocketServer(server);

console.log("MPD Web Client available on HTTP port ["+port+"] connected to MPD server ["+mpdhost+":"+mpdport+"] javascript compression ["+compress+"] using password ["+mpdpassword+"]");

