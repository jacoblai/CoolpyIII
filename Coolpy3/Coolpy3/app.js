var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var validator = require('validator');
var imageinfo = require('./app/func/imageInfo.js');
var config = require('./config.js');
String.prototype.startWith = function (str) {
    var reg = new RegExp("^" + str);
    return reg.test(this);
}
if (config.mongo.toString().startWith('tingodb')) {
    var tungus = require('tungus');
}
if (config.openLimit) {
    var limitr = require('limitr');
}
var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');


mongoose.connect(config.mongo); // connect to our database
var db = mongoose.connection;
autoIncrement.initialize(db);
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {
    // yay!
    console.log("database open ok!!");
});

//var routes = require('./routes/index');
//var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

if (config.openLimit) {
    app.use(limitr(config.limitr));
};

function defaultContentTypeMiddleware(req, res, next) {
    req.headers['content-type'] = req.headers['content-type'] || 'application/json';
    next();
}
app.use(defaultContentTypeMiddleware);

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.raw({ type: 'application/octet-stream', limit: config.maxImageSize }));
app.use(cookieParser());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', routes);
//app.use('/users', users);
if (config.cross) {
    app.all('*', function (req, res, next) {
        if (!req.get('Origin')) return next();
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        res.set('Access-Control-Allow-Headers', 'U-ApiKey, Content-Type');
        // res.set('Access-Control-Allow-Max-Age', 3600);
        if ('OPTIONS' == req.method) return res.status(200).end();
        next();
    });
}

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

//系统启动时没有admin账号会自动建一个
UserModel.findOne({ userId: "admin" }, function (err, u) {
    if (u === null) {
        var admin = new UserModel();
        admin.userId = "admin";
        admin.pwd = "admin";
        admin.userName = "admin";
        admin.email = "admin";
        admin.qq = "admin";
        admin.save();
    }
})

function takeup(req, res, next) {
    var userId = req.query.username;
    var pwd = req.query.pass;
    if (validator.isLength(userId, 2, 64) && validator.isLength(pwd, 2, 64)) {
        req.uid = userId;
        req.pwd = pwd;
        next();
    } else {
        res.status(417);
        res.end();
    }
}

function isAdmin(req, res, next) {
    UserModel.findOne({ userId: "admin" }, function (err, ad) {
        if (err) {
            if (!config.production) {
                res.send(err);
            } else {
                res.status(404);
                res.end();
            }
        } else {
            if (ad !== null && ad.pwd === req.pwd) {
                next();
            } else {
                res.json({ Error: 'passport error for admin' });
            }
        }
    });
}

function isLogin(req, res, next) {
    UserModel.findOne({ userId: req.uid, pwd: req.pwd }, function (err, ad) {
        if (err) {
            if (!config.production) {
                res.send(err);
            } else {
                res.status(404);
                res.end();
            }
        } else {
            if (ad !== null) {
                req.userinfo = ad;
                next();
            } else {
                res.status(412);
                res.end();
            }
        }
    });
}

function isAuthenticated(req, res, next) {
    // 验证
    var ukey = req.get('U-ApiKey');
    UserModel.findOne({ ukey: ukey }, function (err, u) {
        if (u !== null) {
            req.ukey = ukey;
            next();
        } else {
            res.status(412);
            res.end();
        }
    });
}

function isDvsInUkey(req, res, next) {
    // 验证
    var ukey = req.get('U-ApiKey');
    DeviceModel.findOne({ ukey: req.ukey, id: req.params.dvid }, function (err, u) {
        if (u !== null) {
            req.ukey = ukey;
            next();
        } else {
            res.json({ Error: 'DeviceNotInApiKey' });
        }
    });
}

function isSssInDvs(req, res, next) {
    SensorModel.findOne({ dvid: req.params.dvid, id: req.params.ssid }, function (err, u) {
        if (u !== null) {
            next();
        } else {
            res.json({ Error: 'SensorNotInDevice' });
        }
    });
}

function getSensorType(req, res, next) {
    SensorModel.findOne({ id: req.params.ssid, dvid: req.params.dvid }, function (err, ss) {
        if (err) {
            res.send(err);
        } else {
            if (ss !== null) {
                req.type = ss.type;
                next();
            } else {
                res.status(404);
                res.end();
            }
        }
    });
}

function delalldvs(key) {
    DeviceModel.find({ ukey: key }, function (err, docs) {
        docs.forEach(function (item) {
            delallss(item.id);
        })
    });
    DeviceModel.remove({ ukey: key }, true);
}

function delallss(did) {
    SensorModel.find({ dvid: did }, function (err, docs) {
        docs.forEach(function (item) {
            delalldps(item.dvid, item.id);
        })
    });
    SensorModel.remove({ dvid: did }, true);
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
    ValuedpModel.remove({ dvid: dvid, ssid: ssid }, true);
}

function delallgendps(dvid, ssid) {
    GendpModel.remove({ dvid: dvid, ssid: ssid }, true);
}

function delallgpsdps(dvid, ssid) {
    GpsdpModel.remove({ dvid: dvid, ssid: ssid }, true);
}

function delallswsdps(dvid, ssid) {
    SwsdpModel.remove({ dvid: dvid, ssid: ssid }, true);
}

