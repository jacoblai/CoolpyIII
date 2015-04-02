var handler = require('./handler');

var limitr = module.exports = exports = {};

module.exports = exports = function(config) {
  if(!config.limit) throw new Error('limit required');
  if(!config.rate) throw new Error('rate required');

  return handler(config);
};
