
var fs = require('fs');
var common = require("../utils/common");
var cp = require('child_process');

//GLOBAL Variable
var CRON_DIR = process.cwd();
var CRON_ARG = null;
var CRON_OBJ = null;
var CRON_LOGGER = null;


exports.init = function(conf){

  common.init(conf,"cron");
  CRON_LOGGER = common.getLogger();
  if(conf.cron){
  if(conf.cron.path.charAt(0) === '/') CRON_DIR=conf.cron.path;
  else                              CRON_DIR +="/"+conf.cron.path;
  CRON_LOGGER.debug(CRON_DIR);
     
    try{
      var scripts = conf.cron.scripts;
      if(scripts){
          for(var sc in scripts){
            var obj = require(CRON_DIR+"/"+sc+".js"); // would cache this js in subsequenct calls
            if(obj){
              var scriptObj = scripts[sc]; 
              var interval = scriptObj.interval;
              setInterval(function(){
                runThreads(sc,conf,scriptObj.monitor);
              },interval*1000);
              if(scriptObj.loadOnStart) runThreads(sc,conf,scriptObj.monitor);
            }else{
              process.exit(1);
              throw new Error("Script "+sc+" not defined");
            }
            
          }
      }
    }catch(err){
      if(conf.mode === "prod") CRON_LOGGER.alert("Error in cron script",err.stack);
      else CRON_LOGGER.error("Error in cron script",err.stack);
    }
  
 } 
 CRON_LOGGER.info("cron server has beens started");
};

function runThreads(sc,conf,monitor){

    var child = cp.fork(__dirname+"/cron.js");
    child.on("message",function(msg){ // msg from child handler
      child.kill('SIGHUP');// kill process
      if(monitor || msg.status !== "Success")
        CRON_LOGGER.alert("cron script "+sc+" has finished execution status  = "+msg.status,msg.errMsg);
    });
    
    child.send({"script":sc,"config":conf});
}


process.on('message', function(msg){
  try{
    setup(msg)
    if(CRON_OBJ){
      CRON_OBJ.execute(CRON_ARG, function(err,data){
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


function setup(msg){
  var conf = msg.config;
  var script = msg.script;
  //setup cron path
  if(conf.cron.path.charAt(0) === '/') CRON_DIR=conf.cron.path;
  else                              CRON_DIR +="/"+conf.cron.path;
  // init common module
  common.init(conf,"cron");
  CRON_LOGGER = common.getLogger();
  // build args
  CRON_ARG=getArgObj(conf,common);
  // get script 
  CRON_OBJ = require(CRON_DIR+"/"+script+".js");
}


function getArgObj(con,common){
    var mysql = require('mysql');
    var MongoClient = require('mongodb').MongoClient;
    var Memcached = require("memcached");

    return {
      "mysql":mysql,
      "MongoClient": MongoClient,
      "emailer":common.getEmailer(),
      "logger":CRON_LOGGER, //seperate logger configured for cron
      "Memcached":Memcached
    };
}