function delallgencontroldps(dvid, ssid) {
    GencontrolModel.remove({ dvid: dvid, ssid: ssid }, true);
}

function delallrangecontroldps(dvid, ssid) {
    RangecontrolModel.remove({ dvid: dvid, ssid: ssid }, true);
}

// get an instance of router
var router = express.Router();

// a convenient variable to refer to the HTML directory
//var html_dir = './public/';
// home page route (http://localhost:8080)
//router.get('/', function (req, res) {
//    //res.sendfile(html_dir + 'index.html');
//    res.send('im the home page!');
//    //res.json({ message: 'hooray! welcome to our api!' });
//});

// apply the routes to our application
//app.use('/', router);
//#endregion

//账号管理api
router.route('/user')
    //Content-Type 必须为application/json
	.post(takeup, isAdmin, function (req, res) {
    var user = new UserModel(req.body);
    if (user.userId !== "admin") {
        user.save(function (err, ndv) {
            if (err) {
                if (!config.production) {
                    res.send(err);
                } else {
                    res.status(404);
                    res.end();
                }
            } else {
                res.end("");
            }
        });
    } else {
        res.json({ Error: 'userid dont use admin' });
    }
})

    	// 提取自己的资料
	.get(takeup, isLogin, function (req, res) {
    var obj = req.userinfo.toObject();
    delete obj._id;
    delete obj.__v;
    delete obj.pwd;
    res.json(obj);
})

    .put(takeup, isLogin, function (req, res) {
    //禁止修改传感器类型
    delete req.body.userId;
    delete req.body.ukey;
    UserModel.findOneAndUpdate({ userId: req.uid }, req.body, function (err, dv) {
        if (err) {
            if (!config.production) {
                res.send(err);
            } else {
                res.status(404);
                res.end();
            }
        } else {
            res.end("");
        }
    });
})

    .delete(takeup, isLogin, isAdmin, function (req, res) {
    if (req.query.duid !== "admin") {
        if (config.mongo.toString().startWith('tingodb')) {
            UserModel.findOne({ userId: unescape(req.query.duid) }, function (err, u) {
                if (err) {
                    if (!config.production) {
                        res.send(err);
                    } else {
                        res.status(404);
                        res.end();
                    }
                } else {
                    if (u !== null) {
                        delalldvs(u.ukey);
                        u.remove();
                        res.end();
                    } else {
                        res.json({ Error: "no user" });
                    }
                }
            });
        } else {
            UserModel.findOneAndRemove({ userId: unescape(req.query.duid) }, function (err, u) {
                if (err) {
                    if (!config.production) {
                        res.send(err);
                    } else {
                        res.status(404);
                        res.end();
                    }
                } else {
                    if (u !== null) {
                        delalldvs(u.ukey);
                        res.end();
                    } else {
                        res.json({ Error: "no user" });
                    }
                }
            });
        }
    }
});

//账号管理api
router.route('/user/all')
.get(takeup, isLogin, function (req, res) {
    if (req.uid === "admin") {
        UserModel.find(function (err, users) {
            if (err) {
                if (!config.production) {
                    res.send(err);
                } else {
                    res.status(404);
                    res.end();
                }
            } else {
                var rs_us = [];
                users.forEach(function (u) {
                    if (u.userId !== "admin") {
                        var obj = u.toObject();
                        delete obj._id;
                        delete obj.__v;
                        rs_us.push(obj);
                    }
                });
                res.json(rs_us);
            }
        });
    }
});

//账号管理api
router.route('/user/apikey')
.get(function (req, res) {
    UserModel.findOne({ userId: req.query.username, pwd: req.query.pass }, function (err, ad) {
        if (err) {
            if (!config.production) {
                res.send(err);
            } else {
                var obj = new Object();
                obj.errcode = "2";
                obj.errmsg = "unknow error";
                obj.apikey = "";
                res.json(obj);
            }
        } else {
            if (ad !== null) {
                req.userinfo = ad;
                var obj = new Object();
                obj.errcode = "0";
                obj.errmsg = "pass";
                obj.apikey = req.userinfo.ukey;
                res.json(obj);
            } else {
                var obj = new Object();
                obj.errcode = "1";
                obj.errmsg = "account not ext";
                obj.apikey = "";
                res.json(obj);
            }
        }
    });
});

//账号管理api
router.route('/user/newkey')
.get(takeup, isLogin, function (req, res) {
    UserModel.findOne({ userId: req.uid }, function (err, u) {
        if (err) {
            if (!config.production) {
                res.send(err);
            } else {
                res.status(404);
                res.end();
            }
        } else {
            delalldvs(u.ukey);
            u.save(function (er, sv) {
                if (er) {
                    res.send(er);
                } else {
                    res.json({ nk: sv.ukey });
                }
            })
        }
    })
});


//设备管理api
router.route('/devices')
    //Content-Type 必须为application/json
	.post(isAuthenticated, function (req, res) {
    var device = new DeviceModel(req.body);
    device.ukey = req.ukey;
    device.save(function (err, ndv) {
        if (err) {
            if (!config.production) {
                res.send(err);
            } else {
                res.status(404);
                res.end();
            }
        } else {
            res.json({ device_id: ndv.id });
        }
    })
})

    	// get all the bears (accessed at GET)
	.get(isAuthenticated, function (req, res) {
    DeviceModel.find({ ukey: req.ukey }, function (err, devices) {
        if (err) {
            if (!config.production) {
                res.send(err);
            } else {
                res.status(404);
                res.end();
            }
        } else {
            var rs_dvs = [];
            devices.forEach(function (dv) {
                var obj = dv.toObject();
                delete obj._id;
                delete obj.__v;
                delete obj.ukey;
                rs_dvs.push(obj);
            });
            res.json(rs_dvs);
        }
    });
});

