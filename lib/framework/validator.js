
var fs = require('fs');
var MODEL_DIR = process.cwd();
var MODEL_MAP=null; // used in prod mode to prevern json parse of models during server run time
var logger= null;



//configure models directory
exports.init = function(conf){
  logger=conf.getLogger();
  logger.debug("initializing validator");
  if(conf.models.charAt(0) === '/') MODEL_DIR=conf.models
  else                              MODEL_DIR +="/"+conf.models

  logger.debug(MODEL_DIR);
  if(conf.mode === "prod"){  // cache models to prevent file parsing  in case fo prod mode
    var files = fs.readdirSync(MODEL_DIR);
    MODEL_MAP ={};
    for(var f in files){
      MODEL_MAP[f.split(".")[0]]=require(MODEL_DIR+"/"+files[f])();// instantiation for every call
    }
  }
  logger.debug("validator initialized");
};

/**
* This methods takes input request object, validates if there exist a model for this action and if model exists, it parses the model file and calls the callback on the json model object
* else it calls the callback on the error object
*/
exports.validate  = function(req, cb){
  //check if req is a valid object
  if(!req) return cb(new Error("Null input to validate method of validator"));
  if(req.action === "") cb(new Error("Not action path specified"));
  if(MODEL_MAP && MODEL_MAP[req.action]){ // prod mode has this cache map to improve performance
    req.model=MODEL_MAP[req.action];
    mandatoryParamsCheck(req,cb);
  }else{
    process.nextTick(function(){
      var model = MODEL_DIR + "/" + req.action + ".js";
      if (!fs.existsSync(model)){
        cb(new Error("Not action path specified"));
      }else{
        var modelObj = require(model)();// instantiation for every call
        req.model = modelObj;
        if(MODEL_MAP) MODEL_MAP[req.action] = modelObj; // cache if in prod mode. as MODEL_MAP is null in dev mode
      else {
        delete require.cache[require.resolve(model)]; // added to preven caching of models in dev mode
        delete require.cache[require.resolve(process.cwd()+"/app")]; // added to preven caching of app.js used by models in dev mode
      }
        mandatoryParamsCheck(req,cb);  
      }
      
    });
  } 
};


function validateParams(req,cb){
  var obj = req.model.request;

  // check mandatory params are present
  var err = mandatoryParamsCheck(obj.mandatory,req.search);
  checkError(err);
  // apply filter logic to params if any
  var params = req.search;
  if(obj.filter){
    params = filterParams(obj.filter,req.search);
  }
  // apply defaults if needed
  if(obj.defaults && typeof obj.defaults === "object"){
    var def = (obj.defaults)? common.clone(obj.defaults) : {}; // in prod mode objecs are singleton.. added to prevent muatation
    params = _.extend(def, ((params)? params : {}));   
  }
  //set updated params to req object
  req.search = params;
  cb(null,req);
}

function checkError(msg,cb){
  if(msg){
    cb(new Error(msg));
    return;
  } 
}

function mandatoryParamsCheck(mandatory,actual){
  var missing = new Array();
  if (mandatory){
    if( typeof mandatory === "object"){ //declartive approach
      for(var i=0,len=mandatory.length; i<len; i++) {
        if(!actual[mandatory[i]]) {
          missing.push(mandatory[i]);
        }
      }
      if(missing.length > 0) return "Mandatory parameter "+missing.join(",")+" missing from query string";
    }else if (typeof mandatory === "function"){ // imperative declartion 
      var msg = mandatory(actual);
      if (msg) return msg;
    } else{
      return " Invalid Js Model declaration, mandatory filed can be any array or a function. Please refer docs";
    }
  }
  return null;
}

function filterParams(filter,params){
  if(typeof filter === "object"){ //declarative
   for(var fld in filter){
      var val = params[fld]; 
      params[fld] = filter[fld](val);
    }
  }else if(typeof filter === "function"){ //declarative
    params = filter(params); // function to return filtered params
  }
}