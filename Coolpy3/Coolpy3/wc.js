var express = require('express');
var wechat = require('wechat');
var WechatAPI = require('wechat-api');
var rootconfig = require('./config.js');
var config = require('./wechat_config.js');

var DeviceModel = require('./app/models/device.js');
var SensorModel = require('./app/models/sensor.js');
var ValuedpModel = require('./app/models/valuedp.js');
var GpsdpModel = require('./app/models/gpsdp.js');
var GendpModel = require('./app/models/gendp.js');
var SwsdpModel = require('./app/models/swsdp.js');
var ImgdpModel = require('./app/models/imgdp.js');
var GencontrolModel = require('./app/models/gencontroldp.js');
var RangecontrolModel = require('./app/models/rangecontroldp.js');
var UserModel = require('./app/models/admin.js');

function delalldvs(key) {
    DeviceModel.find({ ukey: key }, function (err, docs) {
        docs.forEach(function (item) {
            delallss(item.id);
        })
    });
    DeviceModel.remove({ ukey: key }, true);
}

function delallss(did) {
    SensorModel.find({ hubid: did }, function (err, docs) {
        docs.forEach(function (item) {
            delalldps(item.hubid, item.id);
        })
    });
    SensorModel.remove({ hubid: did }, true);
}

function delalldps(dvid, ssid) {
    delallvaldps(dvid, ssid);
    delallgendps(dvid, ssid);
    delallgpsdps(dvid, ssid);
    delallswsdps(dvid, ssid);
    delallgencontroldps(dvid, ssid);
    delallrangecontroldps(dvid, ssid);
}

function delallvaldps(dvid, ssid) {
    ValuedpModel.remove({ hubid: dvid, nodeid: ssid }, true);
}

function delallgendps(dvid, ssid) {
    GendpModel.remove({ hubid: dvid, nodeid: ssid }, true);
}

function delallgpsdps(dvid, ssid) {
    GpsdpModel.remove({ hubid: dvid, nodeid: ssid }, true);
}

function delallswsdps(dvid, ssid) {
    SwsdpModel.remove({ hubid: dvid, nodeid: ssid }, true);
}

function delallgencontroldps(dvid, ssid) {
    GencontrolModel.remove({ hubid: dvid, nodeid: ssid }, true);
}

function delallrangecontroldps(dvid, ssid) {
    RangecontrolModel.remove({ hubid: dvid, nodeid: ssid }, true);
}

var wc = express();
if (rootconfig.wechatServer) {
    wc.use(express.query());
    wc.use('/wechat', wechat(config, function (req, res, next) {
        var message = req.weixin;
        if (message.MsgType === 'event') {
            if (message.Event === 'subscribe') {
                UserModel.findOne({ userId: message.FromUserName }, function (err, u) {
                    if (err) {
                        console.log('findWechatUserNameError');
                    } else {
                        if (u !== null) {
                            console.log('wechatUserNameExt:' + message.FromUserName);
                        } else {
                            var user = new UserModel();
                            user.userId = message.FromUserName;
                            user.pwd = message.FromUserName;
                            user.userName = "WechatUser";
                            user.email = "WechatUser";
                            user.qq = "WechatUser";
                            user.save();
                            res.reply([
                                {
                                    title: '恭喜你已经成功注册到酷痞物联网平台！',
                                    description: '现在你即可以体验你专属的物联网中心了！',
                                    picurl: 'http://icoolpy.com/iot.jpeg',
                                    url: ''
                                }, 
                                {
                                    title: '恭喜你已经成功注册到酷痞物联网平台！',
                                    description: '现在你即可以体验你专属的物联网中心了！',
                                    picurl: 'http://icoolpy.com/iot.jpeg',
                                    url: ''
                                }
                            ]);
                        }
                    }
                });
            } else if (message.Event === 'unsubscribe') {
                UserModel.findOneAndRemove({ userId: message.FromUserName }, function (err, u) {
                    if (err) {
                        console.log('findWechatUserNameError');
                    } else {
                        if (u !== null) {
                            delalldvs(u.ukey);
                        } else {
                            console.log('wechatUserNameNotExt:' + message.FromUserName);
                        }
                    }
                });
            } else if (message.Event === 'CLICK') {
                if (message.EventKey === "V1_LIST_UKEY") {
                    UserModel.findOne({ userId: message.FromUserName }, function (err, u) {
                        if (err) {
                            console.log('findWechatUserNameError');
                        } else {
                            if (u !== null) {
                                res.reply({
                                    content: u.ukey,
                                    type: 'text'
                                });
                            } else {
                                res.reply('你还没有注册到本平台！');
                            }
                        }
                    });
                } else if (message.EventKey === "V3_QS") {
                    res.reply([
                        {
                            title: '快速指南，进入酷痞快速指南吧！',
                            description: '此功能将告诉你酷痞的基础用法和概念喔。',
                            picurl: 'http://icoolpy.com/iot.jpeg',
                            url: rootconfig.rootUrl + '/index.html?wcid='+ message.FromUserName +'&nav=nav_page'
                        }
                    ]);
                } else if (message.EventKey === "V2_ADD_DV") {
                    res.reply([
                        {
                            title: '添加设备，马上就可以添加设备了！',
                            description: '此功能将让你增加一个Hub设备喔。',
                            picurl: 'http://icoolpy.com/iot.jpeg',
                            url: rootconfig.rootUrl + '/index.html?wcid=' + message.FromUserName + '&nav=dvadd_page'
                        }
                    ]);
                } else if (message.EventKey === "V2_LIST_DV") {
                    res.reply([
                        {
                            title: '管理设备，马上就可以管理设备了！',
                            description: '此功能将让你罗列属于你的Hub设备喔。',
                            picurl: 'http://icoolpy.com/iot.jpeg',
                            url: rootconfig.rootUrl + '/index.html?wcid=' + message.FromUserName + '&nav=dvs_page'
                        }
                    ]);
                } else if (message.EventKey === "V1_LIST_DVS") {
                    res.reply([
                        {
                            title: '我的设备，马上进入设备控制中心！',
                            description: '此功能将让你操作控制器及查看传感器数据记录喔。',
                            picurl: 'http://icoolpy.com/iot.jpeg',
                            url: rootconfig.rootUrl + '/index.html?wcid=' + message.FromUserName + '&nav=center_page'
                        }
                    ]);
                } else {
                    res.reply({
                        content: 'Sorry!!我还没有此功能！',
                        type: 'text'
                    });
                }
            } else {
                res.reply({
                    content: 'Sorry!!我还没有此功能！',
                    type: 'text'
                });
            }
        } else {
            res.reply({
                content: 'Sorry!!我还没有此功能！',
                type: 'text'
            });
        }
    }));
}
module.exports = wc;