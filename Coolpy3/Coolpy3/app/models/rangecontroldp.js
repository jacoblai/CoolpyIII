var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var rangecontroldpSchema = new Schema({
    dvid: Number,
    ssid: Number,
    value: { type: Number, required: true }
});

module.exports = mongoose.model('rangecontroldp', rangecontroldpSchema);