var mongoose = require('mongoose');
var validate = require('mongoose-validator');
var autoIncrement = require('mongoose-auto-increment');
var Schema = mongoose.Schema;

var strLenValidator = [
    validate({
        validator: 'isLength',
        arguments: [2, 64],
        message: '字符串长度域是 2 - 64。'
    })
];

var DeviceSchema = new Schema({
    id: Number,
    ukey: { type: String },
    title: { type: String, required: true, validate: strLenValidator },
    about: { type: String, required: true , validate: strLenValidator},
    tags: { type: [String], required: true },
    location: {
        local: { type: String, required: true , validate: strLenValidator},
        latitude: { type: Number, min: -90, max: 90 },
        longitude: { type: Number, min: -180, max: 180 }
    }
});

DeviceSchema.plugin(autoIncrement.plugin, { model: 'Device', field: 'id', startAt: 1, incrementBy: 1 });

module.exports = mongoose.model('Device', DeviceSchema);