////模拟put在post请求中
router.route('/device/:dvid')
    .post(isAuthenticated, isDvsInUkey, function (req, res) {
    if (req.query.method === "put") {
        putdevice(req, res);
    } else { res.json({ Error: 'Only by querystring access' }); }
})

	// get the bear with that id (accessed at GET http://localhost:8080/v1.0/device/:dvid)
	.get(isAuthenticated, isDvsInUkey, function (req, res) {
    if (req.query.method === "delete") {
        deldevice(req, res);
    } else {
        DeviceModel.findOne({ id: req.params.dvid, ukey: req.ukey }, function (err, dv) {
            if (err) {
                if (!config.production) {
                    res.send(err);
                } else {
                    res.status(404);
                    res.end();
                }
            } else {
                if (dv !== null) {
                    var obj = dv.toObject();
                    delete obj._id;
                    delete obj.__v;
                    delete obj.ukey;
                    res.json(obj);
                } else { res.end(); }
            }
        });
    }
})

    //Content-Type 必须为application/json
	.put(isAuthenticated, isDvsInUkey, function (req, res) {
    putdevice(req, res);
})

	.delete(isAuthenticated, isDvsInUkey, function (req, res) {
    deldevice(req, res);
});

function deldevice(req, res) {
    if (config.mongo.toString().startWith('tingodb')) {
        DeviceModel.remove({ id: req.params.dvid, ukey: req.ukey }, true);
        delallss(req.params.dvid);
        res.end();
    } else {
        DeviceModel.findOneAndRemove({ id: req.params.dvid, ukey: req.ukey }, function (err, dv) {
            if (err) {
                if (!config.production) {
                    res.send(err);
                } else {
                    res.status(404);
                    res.end();
                }
            } else {
                delallss(req.params.dvid);
                res.end();
            }
        });
    }
}

function putdevice(req, res) {
    //禁止修改传感器类型
    delete req.body.ukey;
    if (config.mongo.toString().startWith('tingodb')) {
        DeviceModel.findOne({ id: req.params.dvid, ukey: req.ukey }, function (err, dv) {
            dv.title = req.body.title;
            dv.about = req.body.about;
            dv.tags = req.body.tags;
            dv.location = req.body.location;
            dv.save(function (err) {
                if (err) {
                    if (!config.production) {
                        res.send(err);
                    } else {
                        res.status(404);
                        res.end();
                    }
                } else {
                    res.end();
                }
            });
        });
    } else {
        DeviceModel.findOneAndUpdate({ id: req.params.dvid, ukey: req.ukey }, req.body, function (err, dv) {
            if (err) {
                if (!config.production) {
                    res.send(err);
                } else {
                    res.status(404);
                    res.end();
                }
            } else {
                res.end();
            }
        });
    }
}

//传感器管理api
router.route('/device/:dvid/sensors')
    //Content-Type 必须为application/json
	.post(isAuthenticated, isDvsInUkey, function (req, res) {
    var sensor = new SensorModel(req.body);
    sensor.dvid = req.params.dvid;
    sensor.save(function (err, nss) {
        if (err) {
            if (!config.production) {
                res.send(err);
            } else {
                res.status(404);
                res.end();
            }
        } else if (sensor.type === "switcher") {
            var sw = new SwsdpModel();
            sw.dvid = req.params.dvid;
            sw.ssid = nss.id;
            sw.value = 0;
            sw.save();
            res.json({ sensor_id: nss.id });
        } else if (sensor.type === "gencontrol") {
            var genc = new GencontrolModel();
            genc.dvid = req.params.dvid;
            genc.ssid = nss.id;
            genc.value = 'null';
            genc.save();
            res.json({ sensor_id: nss.id });
        } else if (sensor.type === "rangecontrol") {
            var ranc = new RangecontrolModel();
            ranc.dvid = req.params.dvid;
            ranc.ssid = nss.id;
            ranc.value = 0;
            ranc.save();
            res.json({ sensor_id: nss.id });
        } else {
            res.json({ sensor_id: nss.id });
        }
    });
})

    	// get all the bears (accessed at GET)
	.get(isAuthenticated, isDvsInUkey, function (req, res) {
    SensorModel.find({ dvid: req.params.dvid }, function (err, sensors) {
        if (err) {
            if (!config.production) {
                res.send(err);
            } else {
                res.status(404);
                res.end();
            }
        } else {
            var rs_sss = [];
            sensors.forEach(function (ss) {
                var obj = ss.toObject();
                delete obj._id;
                delete obj.__v;
                rs_sss.push(obj);
            });
            res.json(rs_sss);
        }
    });
});

