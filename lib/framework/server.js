
  var cluster = require("cluster");
  var http = require("http");
  var queryString = require('querystring'); 
  var os = require("os");
  var url = require("url");
  var async = require('async');
  var common = require('../utils/common');
  var fs = require("fs");
  var logger=null,cpus= 1,conf = null, validator = null, query = null, formatter = null, build = null;
  var halt=false;


  exports.init = function(config){
    logger = config.getLogger();
    logger.debug("initializing server");
    conf = config;
    cpus = (config.clusters)? config.clusters : os.cpus().length;
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
      var pidFile = process.cwd()+"/process.pid"
      logger.info("starting clusters");
      for(var i=0; i<cpus; i++){
        var worker = cluster.fork();
        fs.appendFileSync(pidFile,","+worker.process.pid);
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
        logger.info('the server #' + worker.id +" on pid="+worker.process.pid+ ' has been disconnected');
      });
    }else{
      buildServer();
    }

    
  };

  exports.stop = function(){
    halt=true;
    if(conf.mode === "prod" && cluster.isMaster){
      cluster.disconnect(function(){
        logger.info("cluster has stoped");
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
        action:buff[0]
      };

      if(request.method === 'POST'){  
        var body = '';
        request.on('data', function (data) {
            body += data;
        });
        request.on('end', function () {
          //assuming only form data sent via post call
          obj.search = queryString.parse(body); 
          waterfallProcess(obj,debugFlag,response); 
        });
      }else{
        obj.search=q.query; 
        waterfallProcess(obj,debugFlag,response);
      }

     
      build.setMime(buff[1]);
      logger.debug("Entering validator"); 
      response.write(build.start());
      
      response.writeHead(200,build.getHeader());
    });
    app.listen(conf.port);  
    logger.info(" server started on http://localhost:"+conf.port+"/");
   
  }


  function waterfallProcess(obj,debugFlag,response){
    validator.validate(obj,function(err,validReq){ // validate if corresponding json exist for this request
      if(err) response.end(build.error("validator",err));
      else{
        logger.debug(" successfully validated");
        if(debugFlag === "validate") { 
          response.end(build.notify("validator",validReq));
          return;
        }
          query.build(validReq,function(err,queryReq){ // builds queries (main,count, joins)
            if(err){
              response.end(build.error("builder",err));
              return; 
            }else{
              logger.debug(" query sucessfully built");
              if(debugFlag === "build"){
                response.end(build.notify("builder",queryReq));
                return;
              } 
              query.execute(queryReq,function(err,resultObj){
                if(err){
                  response.end(build.error("executor",err));
                  return;
                }else{
                  if(debugFlag === "execute"){
                    response.end(build.notify("executor",resultObj));
                    return
                  } 
                  logger.debug(" query sucessfully executed");
                  var formatObj = {"params":queryReq.search,"header":queryReq.header, "results" : resultObj, display: queryReq.display, joins:queryReq.joins};
                  formatter.format(formatObj,function(err,output){
                    if(err){
                      response.end(build.error("formatter",err));
                      return;
                    }else{
                     logger.debug(" query sucessfully formatted");
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

  }
