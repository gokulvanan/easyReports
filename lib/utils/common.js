
var fs = require('fs');
var path = require("path");
var winston = require('winston');
var ncp = require('ncp').ncp; //recursive copy
var email= require("./email");
var config=null;

// Init common
exports.init = function(conf){
  console.log("start init logger and emailers");
  initLoggerConf(conf);
  email.init(conf); 
  console.log("done init loggers and emailers");
}


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


// copies contents from src directory to destination directory
exports.copyContents = function(src,dest,cb){
	ncp.limit = 16; // not sure.. to check documentation on this
	ncp(src, dest, function (err) {
	 if (err) 	cb(err);
	 else cb(null,true);
	});
	
}

// getEmailer
exports.getEmailer = function(){
  return email;
}

// configures winstons logger based on application config thats used throught out the framework
exports.getLogger= function (){
	var logger = new (winston.Logger)({	
  	transports: [
      		new (winston.transports.Console)({ level: config.level }),
     		new (winston.transports.File)({ level: config.level, filename: config.file })
    	]
    });
	var levels= {emerg: 7,critcal: 6, "alert": 5, error: 4,warn: 3,info: 2,debug: 1, trace: 0  };
	logger.setLevels(levels);
  return logWrapper(logger);
}

//clones javascript object
exports.clone = function(obj) {
    if (null == obj || "object" != typeof obj ) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

//trims string content
exports.trim = function(str){
	return str.replace(/^\s*|\s*$/g,"");
}

//wraps winstons logger to prepend process pid in each log
function logWrapper(logger){
  function format(msg){
    if(typeof msg === "string"){
      return msg;
    }else{
      return JSON.stringify(msg);
    }
  }
  return {
      trace: function(msg){
        logger.trace("#"+process.pid+" "+format(msg));
      },
      info: function(msg){
        logger.info("#"+process.pid+" "+format(msg));
      },
      debug: function(msg){
        logger.debug("#"+process.pid+" "+format(msg));
      },
      error: function(msg){
        logger.error("#"+process.pid+" "+format(msg));
      },
      warn: function(msg){
        logger.warn("#"+process.pid+" "+format(msg));
      },
      alert: function(msg){
        logger.alert("#"+process.pid+" "+format(msg));
        //TODO add code to send emails over here
        email.reportError(msg);
      },
      critical:function(msg){
        logger.critical("#"+process.pid+" "+format(msg));
      }
  };
}


// puts sensible defaults for config incase logger is not configured
function initLoggerConf(conf){
	if(config) return; // dont configure if its allready configured
	var logConf = conf.logger;
	if(!logConf){
		logConf.level="info";
		logConf.path=process.cwd()+"/logs";
	}

  if(logConf.path && fs.existsSync(logConf.path)){
    config={};
    config.file = path.resolve(logConf.path)+"/rep_"+process.pid+".log";
    config.level=(logConf.level)? logConf.level : "info";
  }else{
    throw new Error("Logger not properly configured.. log path '"+logConf.path+"'mentioned in config.json is not valid.")
  }
}
