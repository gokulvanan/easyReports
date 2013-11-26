
/*
 * Bootstrap class that creates process for server/cron
 *
*/
var fs = require("fs");
var common = require('./utils/common');
var config = "/config.js";
var cron = require("./framework/cron"); // runs cron scripts

(function(){
  var flag = process.argv[2];
  var conf = require(process.cwd()+config);
  conf.consoleDisable=(flag.indexOf("run") === -1);
  if(flag.indexOf("cron") !== -1){// start only cron server
    console.log("\neasyrep is starting cron server");
    // configure cron jobs
    cron.init(conf);
  }else{
    //init logger and emailer in common
    console.log("\neasyrep is  starting http server");
    common.init(conf,"server","system"); // conf gets to more methods here for emailer and logger
    var server = require(__dirname+"/framework/server");
    server.init(conf);
    server.start();
    // logger.info("Server/Cluster has started");
    process.on('SIGINT', function() {
      server.stop();
      logger.info("server has been stopped");
      process.exit(0);
    });
  }
}).call(this);
