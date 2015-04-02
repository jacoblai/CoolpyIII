var mongoose = require('mongoose');
var validate = require('mongoose-validator');
var Schema = mongoose.Schema;

var strLenValidator = [
    validate({
        validator: 'isDate',
        message: '字符串不是合法的日期'
    })
];

var keyValValidator = [
    validate({
        validator: 'isLength',
        arguments: [1, 128],
        message: '字符串长度域是 1 - 1024。'
    })
];

var ImgdpSchema = new Schema({
    dvid: Number,
    ssid: Number,
    timestamp: { type: Date, validate: strLenValidator, unique: true },
    value: { type: Schema.Types.Mixed, validate: keyValValidator },
    img: { type: Buffer, required: true}
});

ImgdpSchema.pre('save', function (next) {
    if (!this.timestamp) {
        var now = new Date();
        now.setHours(now.getHours() + 8);
        now.setMilliseconds(0);
        this.timestamp = now;
    }
    next();
});

module.exports = mongoose.model('Imgdp', ImgdpSchema);