router.route('/device/:dvid/sensor/:ssid')
    .post(isAuthenticated, isDvsInUkey, isSssInDvs, function (req, res) {
    if (req.query.method === "put") {
        putsensor(req, res);
    } else { res.json({ Error: 'Only by querystring access' }); }
})

	// get the bear with that id (accessed at GET http://localhost:8080/v1.0/device/:dvid)
	.get(isAuthenticated, isDvsInUkey, isSssInDvs, function (req, res) {
    if (req.query.method === "delete") {
        delsensor(req, res);
    } else {
        SensorModel.findOne({ id: req.params.ssid, dvid: req.params.dvid }, function (err, ss) {
            if (err) {
                if (!config.production) {
                    res.send(err);
                } else {
                    res.status(404);
                    res.end();
                }
            } else {
                if (ss !== null) {
                    var obj = ss.toObject();
                    delete obj._id;
                    delete obj.__v;
                    delete obj.dvid;
                    res.json(obj);
                } else { res.end(); }
            }
        });
    }
})

    //Content-Type 必须为application/json
	.put(isAuthenticated, isDvsInUkey, isSssInDvs, function (req, res) {
    putsensor(req, res);
})

	.delete(isAuthenticated, isDvsInUkey, isSssInDvs, getSensorType, function (req, res) {
    delsensor(req, res);
});

function delsensor(req, res) {
    if (config.mongo.toString().startWith('tingodb')) {
        SensorModel.remove({ id: req.params.ssid, dvid: req.params.dvid }, true);
        delalldps(req.params.dvid, req.params.ssid);
        res.end();
    } else {
        SensorModel.findOneAndRemove({ id: req.params.ssid, dvid: req.params.dvid }, function (err, ss) {
            if (err) {
                if (!config.production) {
                    res.send(err);
                } else {
                    res.status(404);
                    res.end();
                }
            } else {
                delalldps(req.params.dvid, req.params.ssid);
                res.end("");
            }
        });
    }
}

function putsensor(req, res) {
    //禁止修改传感器类型
    delete req.body.type;
    SensorModel.findOneAndUpdate({ id: req.params.ssid, dvid: req.params.dvid }, req.body, function (err, ss) {
        if (err) {
            if (!config.production) {
                res.send(err);
            } else {
                res.status(404);
                res.end();
            }
        } else {
            res.end();
        }
    });
}

router.route('/device/:dvid/sensor/:ssid/photos')
  .post(isAuthenticated, isDvsInUkey, isSssInDvs, getSensorType, function (req, res) {
    if (req.type === "photo") {
        info = imageinfo(req.body);
        if (info.mimeType !== undefined) {
            var imgdp = new ImgdpModel();
            imgdp.dvid = req.params.dvid;
            imgdp.ssid = req.params.ssid;
            imgdp.img = req.body;
            imgdp.value = { type: info.mimeType, size: req.body.length, width: info.width, height: info.height };
            imgdp.save(function (err, imgs) {
                if (err) {
                    if (!config.production) {
                        res.send(err);
                    } else {
                        res.status(404);
                        res.end();
                    }
                } else {
                    res.end();
                }
            });
        } else {
            res.status(415);
            res.end();
        }
    } else {
        res.status(404);
        res.end();
    }
});

router.route('/device/:dvid/sensor/:ssid/photo/info')
	.get(isAuthenticated, isDvsInUkey, isSssInDvs, getSensorType, function (req, res) {
    if (req.type === "photo") {
        ImgdpModel.findOne({ dvid: req.params.dvid, ssid: req.params.ssid }).sort({ timestamp: -1 }).limit(1).exec(function (err, dp) {
            if (err) {
                if (!config.production) {
                    res.send(err);
                } else {
                    res.status(404);
                    res.end();
                }
            } else {
                if (dp !== null) {
                    var obj = dp.toObject();
                    delete obj._id;
                    delete obj.__v;
                    delete obj.img;
                    //delete obj.dvid;
                    //delete obj.ssid;
                    obj.timestamp = obj.timestamp.toISOString().replace(/\..+/, '');
                    res.json(obj);
                } else {
                    res.end();
                }
            }
        });
    } else {
        res.status(404);
        res.end();
    }
});

router.route('/device/:dvid/sensor/:ssid/photo/info/:key')
	.get(isAuthenticated, isDvsInUkey, isSssInDvs, getSensorType, function (req, res) {
    if (req.type === "photo") {
        ImgdpModel.findOne({ dvid: req.params.dvid, ssid: req.params.ssid, timestamp: req.params.key }, function (err, dp) {
            if (err) {
                if (!config.production) {
                    res.send(err);
                } else {
                    res.status(404);
                    res.end();
                }
            } else {
                if (dp !== null) {
                    var obj = dp.toObject();
                    delete obj._id;
                    delete obj.__v;
                    delete obj.img;
                    delete obj.dvid;
                    delete obj.ssid;
                    delete obj.timestamp;
                    //obj.timestamp = obj.timestamp.toISOString().replace(/\..+/, '');
                    res.json(obj);
                } else {
                    res.end();
                }
            }
        });
    } else {
        res.status(404);
        res.end();
    }
});

