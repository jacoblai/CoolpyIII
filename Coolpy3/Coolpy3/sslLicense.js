var fs = require('fs');
var config = require("./config.js");

//ssl license
//var keyPath = 'ssl/key.pem';
//var certPath = 'ssl/cert.pem';

//var hskey = fs.readFileSync(keyPath);
//var hscert = fs.readFileSync(certPath);

//var options = {
//    key: hskey,
//    cert: hscert
//};
var options = {
    pfx: fs.readFileSync('ssl/i.icoolpy.com.pfx'),
    passphrase: config.httpsPwd
};
//ssl object
var ssl = {};

ssl.options = options;

module.exports = ssl;