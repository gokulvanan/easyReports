
var winston = require("winston");
var nodemailer = require("nodemailer");
var _ = require("underscore");
var fs = require("fs");
var path = require("path");
var logger = null;
var transport = null;
var TEMPLATE_DIR=null;
var errorOpts = null;

exports.init = function(conf){
  logger=getLogger(conf);  
  logger.trace("emailer init call started");
  var emailConf = conf.email;
  if(emailConf){ //configure email in configuration present
    transport = nodemailer.createTransport("SMTP",{
      host:emailConf.host,
      port:emailConf.port,
      auth:emailConf.auth,
      debug:(conf.mode === "dev") // in dev mode output email sent to console 
    });
    TEMPLATE_DIR = (emailConf.templates) ? process.cwd()+"/"+emailConf.templates+"/" : process.cwd()+"/templates/";
    errorOpts = emailConf.error;
    logger.debug("email configured");
  }
  logger.trace("emailer init call ended");
};

/**
 * used to send email 
 * opts: from,to,subject
 * msg: String msg or object
 * temp: (optional) if specified it will read this file from templateDirecotry given in conf
 */
exports.send = function(opts,msg,temp){
 if(!transport) {
   logger.error("email transport not configured"); 
   return;
 }
 temp = (TEMPLATE_DIR) ? TEMPLATE_DIR+temp+".html" : temp;
 logger.trace("send mail call started");
 if(temp && fs.existssync(temp) && (typeof msg === "object")){
   var htmltemp = fs.readfilesync(temp).toString();
   var output = _.template(htmltemp,msg);
   logger.debug("email template output ", output);
   opts.html = output;
 }else{
   var output = (typeof msg === "string") ? msg : JSON.stringify(msg);
   logger.debug("email template output ", output);
   opts.text = output;
 }
  transport.sendMail(opts,function(err,resp){
    if(err) logger.critical("error sending email ",err);
    else logger.debug("email sent");
  });

 logger.trace("send mail call ended");
};


exports.reportError= function(obj){
 var opts = clone(errorOpts);
 opts.text = (typeof obj === "string") ? obj : JSON.stringify(obj);
 transport.sendMail(opts,function(err,resp){
   if(err) logger.critical("failure in email error report",err);
   else logger.debug("email error report sent");
 });
}
// configures winstons logger based on application config thats used throught out the framework
var getLogger= function (conf){
  var config = initLoggerConf(conf);
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
  var config = null;
	var logConf = conf.logger;
	if(!logConf){
		logConf.level="info";
		logConf.path=process.cwd()+"/logs";
	}

  if(logConf.path && fs.existsSync(logConf.path)){
    config={};
    config.file = path.resolve(logConf.path)+"/email_"+process.pid+".log"; //email logs are separte files
    config.level=(logConf.level)? logConf.level : "info";
    return config;
  }else{
    throw new Error("Logger not properly configured.. log path '"+logConf.path+"'mentioned in config.json is not valid.")
  }
}

function clone(obj) {
    if (null == obj || "object" != typeof obj ) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

