module.exports = {
    //mongo : 'mongodb://localhost:27017/coolpy',//使用mongodb数据库
    mongo : 'tingodb://' + __dirname + '/data',//使用本地数据库
    cross : false,//是否接受跨域访问
    production : true,
    v : '2.0.2',
    maxImageSize: '300kb',//系统默认最大允许上传单张图片大小限制为少于或等于300KB
    mqttServer: true,//MQTT服务是否开启,默认开启
    httpPort: 1337,//HTTP服务端口，默认1337
    httpsPort: 443,//HTTPS服务端口，默认443
    wechatServer: true,//微信功能关开，开启微信功能后默认的微信功能URL为（根地址+/wechat）如：http://icoolpy.com/wechat
    wechatPort: 80,//微信功能端口，默认80，微信目前只支持80端口，路由器运行酷痞由于80端口已被路由器占用所以不能使用此功能
    httpsPwd: '13750113781Jac',//HTTPS证书pfx文件的证书密码
    mqttPort: 1338,//MQTT服务端口，默认1338
    openLimit: true,//访问速速限制器开关/默认关闭,开启请设置为 true
    limitr: {//配置访问速度限制，默认是每秒1次请求
        limit: 50, //请求数量，接速率允许的请求数量
        rate: 1,//速率，单位/秒
        clientId: 'ip', //default
        //白名单，在此名单内的不会有任任请求限制/必须设置添加你最终的客户端域名，否则客户端没法正常工作。
        ignore: ['127.0.0.1', '192.168.1.1', 'i.icoolpy.com'], 
        //错误返来提示消息内容,返回错误码是429, 如果服务端取不到客户IP会直接返来错误码430
        message: 'Api access rate exted!!'
    }
};