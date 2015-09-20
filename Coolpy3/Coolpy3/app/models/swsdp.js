var mongoose = require('mongoose');
var validate = require('mongoose-validator');
var Schema = mongoose.Schema;

var SwsdpSchema = new Schema({
    hubid: { type: Number , index: true},
    nodeid: { type: Number , index: true},
    value: { type: Number, required: true }
});

module.exports = mongoose.model('Swsdp', SwsdpSchema);