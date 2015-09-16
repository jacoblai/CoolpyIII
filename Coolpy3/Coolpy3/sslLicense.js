var fs = require('fs');

//ssl license
var keyPath = 'ssl/key.pem';
var certPath = 'ssl/cert.pem';

var hskey = fs.readFileSync(keyPath);
var hscert = fs.readFileSync(certPath);

var options = {
    key: hskey,
    cert: hscert
};

//ssl object
var ssl = {};

ssl.options = options;

module.exports = ssl;