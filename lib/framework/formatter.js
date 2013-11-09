
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
    
     //get Header and maps key as an attribute to itself
    var display=_.map(req.display,function(val,key){
        header[key]=val.header;
        val.name=key;
        return val;
      });

    if(req.display){
      if(typeof req.display === "object"){ //declarative case
        processDisplay(display,header,res,req,update,cb);
      }else if(typeof req.display === "function"){ // imperative case
        processDisplay(display,header,res,req,rowProcessorWrapper,cb);
      }else{
        cb(new Error("Invalid display declaration, Check docs"));
      }
    }else{ // No display specified shoot out query raw results
      cb(null,constructOutput(req.results.count,res,header));
    }
    
 };

function rowProcessorWrapper(display,req,row,cb){
  var joins = req.joins;
  var joinRows={};
  var joinFlagMap={};
  for(var j in joins){
    joinRows[j] = req.results[j];
    joinFlagMap[j]= getJoinFlagFunc(joins[j].on); //wrapper over common.getJoinFlag
  }
  return req.display(row,joinRows,joinFlagMap,cb); // display func needs row, joinRows and JoinFlagMap
}

function getJoinFlagFunc(flds){
  return function(row){
    return common.getJoinFlag(row,flds,"^")
  }
}

function processDisplay(display,header,res,req,processRow,callback){
  async.map(res,function(row,cb){
    process.nextTick(function(){
      processRow(display,req,row,cb);
    });
  },
  function (err,data){
    if(err) callback(err);
    else{
      callback(null,constructOutput(req.results.count,data,header));
    }
  });
}

function constructOutput(count,res,header){
  var total = (count.length > 0) ? count.pop().total : 0;
  return {
    "data" : res,
    "header": header,
    "total" : total
  };

}

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
