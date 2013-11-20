

// var fs = require('fs');
var logger = require("../lib/utils/logger.js");

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
  loggerInit: function (test) {
    logger.getLogger(this.conf);

    test.done();
  }
};