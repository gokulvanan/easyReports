
var fs = require("fs");
var jm = require('./utils/json.minify');
var common = require('./utils/common');

(function(){

	var conf = JSON.parse(jm.minify(fs.readFileSync(process.cwd()+"/config.json")));
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
  		logger.log("Server/Cluster has been stoped");
  		process.exit(0);
	});
}).call(this);