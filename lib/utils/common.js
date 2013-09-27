
var fs = require('fs');
var path = require("path");
var winston = require('winston');
var ncp = require('ncp').ncp; //recursive copy

/* Utilities for formatter.js */

// util function for getting hash joins 
exports.getJoinFlag = function(row,join,delim){
	var output = new Array();
	for(var j in join)	output.push(row[join[j]]);
	return output.join(delim);//TODO have this delimiter customizable through application.conf
}


/* Utilities for easyrep.js */

// Read command line arg
exports.read = function(msg,cb){
	process.stdout.write(msg+" ");
	process.stdin.resume();
	process.stdin.on("data", function(data){
  		process.stdin.pause();
  		cb((data+"").substring(0,data.length-1)); // remove carriage return
	});
}



// create directory
exports.createDir = function(name,path,cb){
	var proj = path+"/"+name
	fs.mkdir(proj,function(e){
        if(e)  cb(new Error("Error in creating "+proj+". Check if folder already exist. Error msg: "+e));
        else  cb(null,proj);
    });
}

L:
// copies contents from src directory to destination directory
exports.copyContents = function(src,dest,cb){
	ncp.limit = 16; // not sure.. to check documentation on this
	ncp(src, dest, function (err) {
	 if (err) 	cb(err);
	 else cb(null,true);
	});
	
}


// configures winstons logger based on application config thats used throught out the framework
exports.getLogger= function (conf){
	initLoggerConf(conf);
	var logger = new (winston.Logger)({	
  	transports: [
      		new (winston.transports.Console)({ level: conf.level }),
     		new (winston.transports.File)({ level: conf.level, filename: conf.file })
    	]
    });
	var levels= {emerg: 7,alert: 6,crit: 5,error: 4,warning: 3,notice: 2,info: 1,debug: 0  };
	logger.setLevels(levels);
    return logger;
}


// puts sensible defaults for config incase logger is not configured
function initLoggerConf(conf){
	if(conf.level && conf.file) return conf; // dont configure if its allready configured
	var logConf = conf.logger;
	if(!logConf){
		conf.level="info";
		conf.file=process.cwd()+"/logs/rep_"+process.pid+".log";
	}else{
		if(logConf.path && fs.existsSync(logConf.path)){
			conf.file = path.resolve(logConf.path)+"/rep_"+process.pid+".log";
		}else{
			console.log("Logger not properly configured.. log path '"+logConf.path+"'mentioned in config.json is not valid.")
		}
		conf.level=(logConf.level)? logConf.level : "info";
	}
	return conf;
}