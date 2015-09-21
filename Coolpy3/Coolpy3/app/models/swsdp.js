var mongoose = require('mongoose');
var validate = require('mongoose-validator');
var Schema = mongoose.Schema;

var SwsdpSchema = new Schema({
    hubid: Number,
    nodeid: Number,
    value: { type: Number, required: true }
});

module.exports = mongoose.model('Swsdp', SwsdpSchema);