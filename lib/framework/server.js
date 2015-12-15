
  var cluster = require("cluster");
  var http = require("http");
  var queryString = require('querystring'); 
  var os = require("os");
  var url = require("url");
  var async = require('async');
  var common = require('../utils/common');
  var fs = require("fs");
  var json2csv = require('json2csv');	
  var cache = null;
  var logger=null,cpus= 1,conf = null, validator = null, query = null, formatter = null, build = null;
  var halt=false;
  var utils=null;
  var rawUtils=null;


  exports.init = function(config){
    logger = config.getLogger();
    logger.trace("initializing server");
    conf = config;
    cpus = (config.clusters)? config.clusters : os.cpus().length;
    var cacheMap = config.getCacheMap(); //get default cache
    cache = cacheMap.get("default");
    validator = require("./validator");
    validator.init(config);
    query = require("./query");
    query.init(config);
    formatter = require("./formatter");
    formatter.init(config);
    build = require("./response_builder");
    build.init(config);

    utils=common.getUtils(conf);
    utils.getDao = query.getDao;
    rawUtils=common.getRawUtils();
    logger.trace("server initialized"); 
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
    logger.trace("build server called");
    var app = http.createServer(function(request,response){
      if(request.url === "/favicon.ico"){
        response.end();// ignore favico request call from browser
        return;
      }
      var q = url.parse(request.url,true);
      var buff = q.pathname.substring(1).split('.');
      var debugFlag = null;
      if(buff.length >= 2){
        if(buff[0]==="validate" || buff[0]==="build" || buff[0]==="execute"){
          debugFlag = buff[0];
          buff = buff.slice(1);
        }  
      }
      
      build.setMime(buff[1]);
      response.writeHead(200,build.getHeader());

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
          if(cache !== null){
            //cache code
            var cacheFlag= request.url+body;
            cache.get(cacheFlag,function(err,data){
              if(err || !data){
                if(err) logger.error("cache error",err.stack);
                waterfallProcess(cacheFlag,obj,debugFlag,response); 
              }else{
                 response.write(build.success(data));
                 response.end(build.end());
                logger.debug("responded from cache");
              }
            });
          }
        });
      }else{
        obj.search=q.query; 
        if(cache !== null){
          //cache code
          var cacheFlag = request.url;
          cache.get(cacheFlag,function(err,data){
            if(err || !data){
              if(err) logger.error("cache error",err.stack);
              logger.info("http server has received request ",cacheFlag);
              waterfallProcess(cacheFlag,obj,debugFlag,response);
            }else{
             response.write(build.success(data));
             response.end(build.end());
             logger.debug("responded from cache");
            }
          });
        }
      }
    });
    app.listen(conf.port);  
    logger.info(" server started on http://localhost:"+conf.port+"/");
  }

  function waterfallProcess(cacheFlag,obj,debugFlag,response){
    try{
      response.write(build.start());
      if(obj.action === ""){
        response.end(build.notify("Server is up and Running"));
        return;
      }
      logger.info("Entering validator"); 
      validator.validate(obj,function(err,validReq){ // validate if corresponding json exist for this request
        if(err) response.end(build.error("validator",err));
        else{
          logger.info(" successfully validated");
          if(debugFlag === "validate") { 
            response.end(build.notify("validator",validReq));
            return;
          }else{
            if(validReq.model.raw){ //added to provie interface to build raw query execution and formatting logic
              logger.info("raw model processing");
              try{
                var searchParams = validReq.search;
                searchParams.escape=common.escapeFunc;
                validReq.model.raw(searchParams,utils,rawUtils,function(err,output){
                  if(err){
                    response.end(build.error(err.msg,err));
                  }else{
                    response.write(build.success(output));
                    response.end(build.end());
                  }
                });
              }catch(err){
                response.end(build.error("rawHandler",err));
              }
            }else{
              var cacheDuration = validReq.model.cacheDuration || (conf.defaultCacheDuration || 300 ); // cacheDuration can be customized for each js model
              query.build(validReq,function(err,queryReq){ // builds queries (main,count, joins)
                if(err){
                  response.end(build.error("builder",err));
                  return; 
                }else{
                  logger.info(" query sucessfully built");
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
                      logger.info(" query sucessfully executed");
                      var formatObj = {"params":queryReq.search,"header":queryReq.header, "results" : resultObj, display: queryReq.display, joins:queryReq.joins};
                      formatter.format(formatObj,function(err,output){
                        if(err){
                          response.end(build.error("formatter",err));
                          return;
                        }else{
	                  var params = queryReq.search;
	                  logger.info("content type: "+params.extractFormat);
	                  if (params.extractFormat === "csv"){
	                        json2csv({ data: output.data, fields: Object.keys(queryReq.display) }, function(err, csv) {
	                          if (err) logger.error(err);
	                          fs.writeFile("/tmp/"+params.csv_rand+".csv", csv, function(err) {
	                            if (err) throw err;
	                          });
	                        });
	                  }
                          logger.info(" query sucessfully formatted");
                          output.page=obj.search.page;
                          output.rowsPerPage=obj.search.rowsPerPage;
                          response.write(build.success(output));
                          response.end(build.end());
                          if(cache !== null && cacheDuration !== 0){
                            cache.set(cacheFlag,output,cacheDuration,function(err){
                              if(err) logger.alert("Failed to set list cache",err.stack);
                              else logger.trace("cache set successfull");
                            });
                          }
                          logger.info(" Send response ");
                        }
                      });
                    }
                  });
                }
              });
            }
          }
        }
      });
    }catch(err){
      response.end(build.error("uncaught error",err.stack));
    }
    

  }
