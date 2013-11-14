
var fs = require("fs");
var common = require('./utils/common');
var config = "/config.js";
var email = require("./utils/email"); //holds email utilty methods
var cron = require("./framework/cron"); // runs cron scripts
(function(){

	var conf = require(process.cwd()+config);
  // configure cron jobs
  cron.init(conf);
  //init logger and emailer in common
  common.init(conf);
  // configure email
  conf.getEmailer=common.getEmailer();
  // configure logger
	var logger = common.getLogger();
	conf.getLogger = function(){
		return logger;
	};
  
	var server = require(__dirname+"/framework/server");
    server.init(conf);
    server.start();
    // logger.info("Server/Cluster has started");
    process.on('SIGINT', function() {
  		server.stop();
  		logger.info("server has been stopped");
  		process.exit(0);
	});
}).call(this);
