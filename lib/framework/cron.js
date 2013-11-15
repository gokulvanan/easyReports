
var fs = require('fs');
var log = require("../utils/logger");
var common = require("../utils/common");
var logger = null;
var CRON_DIR = process.cwd();
var CRON_MAP = {};

exports.init = function(conf,common){
  log.init(conf,"cron");
  logger = log.getLogger();
    if(conf.cron){
    if(conf.cron.path.charAt(0) === '/') CRON_DIR=conf.cron.path;
    else                              CRON_DIR +="/"+conf.cron.path;

    logger.debug(CRON_DIR);
    var files = fs.readdirSync(CRON_DIR);
    CRON_MAP ={};
    for(var f in files){
      CRON_MAP[files[f].split(".")[0]]=require(CRON_DIR+"/"+files[f]);
    }
    try{
      var scripts = conf.cron.scripts;
      if(scripts){
          var argObj = getArgObj(conf,common);
          for(var sc in scripts){
            var obj = CRON_MAP[sc];
            if(obj){
              var interval = scripts[sc];
              setInterval(function(){
                obj.execute(argObj);
              },interval*1000);
            }else{
              throw new Error("Script "+sc+" not defined");
            }
          }
        }
    }catch(err){
      if(conf.mode === "prod") logger.alert("Error in cron script",err.stack);
      else logger.error("Error in cron script",err.stack);
    }
 }

 logger.info("cron server has beens started");
};

function getArgObj(conf){
  var mysql = require('mysql');
  var MongoClient = require('mongodb').MongoClient;
  var Memcached = require("memcached");

  return {
    "mysql":mysql,
    "MongoClient": MongoClient,
    "emailer":common.getEmailer(),
    "logger":logger, //seperate logger configured for cron
    "Memcached":Memcached
  };
}

function loop(){
  console.log("loop call");
  setTimeout(loop,1000);
}
