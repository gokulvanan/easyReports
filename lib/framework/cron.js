
var fs = require('fs');
var cp = require('child_process');
var common = require('../utils/common');
var logger = null; // pointer to global logger 
var cronObj=null; // pointer to cronObj in child process
var utils={}; // utils passed onto cron scripts
var rawUtils={ // rawUtils passed onto cron scripts
  "mysql":require('mysql'),
  "mongodb": require('mongodb'),
  "memcached":require("memcached"),
  "async":require("async")
};

exports.init = function(conf){
  setup(conf);
  logger.trace("initializing cron server");
  var cronConf = conf.cron;
  var cronDir = process.cwd();
  if(cronConf){
    logger.debug("cron conf defined");
    if(cronConf.path.charAt(0) === '/') cronDir = cronConf.path;
    else                                cronDir += "/"+cronConf.path;
    if(!fs.existsSync(cronDir)){
      logger.error("Invalid cron path, please correct config.js settings for cron");
      process.exit(1);
    }else{
      logger.debug("valid crondir");
      if(cronConf.scripts){
        logger.debug("cron scripts exists");
        var scConf = cronConf.scripts;
        for(var sc in scConf){
          var monitor = scConf[sc].monitor; //should the script send email report for every run
          setInterval(function(){
            executeChildThread(sc,conf,cronDir,monitor);
          },(scConf[sc].interval)*1000);
          if(scConf[sc].loadOnStart === true){
            executeChildThread(sc,conf,cronDir,monitor);
          }
        }
        logger.info("cron server has successfully initialized");
      }else{
        logger.error("No cron scripts defined");
      }
    }
  }else{
    logger.error("No configuration has been set for cron in config.js");
    process.exit(1);
  }
}

function setup(conf,crondir,script){
  // initialize logger, emailer and cache
  common.init(conf,"cron","system");
  logger = conf.getLogger();
  
  if(crondir && script){
    var cronPath = crondir+"/"+script+".js";
    if(fs.existsSync(cronPath)){
      cronObj = require(cronPath);
      // initializes utils map to pass as cron arg
      utils['emailer']=conf.getEmailer();
      utils['logger']=logger;
      utils['cacheMap']=conf.getCacheMap();
      utils['dao'] = require('../utils/dao');
      utils['mongo'] = require('../utils/mongo');
    }
  }
}

function executeChildThread(script,conf,cronDir,monitor){
  logger.info("executing cron for "+script);
  var child = cp.fork(__dirname+"/cron.js"); //child process of this same cron file
  child.on("message",function(msg){ // msg from child handler
    if(monitor || msg.status !== "Success"){
      logger.alert("cron script "+msg.script+" has finished execution status  = "+msg.status,msg.errMsg);
    }
  });
  child.send({"script":script,"config":conf, "crondir":cronDir});//trigger child process
}

//executed by child threads
process.on('message', function(msg){
  try{
    setup(msg.config,msg.crondir,msg.script);
    if(cronObj){
      cronObj(utils,rawUtils, function(err,data){
        if(err){
          process.send({"script":msg.script, status:"Error", errMsg:err.stack});
        } else{
          process.send({"script":msg.script, status:"Success"});
        }
      });
    }else{
      process.send({"script":msg.script, status:"Error", errMsg:"Script not defined"});
    }
  }catch(err){
    process.send({"script":msg.script, status:"Error", errMsg:err.stack});
  }finally{
    process.disconnect(); //disconnect from master - trigger gracefull shutdown
  }
});

