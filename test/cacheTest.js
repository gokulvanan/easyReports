

var cache = require("../lib/utils/cache.js");
var logger = require("../lib/utils/logger.js");
module.exports = {
  setUp: function (callback) {
   console.log("setup call");
   this.conf = require("/home/komlimobile/git/KM-Interface-Components/kmreports/config.js")
   var log = logger.getLogger(this.conf,"server");
   this.conf.getLogger = function() {return log;}
   callback();
  },
  tearDown: function (callback) {
    console.log("tearDown call");
    this.conf = null;
    callback();
  },
  initTest: function (test) {
    cache.init(this.conf);
    //TODO mock and stub logger to verify the log printed
    test.done();
  },
  setTest: function (test) {
    test.expect(1);
    cache.init(this.conf);
    cache.getCache("list").set("list","test",function(err,data){
      test.isNull(err);
      test.done();  
    },10);
  },
  getTest: function (test) {
    test.expect(2);
    cache.init(this.conf);
    cache.getCache("list").get(function(err,data){
      test.isNull(err);
      test.equasl(data,"test");
      test.done();  
    });
  }
};