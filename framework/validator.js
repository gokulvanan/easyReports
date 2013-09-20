
var fs = require('fs');
var MODEL_DIR = __dirname ;
var MODEL_MAP={}; // used in prod mode to prevern json parse of models during server run time

//configure models directory
exports.init = function(conf){
  
  console.log("Initializing validator");
  if(conf.models.charAt(0) === '/') MODEL_DIR=conf.models
  else                              MODEL_DIR += "/../"+conf.models

  
  if(conf.mode === "prod"){  // cache models to prevent file parsing  in case fo prod mode
    var files = fs.readdirSync(MODEL_DIR);
    for(var f in files){
      MODEL_MAP[f.split(".")[0]]=JSON.parse(fs.readFileSync(MODEL_DIR+"/"+files[f]));
    }
  }

  console.log("validator initialized");
};

/**
* This methods takes input request object, validates if there exist a model for this action and if model exists, it parses the model file and calls the callback on the json model object
* else it calls the callback on the error object
*/
exports.validate  = function(req, cb){
  //check if req is a valid object
  if(!req) return cb(new Error("Null input to validate method of validator"));
  
  if(MODEL_MAP[req.action]){ // prod mode has this cache map to improve performance
    req.model=MODEL_MAP[req.action];
    cb(null,req);
  }else{
    process.nextTick(function(){
      var model = MODEL_DIR + "/" + req.action + ".json";
      fs.readFile(model,'utf8',function(err,data){
        if(err)  cb(err);
        else{
          req.model = JSON.parse(data);
          cb(null,req)
        }
      });
    });
  } 
};

