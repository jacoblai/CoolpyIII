var mongoose = require('mongoose');
var validate = require('mongoose-validator');
var Schema = mongoose.Schema;

var SwsdpSchema = new Schema({
    hubid: Number,
    nodeid: Number,
    value: { type: Number, required: true }
});
SwsdpSchema.index({ hubid: 1, nodeid: 1 }, { unique: true });
module.exports = mongoose.model('Swsdp', SwsdpSchema);