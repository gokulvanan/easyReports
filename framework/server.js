
var http = require("http");
var url = require("url");
var async = require('async');

var app = null,conf = null, validator = null, query = null, formatter = null, build = null;

exports.init = function(config){
  console.log("Initializing server");
  conf = config;
  validator = require("./validator");
  validator.init(config);
  query = require("./query");
  query.init(config);
  formatter = require("./formatter");
  formatter.init(config);
  build = require("./response_builder");
  build.init(config);
  console.log("Server initialized"); 
}

exports.start = function(){
  console.log("Starting server");
  app = http.createServer(function(request,response){
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
        console.log("successfully validated");
        query.build(validReq,function(err,queryReq){ // builds queries (main,count, joins)
          if(err){
            response.end(build.error("builder",err));
            return; 
          }else{
            if(debugFlag === "build") response.end(build.notify("builder",queryReq));
            console.log("query sucessfully built");
            query.execute(queryReq,function(err,resultObj){
              if(err){
                response.end(build.error("executor",err));
                return;
              }else{
                if(debugFlag === "execute") response.end(build.notify("executor",resultObj));
                console.log("query sucessfully executed");
                var formatObj = {"results" : resultObj, display: queryReq.display, joins:queryReq.joins};
                formatter.format(formatObj,function(err,output){
                  if(err){
                    response.end(build.error("formatter",err));
                    return;
                  }else{
                     console.log("query sucessfully formatted");
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
  console.log("Server started on http://localhost:"+conf.port+"/");
  console.log("PID of easyreport process = %s",process.pid);
};

exports.stop = function(){
  app.close(function(){
    console.log("Server has stoped");
  });
};


