var mongoose = require('mongoose');
var validate = require('mongoose-validator');
var Schema = mongoose.Schema;

var keyLenValidator = [
    validate({
        validator: 'isLength',
        arguments: [1, 128],
        message: '字符串长度域是 1 - 128。'
    })
];

var keyValValidator = [
    validate({
        validator: 'isLength',
        arguments: [1, 1024],
        message: '字符串长度域是 1 - 1024。'
    })
];

var GendpSchema = new Schema({
    dvid: Number,
    ssid: Number,
    key: { type: String, validate: keyLenValidator, unique: true, required: true },
    value: { type: Schema.Types.Mixed, validate: keyValValidator },
});

//GendpSchema.pre('save', function (next) {
//    mongoose.models["Gendp"].findOne({ key: this.key }, function (inerr, dp) {
//        if (dp !== null) {
//            var err = new Error();
//            err.status = '7001';
//            err.message = "Key is exted..."
//            next(err);
//        } else {
//           next();
//        }
//    });
//});

module.exports = mongoose.model('Gendp', GendpSchema);