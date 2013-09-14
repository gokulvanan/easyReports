
var http = require("http");
var url = require("url");
var async = require('async');

var app = null,conf = null, validator = null, query = null, formatter = null, build = null;

exports.init = function(config){
  this.conf = config;
  validator = require("./validator");
  validator.init(config);
  query = require("./query");
  query.init(config);
  formatter = require("./formatter");
  formatter.init(config);
  build = require("./response_builder");
  build.init(config);
  console.log("inti call ended"); 
}

exports.start = function(){
  app = http.createServer(function(request,response){
    var q = url.parse(request.url,true);
    var buff = q.pathname.substring(1).split('.');
    var obj = {
      search:q.query,
      action:buff[0],
    };
    build.setMime(buff[1]);
    response.write(build.start());
    validator.validate(obj,function(err,validReq){ // validate if corresponding json exist for this request
      if(err) response.write(build.error("Error in req validator"));
      else{
        console.log("successfully validated");
        query.build(validReq,function(err,queryReq){ // builds queries (main,count, joins)
          if(err) response.write(build.error("error in builder"));
          else{
            console.log("query sucessfully built");
            query.execute(queryReq,function(err,resultObj){
              if(err) response.write(build.error("error in execution"));
              else{
                var formatObj = {"results" : resultObj, display: queryReq.display};
                formatter.format(formatObj,function(err,output){
                  if(err) response.write(build.error("error in formating results"));
                  else{
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
  console.log("easyReport started on http://localhost:8080/");
  console.log("PID of easyreport process = %s",process.pid);
};

exports.stop = function(){
  app.close(function(){
    console.log("easyReport has stoped");
  });
};


