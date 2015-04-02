var mongoose = require('mongoose');
var validate = require('mongoose-validator');
var Schema = mongoose.Schema;

var strLenValidator = [
    validate({
        validator: 'isLength',
        arguments: [1, 1024],
        message: '字符串长度域是 1 - 1024。'
    })
];

var gencontroldpSchema = new Schema({
    dvid: Number,
    ssid: Number,
    value: { type: String, required: true, validate: strLenValidator }
});

module.exports = mongoose.model('gencontroldp', gencontroldpSchema);