router.route('/device/:dvid/sensor/:ssid/photo/content')
	.get(isAuthenticated, isDvsInUkey, isSssInDvs, getSensorType, function (req, res) {
    if (req.type === "photo") {
        ImgdpModel.findOne({ dvid: req.params.dvid, ssid: req.params.ssid }).sort({ timestamp: -1 }).limit(1).exec(function (err, dp) {
            if (err) {
                if (!config.production) {
                    res.send(err);
                } else {
                    res.status(404);
                    res.end();
                }
            } else {
                if (dp !== null) {
                    var obj = dp.toObject();
                    res.writeHead(200, {
                        'Content-Type': 'application/octet-stream'
                    });
                    res.end(obj.img.toString());
                } else {
                    res.end();
                }
            }
        });
    } else {
        res.status(404);
        res.end();
    }
});

router.route('/device/:dvid/sensor/:ssid/photo/content/:key')
	.get(isAuthenticated, isDvsInUkey, isSssInDvs, getSensorType, function (req, res) {
    if (req.type === "photo") {
        ImgdpModel.findOne({ dvid: req.params.dvid, ssid: req.params.ssid, timestamp: req.params.key }, function (err, dp) {
            if (err) {
                if (!config.production) {
                    res.send(err);
                } else {
                    res.status(404);
                    res.end();
                }
            } else {
                if (dp !== null) {
                    var obj = dp.toObject();
                    res.writeHead(200, {
                        'Content-Type': 'application/octet-stream'
                    });
                    res.end(obj.img.toString());
                } else {
                    res.end();
                }
            }
        });
    } else {
        res.status(404);
        res.end();
    }
});

//数据结点管理api
router.route('/device/:dvid/sensor/:ssid/datapoints')
    //Content-Type 必须为application/json
	.post(isAuthenticated, isDvsInUkey, isSssInDvs, getSensorType, function (req, res) {
    if (req.type === "value") {
        if (Array.isArray(req.body)) {
            var dps = [];
            req.body.forEach(function (dp) {
                dp.dvid = req.params.dvid;
                dp.ssid = req.params.ssid;
                dps.push(dp);
            });
            ValuedpModel.create(dps, function (err, jellybean, snickers) {
                if (err) {
                    if (!config.production) {
                        res.send(err);
                    } else {
                        res.status(404);
                        res.end();
                    }
                } else {
                    res.end();
                }
            });
        } else {
            var valuedp = new ValuedpModel(req.body); 		//实例化from json
            valuedp.dvid = req.params.dvid;
            valuedp.ssid = req.params.ssid;
            valuedp.save(function (err, vdps) {
                if (err) {
                    if (!config.production) {
                        res.send(err);
                    } else {
                        res.status(404);
                        res.end();
                    }
                } else {
                    res.end();
                }
            });
        }
    } else if (req.type === "gps") {
        if (Array.isArray(req.body)) {
            var dps = [];
            req.body.forEach(function (dp) {
                dp.dvid = req.params.dvid;
                dp.ssid = req.params.ssid;
                dps.push(dp);
            });
            GpsdpModel.create(dps, function (err, jellybean, snickers) {
                if (err) {
                    if (!config.production) {
                        res.send(err);
                    } else {
                        res.status(404);
                        res.end();
                    }
                } else {
                    res.end();
                }
            });
        } else {
            var valuedp = new GpsdpModel(req.body); 		//实例化from json
            valuedp.dvid = req.params.dvid;
            valuedp.ssid = req.params.ssid;
            valuedp.save(function (err, vdps) {
                if (err) {
                    if (!config.production) {
                        res.send(err);
                    } else {
                        res.status(404);
                        res.end();
                    }
                } else {
                    res.end();
                }
            });
        }
    } else if (req.type === "gen") {
        if (Array.isArray(req.body)) {
            var dps = [];
            req.body.forEach(function (dp) {
                dp.dvid = req.params.dvid;
                dp.ssid = req.params.ssid;
                dps.push(dp);
            });
            GendpModel.create(dps, function (err, jellybean, snickers) {
                if (err) {
                    if (!config.production) {
                        res.send(err);
                    } else {
                        res.status(404);
                        res.end();
                    }
                } else {
                    res.end();
                }
            });
        } else {
            var valuedp = new GendpModel(req.body); 		//实例化from json
            valuedp.dvid = req.params.dvid;
            valuedp.ssid = req.params.ssid;
            valuedp.save(function (err, vdps) {
                if (err) {
                    if (!config.production) {
                        res.send(err);
                    } else {
                        res.status(404);
                        res.end();
                    }
                } else {
                    res.end();
                }
            });
        }
    } else {
        res.json({ Error: "no value" });
    }
});

