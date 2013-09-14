
var fs = require('fs');
var MODEL_DIR = __dirname ;
var MODEL_MAP={}; // used in prod mode to prevern json parse of models during server run time
exports.init = function(conf){
  MODEL_DIR += conf.models
  if(conf.mode === "prod"){ 
    var files = fs.readdirSync(MODEL_DIR);
    for(var f in files){
      MODEL_MAP[f.split(".")[0]]=JSON.parse(fs.readFileSync(MODEL_DIR+"/"+f));
    }
  }
};

/**
* This methods takes input request object, validates if there exist a model for this action and if model exists, it parses the model file and calls the callback on the json model object
* else it calls the callback on the error object
*/
exports.validate  = function(req, cb){
  //check if req is a valid object
  if(!req) return cb(new Error("Null input to validate method of validator"));
  if(MODEL_MAP[action]){
    req.model=MODEL_MAP[action];
    cb(null,req);
  }else{
    process.nextTick(function(){
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
  } 
};

