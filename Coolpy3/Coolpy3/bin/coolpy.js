var app = require('../app');
var wechat = require('../wc');
var ssl = require('../sslLicense');
var config = require("../config.js");

var http = require('http');
var https = require('https');

app.set('port', config.httpPort);
app.set('httpsport', config.httpsPort);
wechat.set('wcport', config.wechatPort);
var httpServer = http.createServer(app).listen(app.get('port'));
var httpsServer = https.createServer(ssl.options, app).listen(app.get('httpsport'));
var wcServer = http.createServer(wechat).listen(wechat.get('wcport'));

console.log('Http running at http://*:' + config.httpPort);
console.log('Https running at http://*:' + config.httpsPort);
console.log('Wechat running at http://*:'+config.wechatPort + '/wechat');