var express = require('express');
var wechat = require('wechat');
var WechatAPI = require('wechat-api');
var rootconfig = require('./config.js');
var config = require('./wechat_config.js');

var wc = express();
if (rootconfig.wechatServer) {
    if (rootconfig.wechatMenuUpdate) {
        var api = new WechatAPI(config.appid, config.appsecret);
        api.getAccessToken(function (err, token) {
            if (err !== null) {
                console.log("getAccessToken error msg:" + err);
            }
        });
        var menu = JSON.stringify(require('./menu.json'));
        api.createMenu(menu, function (err, result) {
            if (result.errcode === 0 & result.errmsg === 'ok') {
                console.log("update wechat menu ok");
            } else {
                console.log("update wechat menu " + result.errmsg);
            }
        });
    }

    wc.use(express.query());
    wc.use('/wechat', wechat(config, function (req, res, next) {
        // 微信输入信息都在req.weixin上
        var message = req.weixin;
        if (message.FromUserName === 'oIYpBwq3giUAImcvVokNCpT7isUQ') {
            // 回复屌丝(普通回复)
            res.reply('hehe');
        } else if (message.FromUserName === 'text') {
            //你也可以这样回复text类型的信息
            res.reply({
                content: 'text object',
                type: 'text'
            });
        } else if (message.FromUserName === 'hehe') {
            // 回复一段音乐
            res.reply({
                type: "music",
                content: {
                    title: "来段音乐吧",
                    description: "一无所有",
                    musicUrl: "http://mp3.com/xx.mp3",
                    hqMusicUrl: "http://mp3.com/xx.mp3",
                    thumbMediaId: "thisThumbMediaId"
                }
            });
        } else {
            // 回复高富帅(图文回复)
            res.reply([
                {
                    title: '你来我家接我吧',
                    description: '这是女神与高富帅之间的对话',
                    picurl: 'http://nodeapi.cloudfoundry.com/qrcode.jpg',
                    url: 'http://nodeapi.cloudfoundry.com/'
                }
            ]);
        }
    }));
}
module.exports = wc;