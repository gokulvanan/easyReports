
var cluster = require("cluster");
var http = require("http");
var os = require("os");
var url = require("url");
var async = require('async');
var common = require('../utils/common');

var logger=null,cpus= 1,conf = null, validator = null, query = null, formatter = null, build = null;
var halt=false;


exports.init = function(config){
  logger = config.getLogger();
  logger.debug("initializing server");
  conf = config;
  cpus = (config.cluster_count)? config.cluster_count : os.cpus().length;
  validator = require("./validator");
  validator.init(config);
  query = require("./query");
  query.init(config);
  formatter = require("./formatter");
  formatter.init(config);
  build = require("./response_builder");
  build.init(config);
  logger.debug("server initialized"); 
}

exports.start = function(){
  
  if(conf.mode === "prod" && cluster.isMaster){
    logger.info("starting clusters");
    for(var i=0; i<cpus; i++){
      var worker = cluster.fork();
      logger.info("spawning server #"+worker.id+" on pid="+worker.process.pid);
    }
    cluster.on("exit",function(worker,code,signal){
      if(halt){
        logger.info('the server #' + worker.id +" on pid="+worker.process.pid+' has exited');
      }else{
        logger.info('the server #' + worker.id +" on pid="+worker.process.pid+' has died and is being restarted');
        var newWoker = cluster.fork();
        logger.info("re-spawning server #"+newWoker.id+" on pid="+newWoker.process.pid);   
      }  
    });
    cluster.on('disconnect', function(worker) {
      logger.log('the server #' + worker.id +" on pid="+worker.process.pid+ ' has been disconnected');
    });
  }else{
    buildServer();
  }

  
};

exports.stop = function(){
  halt=true;
  if(conf.mode === "prod" && cluster.isMaster){
    cluster.disconnect(function(){
      logger.log("cluster has stoped");
    });  
  }
};



function buildServer(){
  var app = http.createServer(function(request,response){
    var q = url.parse(request.url,true);
    var buff = q.pathname.substring(1).split('.');
    var debugFlag = null;
    if(buff.length >= 2){
      if(buff[0]==="validate" || buff[0]==="build" || buff[0]==="execute"){
        debugFlag = buff[0];
        buff = buff.slice(1);
      }  
    }
    

    var obj = {
      search:q.query,
      action:buff[0],
    };
    
    build.setMime(buff[1]);
    
    response.write(build.start());
    validator.validate(obj,function(err,validReq){ // validate if corresponding json exist for this request
      if(err) response.end(build.error("validator",err));
      else{
        if(debugFlag === "validate")  response.end(build.notify("validator",validReq));
        logger.debug("#"+process.pid+" successfully validated");
        query.build(validReq,function(err,queryReq){ // builds queries (main,count, joins)
          if(err){
            response.end(build.error("builder",err));
            return; 
          }else{
            if(debugFlag === "build") response.end(build.notify("builder",queryReq));
            logger.debug("#"+process.pid+" query sucessfully built");
            query.execute(queryReq,function(err,resultObj){
              if(err){
                response.end(build.error("executor",err));
                return;
              }else{
                if(debugFlag === "execute") response.end(build.notify("executor",resultObj));
                logger.debug("#"+process.pid+" query sucessfully executed");
                var formatObj = {"results" : resultObj, display: queryReq.display, joins:queryReq.joins};
                formatter.format(formatObj,function(err,output){
                  if(err){
                    response.end(build.error("formatter",err));
                    return;
                  }else{
                     logger.debug("#"+process.pid+" query sucessfully formatted");
                     output.page=obj.search.page;
                     output.rowsPerPage=obj.search.rowsPerPage;
                     response.write(build.success(output));
                  }
                  response.end(build.end());
                });
              }
            });
          }
        });
      } 
    });
    response.writeHead(200,build.getHeader());
  });
  app.listen(conf.port,"localhost");  
  logger.info("#"+process.pid+" server started on http://localhost:"+conf.port+"/");
 
}
