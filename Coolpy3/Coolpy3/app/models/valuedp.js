var mongoose = require('mongoose');
var validate = require('mongoose-validator');
var Schema = mongoose.Schema;

var strLenValidator = [
    validate({
        validator: 'isDate',
        message: '字符串不是合法的日期'
    })
];

var ValuedpSchema = new Schema({
    dvid: Number,
    ssid: Number,
    timestamp: { type: Date, validate: strLenValidator, unique: true },
    value: { type: Number, required: true }
});

ValuedpSchema.pre('save', function (next) {
    if (!this.timestamp) {
        var now = new Date();
        now.setHours(now.getHours() + 8);
        now.setMilliseconds(0);
        this.timestamp = now;
    }
    next();
});

module.exports = mongoose.model('Valuedp', ValuedpSchema);