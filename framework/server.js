
var http = require("http");
var url = require("url");
var async = require('async');
var validator = require("./validator");
var query = require("./query");
var formatter = require("./formatter"); 
var build = require("./response_builder");

// Build the server
var app = http.createServer(function(request,response){
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
                else response.write(build.success(output));
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

app.listen(8080,"localhost");
console.log("Server running on http://localhost:8080/");

