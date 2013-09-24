
var logic = null;
var async = require("async");
var _ = require("underscore");
var Memcached = require("memcached");
var common = require("../utils/common");
var cache =  null;
//

exports.init = function(conf){
  console.log("Initialized formatter");
  var path = conf.logic || "../logic";
  logic = require(path);
 // reload logic every 2min for dev case
  if(conf.mode === "dev"){
    setInterval(function(){
      var path = conf.logic || "../logic";
      logic = require(path);
    },120000);
  }

  if(conf.cache && conf.cache.keyval){
    var keyval = conf.cache.keyval;
    cache = new Memcached(keyval.servers,keyval.opts);  
    //TODO add code to verify if cache is up and running
  }
  
  console.log("Formatter initailized");
}

exports.format = function(req,cb){
    if(!req) cb(new Error("error in formatter.js input to format method is null"));
    var header={};
    var res = req.results["main"];
    
    var display=_.map(req.display,function(val,key){
        header[key]=val.header;
        val.name=key;
        return val;
    });
    
    async.map(res,function(row,cb){
      process.nextTick(function(){
        update(display,req,row,cb);
      });
    },function (err,data){
      if(err) cb(err);
      else{
        var output = {
          "data" : data,
          "header":header,
          "total" : req.results["count"][0]["total"]
        };
        cb(null,output);
      }
    });
    
 };


//TODO modify inner join logic
function update(display,req,row,cb){
  
  async.map(display, function(dp,callback){
    try{
      var returnObj ={"name": dp.name};
      if(!dp.format){ // no format case
        if(dp.join){
          var j = req.joins[dp.join]
          if(j){
            var joinVal=j[row[dp.key]];
            returnObj.val = (j.join_type == "inner")? joinVal : null;
            callback(null,returnObj);
          }else{
            callback(new Error("join "+dp.join+" is not defined in the json file"));
          }
        }else{
          returnObj.val = row[dp.key];  
          callback(null,returnObj);
        }
          
        
      } 
      else{ // format case
        var opts = dp.format.split("^");
        if(opts[0] === "cache"){ // memcache case
          var flag = opts[1];
          if(opts.length>2) {
              flag += common.getJoinFlag(row,opts.slice(2),"");
          }
          if(dp.key) flag += row[dp.key];
          
          cache.get(flag,function(err,data){
              var val = (row[dp.key]) ? row[dp.key]+"^" : "";
              if(err) val+= "Error";
              else{
                data = (data)? data : "Unknown";
                val +=data;
              }
              returnObj.val=val;   
              callback(null,returnObj);
          });
        }else{                    // other logic cases
          process.nextTick(function(){
            var func = logic[opts[0]];
            if(func){
              returnObj.val= func(req,row,dp.key,opts.slice(1));
              callback(null,returnObj); 
            } 
            else  callback(new Error(" Format logic "+opts[0]+" is not defined."));
          });
        }
       
      }
    }catch(err){
      callback(err);
    }
   
  },function(err,output){
      
      if(err) cb(err);
      else{
        var obj = {};
        var dicardFlag=false;
        _.map(output,function(o){
          var buff = o.val;
          discardFlag = (buff === undefined) ;
          obj[o.name] = o.val;
        });
        if(discardFlag) cb();
        else            cb(null,obj);
      }
  });
  
}
