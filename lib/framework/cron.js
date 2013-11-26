
var fs = require('fs');
var cp = require('child_process');
var common = require('../utils/common');
var PIDS; // holds list of child PID
var isMaster=false;
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
  isMaster=true;
  PIDS=new Array();
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
          var interval = scConf[sc].interval;
          if(interval){
            setInterval(function(){
              executeChildThread(sc,conf,cronDir,monitor);
            },(scConf[sc].interval)*1000);
          }
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
  var logName = (script)? script : "master";
  common.init(conf,"cron",logName); //log to have script name else master
  logger = conf.getLogger();
  
  if(crondir && script){
    var cronPath = crondir+"/"+script+".js";
    if(fs.existsSync(cronPath)){
      cronObj = require(cronPath);
      // initializes utils map to pass as cron arg
      var dao = require("../utils/dao");
      dao.init(conf);
      var mongo = require("../utils/mongo");
      mongo.init(conf);
      utils['emailer']=conf.getEmailer();
      utils['logger']=logger;
      utils['cacheMap']=conf.getCacheMap();
      utils['dao'] = dao;
      utils['mongo'] = mongo;
    }
  }
}

function executeChildThread(script,conf,cronDir,monitor){
  logger.info("executing cron for "+script);
  var child = cp.fork(__dirname+"/cron.js"); //child process of this same cron file
  PIDS.push(child.pid);
  child.on("message",function(msg){ // msg from child handler
    if(monitor || msg.status !== "Success"){
      var objMsg = msg.errMsg || "";
      logger.alert("cron script "+msg.script+" has finished execution status  = "+msg.status,objMsg);
    }
    child.disconnect();
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
  }
});

process.on('SIGINT', function() {
  if(isMaster){
    for(var i=0; i<PIDS.length; i++){
      console.log("easyrep is halting child cron  process "+PIDS[i]);
      process.kill(PIDS[i]);
    }
    console.log("easyrep cron server has stopped");
    process.exit(0);
  }
});
