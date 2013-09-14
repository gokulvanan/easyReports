
var fs = require('fs');
var MODEL_DIR = process.env.REPORT_MODELS_PATH || __dirname + "/models";
/**
* This methods takes input request object, validates if there exist a model for this action and if model exists, it parses the model file and calls the callback on the json model object
* else it calls the callback on the error object
*/

exports.validate  = function(req, cb){
  process.nextTick(function(){
    //check if req is a valid object
    if(!req) return cb(new Error("Null input to validate method of validator"));
  
    var model = MODEL_DIR + "/" + req.action + ".json";
    fs.readFile(model,'utf8',function(err,data){
      if(err){
        cb(err);
        return;
      }else{
        req.model = JSON.parse(data);
        cb(null,req)
      }
    });
  });
};

