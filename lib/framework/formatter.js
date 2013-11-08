
var async = require("async");
var _ = require("underscore");
var common = require("../utils/common");
var Memcached = require("memcached");
var cache =  null;
var logger = null;

exports.init = function(conf){
  logger = conf.getLogger();
  logger.debug("initialized formatter");
  // memcache Initialization
  if(conf.cache && conf.cache.keyval){
    var keyval = conf.cache.keyval;
    cache = new Memcached(keyval.servers,keyval.opts);  
   //TODO add code to verify if cache is up and running
   }
  logger.debug("formatter initailized");
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
        var total = (req.results.count.length) ? req.results.count.pop().total : 0;
        var output = {
          "data" : data,
          "header":header,
          "total" : total
        };
        cb(null,output);
      }
    });
    
 };

function getJoinRow(joinMap,row,joinInfo){
  var joinFlag = common.getJoinFlag(row,joinInfo.on,"^");
  return joinMap[joinFlag];
}

//TODO modify inner join logic
function update(display,req,row,cb){
  async.map(display, function(dp,callback){
    try{
      var joinMap = null,joinRow = null, j = null; 
      var returnObj ={"name": dp.name};
      if(!dp.format){ // no format case
        if(dp.join){
          joinMap = req.results[dp.join];
          j = req.joins[dp.join];
          if(joinMap){
            joinRow = getJoinRow(joinMap,row,j);
            var joinVal = joinRow[dp.key];
            //TODO add inner and outer join condition here
            returnObj.val = joinVal;
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
        if(dp.join){
          joinMap = req.results[dp.join];
          j = req.joins[dp.join];
          if(j && joinMap){
            joinRow = getJoinRow(joinMap,row,j);
          }else{
            callback(new Error("join "+dp.join+" is not defined in the json file"));
            return;
          }
        }
        process.nextTick(function(){
            var val = (dp.key) ? ((joinRow) ? joinRow[dp.key] : row[dp.key]) : null;
            dp.format(row,req.results,val,dp.key,cache,function(output){
              returnObj.val = output;
              callback(null,returnObj); 
            });
        });
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
