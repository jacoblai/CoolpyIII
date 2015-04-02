var mongoose = require('mongoose');
var validate = require('mongoose-validator');
var Schema = mongoose.Schema;

var strLenValidator = [
    validate({
        validator: 'isDate',
        message: '字符串不是合法的日期'
    })
];

var GpsdpSchema = new Schema({
    dvid: Number,
    ssid: Number,
    timestamp: { type: Date, validate: strLenValidator, unique: true },
    value: {
        lat: { type: Number, min: -90, max: 90 },
        lng: { type: Number, min: -180, max: 180 },
        speed: { type: Number, min: 0, max: 1024 },
        offset: { type: String , enum: ['yes', 'no'] }
    }
});

GpsdpSchema.pre('save', function (next) {
    if (!this.timestamp) {
        var now = new Date();
        now.setHours(now.getHours() + 8);
        now.setMilliseconds(0);
        this.timestamp = now;
    }
    next();
});

module.exports = mongoose.model('Gpsdp', GpsdpSchema);