router.route('/device/:dvid/sensor/:ssid/datapoint')
	.get(isAuthenticated, isDvsInUkey, isSssInDvs, getSensorType, function (req, res) {
    if (req.type === "value") {
        ValuedpModel.findOne({ dvid: req.params.dvid, ssid: req.params.ssid }).sort({ timestamp: -1 }).limit(1).exec(function (err, dp) {
            if (err) {
                if (!config.production) {
                    res.send(err);
                } else {
                    res.status(404);
                    res.end();
                }
            } else {
                if (dp !== null) {
                    var obj = dp.toObject();
                    delete obj._id;
                    delete obj.__v;
                    //delete obj.dvid;
                    //delete obj.ssid;
                    obj.timestamp = obj.timestamp.toISOString().replace(/\..+/, '');
                    res.json(obj);
                } else {
                    res.end();
                }
            }
        });
    } else if (req.type === "gps") {
        GpsdpModel.findOne({ dvid: req.params.dvid, ssid: req.params.ssid }).sort({ timestamp: -1 }).limit(1).exec(function (err, dp) {
            if (err) {
                if (!config.production) {
                    res.send(err);
                } else {
                    res.status(404);
                    res.end();
                }
            } else {
                if (dp !== null) {
                    var obj = dp.toObject();
                    delete obj._id;
                    delete obj.__v;
                    //delete obj.dvid;
                    //delete obj.ssid;
                    obj.timestamp = obj.timestamp.toISOString().replace(/\..+/, '');
                    res.json(obj);
                } else {
                    res.end();
                }
            }
        });
    } else if (req.type === "gen") {
        GendpModel.findOne({ dvid: req.params.dvid, ssid: req.params.ssid }).sort({ timestamp: -1 }).limit(1).exec(function (err, dp) {
            if (err) {
                if (!config.production) {
                    res.send(err);
                } else {
                    res.status(404);
                    res.end();
                }
            } else {
                if (dp !== null) {
                    var obj = dp.toObject();
                    delete obj._id;
                    delete obj.__v;
                    //delete obj.dvid;
                    //delete obj.ssid;
                    res.json(obj);
                } else {
                    res.end();
                }
            }
        });
    } else if (req.type === "switcher") {
        SwsdpModel.findOne({ dvid: req.params.dvid, ssid: req.params.ssid }).exec(function (err, dp) {
            if (err) {
                if (!config.production) {
                    res.send(err);
                } else {
                    res.status(404);
                    res.end();
                }
            } else {
                if (dp !== null) {
                    var obj = dp.toObject();
                    delete obj._id;
                    delete obj.__v;
                    //delete obj.dvid;
                    //delete obj.ssid;
                    res.json(obj);
                } else {
                    res.end();
                }
            }
        });
    } else if (req.type === "gencontrol") {
        GencontrolModel.findOne({ dvid: req.params.dvid, ssid: req.params.ssid }).exec(function (err, dp) {
            if (err) {
                if (!config.production) {
                    res.send(err);
                } else {
                    res.status(404);
                    res.end();
                }
            } else {
                if (dp !== null) {
                    var obj = dp.toObject();
                    delete obj._id;
                    delete obj.__v;
                    //delete obj.dvid;
                    //delete obj.ssid;
                    res.json(obj);
                } else {
                    res.end();
                }
            }
        });
    } else if (req.type === "rangecontrol") {
        RangecontrolModel.findOne({ dvid: req.params.dvid, ssid: req.params.ssid }).exec(function (err, dp) {
            if (err) {
                if (!config.production) {
                    res.send(err);
                } else {
                    res.status(404);
                    res.end();
                }
            } else {
                if (dp !== null) {
                    var obj = dp.toObject();
                    delete obj._id;
                    delete obj.__v;
                    //delete obj.dvid;
                    //delete obj.ssid;
                    res.json(obj);
                } else {
                    res.end();
                }
            }
        });
    } else {
        res.json({ Error: "no value" });
    }
})

    .put(isAuthenticated, isDvsInUkey, isSssInDvs, getSensorType, function (req, res) {
    if (req.type === "switcher") {
        SwsdpModel.findOneAndUpdate({ dvid: req.params.dvid, ssid: req.params.ssid }, req.body, function (err, ss) {
            if (err) {
                if (!config.production) {
                    res.send(err);
                } else {
                    res.status(404);
                    res.end();
                }
            } else {
                res.end();
            }
        });
    } else if (req.type === "gencontrol") {
        GencontrolModel.findOneAndUpdate({ dvid: req.params.dvid, ssid: req.params.ssid }, req.body, function (err, ss) {
            if (err) {
                if (!config.production) {
                    res.send(err);
                } else {
                    res.status(404);
                    res.end();
                }
            } else {
                res.end();
            }
        });
    } else if (req.type === "rangecontrol") {
        RangecontrolModel.findOneAndUpdate({ dvid: req.params.dvid, ssid: req.params.ssid }, req.body, function (err, ss) {
            if (err) {
                if (!config.production) {
                    res.send(err);
                } else {
                    res.status(404);
                    res.end();
                }
            } else {
                res.end();
            }
        });
    } else {
        res.json({ Error: "no value" });
    }
});

