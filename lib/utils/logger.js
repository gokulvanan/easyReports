var fs = require('fs');
var path = require("path");
var winston = require('winston');

module.exports = (function (){ 
  var email = null;
  var config = null;

  //wraps winstons logger to prepend process pid in each log
  function logWrapper(logger){
    function format(msg){
      if(!msg) return "";
      if(typeof msg === "string"){
        return msg;
      }else{
        return JSON.stringify(msg);
      }
    }
    return {
        trace: function(msg,obj){
          logger.trace("#"+process.pid+" "+format(msg));
          if(obj)  logger.trace("#"+process.pid+" "+format(obj));
        },
        info: function(msg,obj){
          logger.info("#"+process.pid+" "+format(msg));
          if(obj)  logger.info("#"+process.pid+" "+format(obj));
        },
        debug: function(msg,obj){
          logger.debug("#"+process.pid+" "+format(msg));
          if(obj)  logger.debug("#"+process.pid+" "+format(obj));

        },
        error: function(msg,obj){
          logger.error("#"+process.pid+" "+format(msg));
          if(obj)  logger.warn("#"+process.pid+" "+format(obj));

        },
        warn: function(msg,obj){
          logger.warn("#"+process.pid+" "+format(msg));
          if(obj)  logger.warn("#"+process.pid+" "+format(obj));

        },
        alert: function(msg,obj){
          logger.alert("#"+process.pid+" "+format(msg));
          if(obj)  logger.alert("#"+process.pid+" "+format(obj));

          //TODO add code to send emails over here
          email.reportError(msg,obj);
        },
        critical:function(msg,obj){
          logger.critical("#"+process.pid+" "+format(msg));
          if(obj)  logger.critical("#"+process.pid+" "+format(obj));
        }
    };
  }

  return{

    // puts sensible defaults for config incase logger is not configured
    init : function(conf,type,mailObj){
      var logConf = conf.logger;
      email = (!mailObj) ? null : mailObj;
      if(!logConf){
        logConf.level="info";
        logConf.path=process.cwd()+"/logs";
      }

      if(logConf.path && fs.existsSync(logConf.path)){
        config={};
        config.file = path.resolve(logConf.path)+"/"+type+"_"+process.pid+".log";
        config.level=(logConf.level)? logConf.level : "info";
      }else{
        throw new Error("Logger not properly configured.. log path '"+logConf.path+"'mentioned in config.json is not valid.")
      }
    },

    // configures winstons logger based on application config thats used throught out the framework
    getLogger: function (){
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

  };

}).call(this);
