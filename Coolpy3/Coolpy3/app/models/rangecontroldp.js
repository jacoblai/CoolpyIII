var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var rangecontroldpSchema = new Schema({
    hubid: Number,
    nodeid: Number,
    value: { type: Number, required: true }
});
rangecontroldpSchema.index({ hubid: 1, nodeid: 1 }, { unique: true });
module.exports = mongoose.model('rangecontroldp', rangecontroldpSchema);