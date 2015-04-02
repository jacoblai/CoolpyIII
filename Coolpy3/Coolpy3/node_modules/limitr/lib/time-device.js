/**
 * Initialize 'TimeDevice' with the given 'config',
 *
 * @param {Object} config
 * @api private
 */

function TimeDevice(config) {
  this.requests = 0;
  this.limitExceeded = false;
  this.limit = config.limit;
  this.rate = config.rate * 1000;
}

/**
 * Start this TimeDevice.
 *
 * This will set a timeout for the rate specified in the config.
 *
 * @api private
 */

TimeDevice.prototype.start = function() {
  var self = this;
  var reset = function() {
    self.requests = 0;
    self.limitExceeded = false;
  };

  this.startTime = Date.now();
  deviceId = setTimeout(reset, this.rate);
};

/**
 *
 * @api private
 */

TimeDevice.prototype.increment = function(callback) {
  if(!this.limitExceeded) {
    this.requests++;

    if(this.requests > this.limit) {
      this.limitExceeded = true;
    }
  }
};

/**
 * How many requests left during the current rate until HTTP status 429.

 * @api private
 */

TimeDevice.prototype.remainingRequests = function() {
  var remaining = this.limit - this.requests;
  return remaining >= 0 ? remaining : 0;
};

/**
 * How much time until rate limit reset.
 *
 * @api private
 */

TimeDevice.prototype.getResetTime = function() {
  return this.startTime + this.rate;
};

/**
 *
 * @api private
 */
TimeDevice.prototype.setOwner = function(owner) {
  this.owner = owner;
};

/**
 * Expose 'TimeDevice'
 */
module.exports = exports = TimeDevice;