router.route('/device/:dvid/sensor/:ssid/datapoint/:key')
    .post(isAuthenticated, isDvsInUkey, isSssInDvs, getSensorType, function (req, res) {
    if (req.query.method === "put") {
        putdatapoint(req, res);
    } else { res.json({ Error: 'Only by querystring access' }); }
})

	.get(isAuthenticated, isDvsInUkey, isSssInDvs, getSensorType, function (req, res) {
    if (req.query.method === "delete") {
        deldatapoint(req, res);
    } else {
        if (req.type === "value") {
            ValuedpModel.findOne({ dvid: req.params.dvid, ssid: req.params.ssid, timestamp: req.params.key }, function (err, dp) {
                if (err) {
                    if (!config.production) {
                        res.send(err);
                    } else {
                        res.status(404);
                        res.end();
                    }
                } else {
                    if (dp !== null) {
                        var obj = dp.toObject();
                        delete obj._id;
                        delete obj.__v;
                        delete obj.dvid;
                        delete obj.ssid;
                        delete obj.timestamp;
                        //obj.timestamp = obj.timestamp.toISOString().replace(/\..+/, '');
                        res.json(obj);
                    } else {
                        res.end();
                    }
                }
            });
        } else if (req.type === "gps") {
            GpsdpModel.findOne({ dvid: req.params.dvid, ssid: req.params.ssid, timestamp: req.params.key }, function (err, dp) {
                if (err) {
                    if (!config.production) {
                        res.send(err);
                    } else {
                        res.status(404);
                        res.end();
                    }
                } else {
                    if (dp !== null) {
                        var obj = dp.toObject();
                        delete obj._id;
                        delete obj.__v;
                        delete obj.dvid;
                        delete obj.ssid;
                        delete obj.timestamp;
                        //obj.timestamp = obj.timestamp.toISOString().replace(/\..+/, '');
                        res.json(obj);
                    } else {
                        res.end();
                    }
                }
            });
        } else if (req.type === "gen") {
            GendpModel.findOne({ dvid: req.params.dvid, ssid: req.params.ssid, key: req.params.key }, function (err, dp) {
                if (err) {
                    if (!config.production) {
                        res.send(err);
                    } else {
                        res.status(404);
                        res.end();
                    }
                } else {
                    if (dp !== null) {
                        var obj = dp.toObject();
                        delete obj._id;
                        delete obj.__v;
                        delete obj.dvid;
                        delete obj.ssid;
                        delete obj.key;
                        res.json(obj);
                    } else {
                        res.end();
                    }
                }
            });
        } else {
            res.json({ Error: "no value" });
        }
    }
})

    //Content-Type 必须为application/json
	.put(isAuthenticated, isDvsInUkey, isSssInDvs, getSensorType, function (req, res) {
    putdatapoint(req, res);
})

	.delete(isAuthenticated, isDvsInUkey, isSssInDvs, getSensorType, function (req, res) {
    deldatapoint(req, res);
});

function deldatapoint(req, res) {
    if (req.type === "value") {
        if (config.mongo.toString().startWith('tingodb')) {
            ValuedpModel.remove({ dvid: req.params.dvid, ssid: req.params.ssid, timestamp: req.params.key }, true);
            res.end();
        } else {
            ValuedpModel.findOneAndRemove({ dvid: req.params.dvid, ssid: req.params.ssid, timestamp: req.params.key }, function (err, ss) {
                if (err) {
                    if (!config.production) {
                        res.send(err);
                    } else {
                        res.status(404);
                        res.end();
                    }
                } else {
                    res.end();
                }
            });
        }
    } else if (req.type === "gps") {
        if (config.mongo.toString().startWith('tingodb')) {
            GpsdpModel.remove({ dvid: req.params.dvid, ssid: req.params.ssid, timestamp: req.params.key }, true);
            res.end();
        } else {
            GpsdpModel.findOneAndRemove({ dvid: req.params.dvid, ssid: req.params.ssid, timestamp: req.params.key }, function (err, ss) {
                if (err) {
                    if (!config.production) {
                        res.send(err);
                    } else {
                        res.status(404);
                        res.end();
                    }
                } else {
                    res.end();
                }
            });
        }
    } else if (req.type === "gen") {
        if (config.mongo.toString().startWith('tingodb')) {
            GendpModel.remove({ dvid: req.params.dvid, ssid: req.params.ssid, key: req.params.key }, true);
            res.end();
        } else {
            GendpModel.findOneAndRemove({ dvid: req.params.dvid, ssid: req.params.ssid, key: req.params.key }, function (err, ss) {
                if (err) {
                    if (!config.production) {
                        res.send(err);
                    } else {
                        res.status(404);
                        res.end();
                    }
                } else {
                    res.end();
                }
            });
        }
    } else {
        res.json({ Error: "no value" });
    }
}

function putdatapoint(req, res) {
    delete req.body.timestamp;
    if (req.type === "value") {
        ValuedpModel.findOneAndUpdate({ dvid: req.params.dvid, ssid: req.params.ssid, timestamp: req.params.key }, req.body, function (err, ss) {
            if (err) {
                if (!config.production) {
                    res.send(err);
                } else {
                    res.status(404);
                    res.end();
                }
            } else {
                res.end();
            }
        });
    } else if (req.type === "gps") {
        GpsdpModel.findOneAndUpdate({ dvid: req.params.dvid, ssid: req.params.ssid, timestamp: req.params.key }, req.body, function (err, ss) {
            if (err) {
                if (!config.production) {
                    res.send(err);
                } else {
                    res.status(404);
                    res.end();
                }
            } else {
                res.end();
            }
        });
    } else if (req.type === "gen") {
        GendpModel.findOneAndUpdate({ dvid: req.params.dvid, ssid: req.params.ssid, key: req.params.key }, req.body, function (err, ss) {
            if (err) {
                if (!config.production) {
                    res.send(err);
                } else {
                    res.status(404);
                    res.end();
                }
            } else {
                res.end();
            }
        });
    } else {
        res.json({ Error: "no value" });
    }
}

