var mosca = require('mosca');
var UserModel = require('./app/models/admin.js');
var config = require('./config.js');
var settings = {
    port: config.mqttPort
};

//here we start mosca
var server = new mosca.Server(settings);
server.on('ready', setup);

// fired when the mqtt server is ready
function setup() {
    server.authorizePublish = authorizePublish;
    server.authorizeSubscribe = authorizeSubscribe;
    console.log('mqtt server is up and running')
}

var authorizePublish = function (client, topic, payload, callback) {
    var ukey = topic.split('/')[0];
    UserModel.findOne({ ukey: ukey }, function (err, u) {
        if (u !== null) {
            callback(null, true);
            //console.log("topic key ok in mqtt server")
        } else {
            callback(null, false);
            //console.log("topic key error in mqtt server")
        }
    });
    return;
}

var authorizeSubscribe = function (client, topic, callback) {
    var ukey = topic.split('/')[0];
    UserModel.findOne({ ukey: ukey }, function (err, u) {
        if (u !== null) {
            callback(null, true);
            //console.log("topic key ok in mqtt server")
        } else {
            callback(null, false);
            //console.log("topic key error in mqtt server")
        }
    });
    return;
}

// fired whena  client is connected
server.on('clientConnected', function (client) {
    console.log('client connected', client.id);
});

server.published = function (packet, client, callback) {
    if (packet.topic.indexOf('echo') === 0) {
        return callback();
    }
    
    var newPacket = {
        topic: 'echo/' + packet.topic,
        payload: packet.payload,
        retain: packet.retain,
        qos: packet.qos
    };
    
    //console.log('newPacket', newPacket);
    
    server.publish(newPacket, callback);
}

// fired when a client subscribes to a topic
server.on('subscribed', function (topic, client) {
    console.log('subscribed : ', topic);
});

// fired when a client subscribes to a topic
server.on('unsubscribed', function (topic, client) {
    console.log('unsubscribed : ', topic);
});

// fired when a client is disconnecting
server.on('clientDisconnecting', function (client) {
    console.log('clientDisconnecting : ', client.id);
});

// fired when a client is disconnected
server.on('clientDisconnected', function (client) {
    console.log('clientDisconnected : ', client.id);
});

//var message = {
//    topic: 'echo/device/' + req.params.dvid + '/sensor/' + req.params.ssid + '/datapoint',
//    payload: req.body, // or a Buffer
//    qos: 0, // 0, 1, or 2
//    retain: false // or true
//};
//server.publish(message, function () {
//    console.log('done!');
//});