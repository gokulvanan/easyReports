
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
  PIDS={};
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
            (function(script){ //nesting added to fix closure scope bug
              setInterval(function(){
                executeChildThread(script,conf,cronDir,monitor);
              },(scConf[script].interval)*1000);
            })(sc);
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
  var chPid = child.pid;
  PIDS[chPid]=true;
  child.on("exit",function(code){
    var pid = chPid;
    delete PIDS[pid];
  });
  child.on("message",function(msg){ // msg from child handler
    var childPid=chPid;
    if(monitor || msg.status !== "Success"){
      var objMsg = msg.errMsg || "";
      logger.alert("cron script "+msg.script+" has finished execution status  = "+msg.status,objMsg);
    }
    process.kill(childPid);
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
    for(var pid in PIDS){
      console.log("easyrep is halting child cron  process "+pid);
      process.kill(pid);
    }
    console.log("easyrep cron server has stopped");
    process.exit(0);
  }
});
