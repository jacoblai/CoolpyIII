(function($) {
    'use strict';

  String.prototype.startWith = function (str) {
      var reg = new RegExp("^" + str);
      return reg.test(this);
  }

  String.prototype.endWith = function (str) {
      var reg = new RegExp(str + "$");
      return reg.test(this);
  }

  Date.prototype.pattern = function (fmt) {
      var o = {
          "M+": this.getMonth() + 1, //月份         
          "d+": this.getDate(), //日         
          "h+": this.getHours() % 12 == 0 ? 12 : this.getHours() % 12, //小时         
          "H+": this.getHours(), //小时         
          "m+": this.getMinutes(), //分         
          "s+": this.getSeconds(), //秒         
          "q+": Math.floor((this.getMonth() + 3) / 3), //季度         
          "S": this.getMilliseconds() //毫秒         
      };
      var week = {
          "0": "/u65e5",
          "1": "/u4e00",
          "2": "/u4e8c",
          "3": "/u4e09",
          "4": "/u56db",
          "5": "/u4e94",
          "6": "/u516d"
      };
      if (/(y+)/.test(fmt)) {
          fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
      }
      if (/(E+)/.test(fmt)) {
          fmt = fmt.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? "/u661f/u671f" : "/u5468") : "") + week[this.getDay() + ""]);
      }
      for (var k in o) {
          if (new RegExp("(" + k + ")").test(fmt)) {
              fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
          }
      }
      return fmt;
  }

  $.ajaxSetup({
      cache: false,
      statusCode: {
          406: function () {
              $("#msg").html("Error 406 请求速度过快！");
              $('#my-prompt').modal('open');
          },
          412: function () {
              $("#msg").html("Error 412 用户名或密码错误！");
              $('#my-prompt').modal('open');
          },
          404: function () {
              $("#msg").html("Error 404 系统没有对应服务接口！");
              $('#my-prompt').modal('open');
          },
          417: function () {
              $("#msg").html("Error 417 系统没有对应谓词接口！");
              $('#my-prompt').modal('open');
          }
      }
    });
    
  function appvm() {
      var self = this;
      self.showuser = ko.observable(false);
      self.shownav = ko.observable(false);
      self.showuinfo = ko.observable(false);
      self.showback = ko.observable(false);
      self.uid = ko.observable("");
      self.pwd = ko.observable("");

      self.rembme = ko.observable(false);
      if (typeof (Storage) !== "undefined") {
          if (localStorage.getItem("uid") !== null) {
              self.rembme(true);
              self.uid(localStorage.getItem("uid"));
              self.pwd(localStorage.getItem("pwd"));
          }
      }
      self.rembme.subscribe(function (val) {
          if (typeof (Storage) !== "undefined") {
              if (val) {
                  if (self.uid() !== "" && self.pwd() !== "") {
                      localStorage.setItem('uid', self.uid());
                      localStorage.setItem('pwd', self.pwd());
                      $("#msg").html("账号已记录在本机！");
                      $('#my-prompt').modal('open');
                  }
              } else {
                    localStorage.clear();
                  self.uid("");
                  self.pwd("");
                  $("#msg").html("账号已清除！");
                  $('#my-prompt').modal('open');
              }
          } else {
              $("#msg").html("你的浏览器不支持此功能！");
              $('#my-prompt').modal('open');
          }
      });
        
        self.link_nav = function (){
            go("web/nav_page.html");
        }
      self.link_acuss = function () {
          go("web/ac_uss_page.html");
      };
      self.link_acaddus = function () {
          go("web/ac_addus_page.html");
      };
      self.link_account = function () {
          go("web/ac_page.html");
      };
      self.link_user_center = function () {
          go("web/center_page.html");
      };
      self.link_alldvs = function () {
          go("web/dvs_page.html");
      };
      self.link_accountEditPwd = function () {
          go("web/acpwd_page.html");
      };
      self.link_adddv = function () {
          go("web/dvadd_page.html");
      };
    self.link_user = function () {
        if ($.AMUI.utils.cookie.get('uid') !== null) {
            $("#dialog").html("你确定想退出系统吗？");
            var $confirm = $('#exit-confirm');
            var confirm = $confirm.data('am.modal');
                var onConfirm = function () {
                $.AMUI.utils.cookie.set('ukey', null);
                $.AMUI.utils.cookie.set('uid', null);
                $.AMUI.utils.cookie.set('pwd', null);
                window.location = "index.html";
            }; var onCancel = function () { }
                
            if (confirm) {
                confirm.options.onConfirm = onConfirm;
                confirm.options.onCancel = onCancel;
                confirm.toggle(this);
            } else {
                $confirm.modal({
                    relatedElement: this,
                    onConfirm: onConfirm,
                    onCancel: onCancel
                });
            }
        }
    };
      self.bt_login = function () {
          if (self.uid() !== "" && self.pwd() !== "") {
              $.AMUI.progress.start();
              $.ajax({
                  url: "/v1.0/user?username=" + self.uid() + "&pass=" + self.pwd()
              }).done(function (data) {
                    if (data.ukey !== null) {
                        $.AMUI.utils.cookie.set('ukey', data.ukey);
                        $.AMUI.utils.cookie.set('uid', self.uid());
                        $.AMUI.utils.cookie.set('pwd', self.pwd());
                      if (data.userId === "admin") {
                          self.showuser(true);
                      };
                      self.showuinfo(true);
                      self.shownav(true);
                      go("web/center_page.html");
                  } else {
                      $("#msg").html("登陆失败");
                      $('#my-prompt').modal('open');
                      self.uid("");
                      self.pwd("");
                  }
                  $.AMUI.progress.done();
              }).fail(function (xhr) {
                  self.uid("");
                  self.pwd("");
                  $.AMUI.progress.done();
              });
          }
      };

      self.gopage = function (url) {};
  };
  ko.applyBindings(new appvm(), document.getElementById("mainModel"));

  function go(url)
  {
      $("#render").load(url);
      $("#menu1").offCanvas('close');
    }

    window.onbeforeunload = function () {
        $.AMUI.utils.cookie.set('ukey', null);
        $.AMUI.utils.cookie.set('uid', null);
        $.AMUI.utils.cookie.set('pwd', null);
  }

})(jQuery);
