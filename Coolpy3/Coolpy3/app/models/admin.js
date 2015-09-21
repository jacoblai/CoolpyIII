var uuid = require('node-uuid');
var mongoose = require('mongoose');
var validate = require('mongoose-validator');
var Schema = mongoose.Schema;

var strLenValidator = [
    validate({
        validator: 'isLength',
        arguments: [2, 64],
        message: '字符串长度域是 2 - 64。'
    })
];

var AdminSchema = new Schema({
    ukey: { type: String, unique: true },
    userId: { type: String, required: true, validate: strLenValidator, unique: true },
    pwd: { type: String, required: true , validate: strLenValidator },
    userName: { type: String, required: true , validate: strLenValidator },
    email: { type: String, required: true , validate: strLenValidator },
    qq: { type: String, required: true , validate: strLenValidator }
});

AdminSchema.pre('save', function (next) {
    this.ukey = uuid.v4();
    next();
});

module.exports = mongoose.model('Admin', AdminSchema);