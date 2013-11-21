

var dao = require("../lib/utils/dao.js");

module.exports = {
  setUp: function (callback) {
   console.log("setup call");
   this.conf = require("/home/komlimobile/git/KM-Interface-Components/kmreports/config.js")
   callback();
  },
  tearDown: function (callback) {
    console.log("tearDown call");
    this.conf = null;
    callback();
  },
  initTest: function (test) {
    dao.init(this.conf);
    //TODO mock and stub logger to verify the log printed
    test.done();
  },
  execute: function (test) {
    test.expect(2);
    dao.init(this.conf);
    dao.execute("select id, name from adclients limit 10"),function(err,rows){
      test.isNull(err);
      test.equals(rows.length,20);
      test.done();  
    },10);
  }
 
};