//查询数据历史管理api
router.route('/device/:dvid/sensor/:ssid/json')
	.get(isAuthenticated, isDvsInUkey, isSssInDvs, getSensorType, function (req, res) {
    var start = req.query.start;
    var end = req.query.end;
    var itv = req.query.interval;
    var page = req.query.page;
    if (validator.isInt(page)) {
        if (req.type === "gen") {
            GendpModel.find({
                dvid: req.params.dvid, ssid: req.params.ssid
            }).sort({ _id: -1 }).skip((page - 1) * 200).limit(200).exec(function (err, dps) {
                if (err) {
                    if (!config.production) {
                        res.send(err);
                    } else {
                        res.status(404);
                        res.end();
                    }
                } else {
                    var rs_dps = [];
                    dps.forEach(function (dp) {
                        var obj = dp.toObject();
                        delete obj._id;
                        delete obj.__v;
                        delete obj.dvid;
                        delete obj.ssid;
                        rs_dps.push(obj);
                    });
                    res.json(rs_dps);
                }
            });
        } else {
            if (validator.isInt(itv) && validator.isDate(start) && validator.isDate(end)) {
                if (req.type === "value") {
                    ValuedpModel.find({
                        dvid: req.params.dvid, ssid: req.params.ssid, 
                        timestamp: { "$gte": start, "$lte": end }
                    }).sort({ timestamp: 1 }).skip((page - 1) * 200).limit(200).exec(function (err, dps) {
                        if (err) {
                            if (!config.production) {
                                res.send(err);
                            } else {
                                res.status(404);
                                res.end();
                            }
                        } else {
                            var rs_dps = [];
                            var dts = null;
                            dps.forEach(function (dp) {
                                var obj = dp.toObject();
                                if (dts === null) {
                                    dts = obj.timestamp;
                                    delete obj._id;
                                    delete obj.__v;
                                    delete obj.dvid;
                                    delete obj.ssid;
                                    obj.timestamp = obj.timestamp.toISOString().replace(/\..+/, '');
                                    rs_dps.push(obj);
                                } else if ((Math.abs(obj.timestamp - dts) / 1000) >= itv) {
                                    dts = obj.timestamp;
                                    delete obj._id;
                                    delete obj.__v;
                                    delete obj.dvid;
                                    delete obj.ssid;
                                    obj.timestamp = obj.timestamp.toISOString().replace(/\..+/, '');
                                    rs_dps.push(obj);
                                }
                            });
                            res.json(rs_dps);
                        }
                    });
                } else if (req.type === "gps") {
                    GpsdpModel.find({
                        dvid: req.params.dvid, ssid: req.params.ssid, 
                        timestamp: { "$gte": start, "$lte": end }
                    }).sort({ timestamp: 1 }).skip((page - 1) * 200).limit(200).exec(function (err, dps) {
                        if (err) {
                            if (!config.production) {
                                res.send(err);
                            } else {
                                res.status(404);
                                res.end();
                            }
                        } else {
                            var rs_dps = [];
                            var dts = null;
                            dps.forEach(function (dp) {
                                var obj = dp.toObject();
                                if (dts === null) {
                                    dts = obj.timestamp;
                                    delete obj._id;
                                    delete obj.__v;
                                    delete obj.dvid;
                                    delete obj.ssid;
                                    obj.timestamp = obj.timestamp.toISOString().replace(/\..+/, '');
                                    rs_dps.push(obj);
                                } else if ((Math.abs(obj.timestamp - dts) / 1000) >= itv) {
                                    dts = obj.timestamp;
                                    delete obj._id;
                                    delete obj.__v;
                                    delete obj.dvid;
                                    delete obj.ssid;
                                    obj.timestamp = obj.timestamp.toISOString().replace(/\..+/, '');
                                    rs_dps.push(obj);
                                }
                            });
                            res.json(rs_dps);
                        }
                    });
                } else if (req.type === "photo") {
                    ImgdpModel.find({
                        dvid: req.params.dvid, ssid: req.params.ssid, 
                        timestamp: { "$gte": start, "$lte": end }
                    }).sort({ timestamp: 1 }).skip((page - 1) * 20).limit(20).exec(function (err, dps) {
                        if (err) {
                            if (!config.production) {
                                res.send(err);
                            } else {
                                res.status(404);
                                res.end();
                            }
                        } else {
                            var rs_dps = [];
                            var dts = null;
                            dps.forEach(function (dp) {
                                var obj = dp.toObject();
                                if (dts === null) {
                                    dts = obj.timestamp;
                                    delete obj._id;
                                    delete obj.__v;
                                    delete obj.dvid;
                                    delete obj.ssid;
                                    obj.timestamp = obj.timestamp.toISOString().replace(/\..+/, '');
                                    obj.img = obj.img.toString('base64');
                                    rs_dps.push(obj);
                                } else if ((Math.abs(obj.timestamp - dts) / 1000) >= itv) {
                                    dts = obj.timestamp;
                                    delete obj._id;
                                    delete obj.__v;
                                    delete obj.dvid;
                                    delete obj.ssid;
                                    obj.timestamp = obj.timestamp.toISOString().replace(/\..+/, '');
                                    obj.img = obj.img.toString('base64');
                                    rs_dps.push(obj);
                                }
                            });
                            res.json(rs_dps);
                        }
                    });
                }
            } else {
                res.json({ Error: "no value" });
            }
        }
    } else {
        res.json({ Error: "no value" });
    }
});

// all of our routes will be prefixed with /api
app.use('/v1.0', router);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;