
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
    if(buff[0]==="valid" || buff[0]==="built" || buff[0]==="executed" && buff.length > 2){
      debugFlag = buff[0];
      buff = buff.slice(1);
    }

    var obj = {
      search:q.query,
      action:buff[0],
    };
    build.setMime(buff[1]);

    console.log(obj)
    response.write(build.start());
    validator.validate(obj,function(err,validReq){ // validate if corresponding json exist for this request
      if(err) response.write(build.error("Error in req validator"));
      else{
        if(debugFlag === "valid")  response.end(JSON.stringify(validReq));
        console.log("successfully validated");
        query.build(validReq,function(err,queryReq){ // builds queries (main,count, joins)
          if(err) response.write(build.error("error in builder"));
          else{
            if(debugFlag === "built") response.end(JSON.stringify(queryReq));
            console.log("query sucessfully built");
            query.execute(queryReq,function(err,resultObj){
              if(err) response.write(build.error("error in execution"));
              else{
                if(debugFlag === "executed") response.end(JSON.stringify(resultObj));
                console.log("query sucessfully executed");
                var formatObj = {"results" : resultObj, display: queryReq.display};
                formatter.format(formatObj,function(err,output){
                  if(err) response.write(build.error("error in formating results"));
                  else{
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


