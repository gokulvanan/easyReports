
var fs = require("fs");
var common = require('./utils/common');
var config = "/config.js";
(function(){

	var conf = require(process.cwd()+config);
	var logger = common.getLogger(conf);
	conf.getLogger = function(){
		return common.getLogger(conf);
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
