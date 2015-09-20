var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var rangecontroldpSchema = new Schema({
    hubid: { type: Number , index: true},
    nodeid: { type: Number , index: true},
    value: { type: Number, required: true }
});

module.exports = mongoose.model('rangecontroldp', rangecontroldpSchema);