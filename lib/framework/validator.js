
var fs = require('fs');
var MODEL_DIR = process.cwd();
var MODEL_MAP={}; // used in prod mode to prevern json parse of models during server run time

function mandatoryParamsCheck(req,cb){
  var params = req.model.query.mandatory;
  var actual = req.search;
  var missing = new Array();
  
  if (params){
    for(var i=0,len=params.length; i<len; i++) {
      if(!actual[params[i]]) {
        missing.push(params[i]);
      }
    }  
  }
  
  if(missing.length > 0) cb(new Error("Mandatory parameter "+missing.join(",")+" missing from query string"));
  else      cb(null,req);
}

//configure models directory
exports.init = function(conf){
  
  console.log("Initializing validator");
  if(conf.models.charAt(0) === '/') MODEL_DIR=conf.models
  else                              MODEL_DIR += conf.models

  
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
  if(req.action === "") cb(new Error("Not action path specified"));
  if(MODEL_MAP[req.action]){ // prod mode has this cache map to improve performance
    req.model=MODEL_MAP[req.action];
    mandatoryParamsCheck(req,cb);
  }else{
    process.nextTick(function(){
      var model = MODEL_DIR + "/" + req.action + ".json";
      fs.readFile(model,'utf8',function(err,data){
        if(err)  cb(new Error("Invalid action path "));
        else{
          req.model = JSON.parse(data);
          mandatoryParamsCheck(req,cb);
        }
      });
    });
  } 
};

