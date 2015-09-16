var app = require('../app');
var ssl = require('../sslLicense');
var config = require("../config.js");

var http = require('http');
var https = require('https');

app.set('port', config.httpPort);
app.set('httpsport', config.httpsPort);

var httpServer = http.createServer(app).listen(app.get('port'));
var httpsServer = https.createServer(ssl.options, app).listen(app.get('httpsport'));

console.log('Http running at http://*:' + config.httpPort);
console.log('Https running at http://*:' + config.httpsPort);