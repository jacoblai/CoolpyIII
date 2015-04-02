/**
 * Module dependencies
 */
var TimeDevice = require('./time-device');

/**
 * Lets us access nested objects
 */
Object.byString = function(o, s) {
    s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    s = s.replace(/^\./, '');           // strip a leading dot
    var a = s.split('.');
    while (a.length) {
        var n = a.shift();
        if (n in o) {
            o = o[n];
        } else {
            return;
        }
    }
    return o;
}

var handler = function(config) {
  var self = this;
  var timeDevices = {};
  var ignore = config.ignore || [],
      clientIdField = config.clientId || 'ip',
      message = config.message || 'API rate limit exceeded.';

  self.getTimeDevice = function(clientId) {
    return timeDevices[clientId];
  };

  self.registerTimeDevice = function(clientId, timeDevice) {
    timeDevices[clientId] = timeDevice;
  };

  self.shouldIgnore = function(clientId) {
    if(ignore.length > 0) {
      for(var i = 0; i < ignore.length; i++) {
        var el = ignore[i];

        if(el === clientId) {
          return true;
        }
      }
    }

    return false;
  };

  var handle = function(req, res, next) {
    var clientId = Object.byString(req, clientIdField);
    if(!clientId) {
      throw new Error('No nested field found in req for: ' + clientIdField);
    }

    if(self.shouldIgnore(clientId)) {
      if(next) {
        return next();
      }

      return;
    }

    var timeDevice = self.getTimeDevice(clientId);
    if(!timeDevice) {
      timeDevice = new TimeDevice(config);
      timeDevice.setOwner(clientId);

      self.registerTimeDevice(clientId, timeDevice);
    }

    /* Check if timeDevice is already started */
    if(timeDevice.requests === 0) {
      timeDevice.start();
    }

    timeDevice.increment();

    res.set({
      'X-RateLimit-Limit':     config.limit,
      'X-RateLimit-Remaining': timeDevice.remainingRequests(),
      'X-RateLimit-Reset':     timeDevice.getResetTime()
    });

    if(timeDevice.limitExceeded) {
      res.send(429 /* Too Many Requests*/, { message: message });
    } else {
      if(next) {
        next();
      }
    }
  };

  return handle;
};

/**
 * Expose 'handler'
 */
module.exports = exports = handler;
