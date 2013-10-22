
var _ = require("underscore");
var mysql = require("mysql");
var dao = require("../utils/dao");
var mongo = require("../utils/mongo");
var common = require("../utils/common");
var async = require("async");
var logger = null;

exports.init = function(conf){
  logger = conf.getLogger();
  logger.debug("Initializing Query Engine");
  //init dao
  var valid = false;
  if(conf.db){
    valid=true;
    dao.init(conf);
  }     
  if(conf.mongo){
    valid=true;
    mongo.init(conf);
  } 
  if(!valid) throw new Error("No Datastore configured.. db/mongo attributes absent in config.js");
  
  logger.debug("Query Engine initialized");
}

// method that builds queries
exports.build = function(req,cb){
    
  if(!req) cb(new Error("Invalid call to query.js build method input is null"));
  process.nextTick(function(){
    var query = req.model.query;
    var def = (query.defaults)? query.defaults : {};
    var params = _.extend(def,(req.search)? req.search : {});
    logger.debug("Params "+JSON.stringify(params));

    if(query.source === "mongo"){
      buildMongoQuery(req,query,params,cb);
    }else{
      buildSqlQuery(req,query,params,cb);
    }
  });
};

//method that execute queries (Executes and streams output for processing
exports.execute = function(req,cb){
  if(!req) cb(new Error("Invalid call to query.js execute method, input is null"));
  var sqls = req.sqls;
  var output = {};
  async.forEach(sqls,function (sql,callback){
      if(req.source === "mongo"){
        mongo.execute(sql.query,function(err,rows){
          queryCallBack(err,rows,req,sql,output,callback);
        });
      }else{
        dao.execute(sql.query,function(err,rows){
          queryCallBack(err,rows,req,sql,output,callback);
        });
      }
    },
    function(err){
      if(err) cb(err);
      else    cb(null,output);
    }
  );
}

function queryCallBack(err,rows,req,sql,output,callback){
  if(err) callback(err);
  else{
    var joinInfo = req.joins[sql.type];
    if(joinInfo){
      process.nextTick(function(){
      output[sql.type]=processJoin(rows,joinInfo);
      callback()
      });
    }else{
      output[sql.type]= rows;         
      callback();    
    }
  }
}

function buildMongoQuery(req,query,params,cb){
    var output= {};
    output.source="mongo";
    output.display=req.model.display;
    output.sqls=[];
    output.joins={};
    var main = query.buildQuery(params);
    main.type="main"; //TODO change this
    output.sqls.push({"type":"main",  "query": main });
    cb(null,output);
}

function buildSqlQuery(req,query,params,cb){
  
    var output= {};
    output.display=req.model.display;
    output.sqls=[];
    output.joins={};   
    var main = null;
    if(query.buildSelect){ //Added for specifying this from local js model if needed
      main =  query.buildSelect(params);
    }else{
      //TODO move this logic to static methods inside param object 
      params.escape = function(val){
        var value = this[val];      
        if(value){
          if(value.indexOf(',') === -1)  return mysql.escape(value);
          else {
            var elms = value.split(",");
            var output = new Array();
            for(var i=0; i<elms.length; i++) output.push(mysql.escape(elms[i]));
            return output.join(",");  
          }
        } 
        else          return value; 
      }

      main =  _.template(query.select, {p:params});
    }
    // Main query building
    output.sqls.push({"type":"main",  "query": (main + ((params.page!== undefined && params.rowsPerPage !== undefined) ? " limit "+params.page+","+params.rowsPerPage : "")) });
    output.sqls.push({"type":"count", "query":"select count(*) as total from ("+main+") as tempAlias"});

    //Join query building
    var joins = query.joins;
    if(joins){
      for(var j in joins){
        var join = joins[j];
        var sql = _.template(join.select, {p:params});
        output.sqls.push({"type":j, "query":sql });    
        output.joins[j] = {"join_type":join.type, "on":join.on}; // join charectersitcs
      }
    }
    cb(null,output);
}


function processJoin(rows,joinInfo){
  var output = {};
  for(var r in rows){
    var joinFlag = common.getJoinFlag(rows[r],joinInfo.on,"^");
    output[joinFlag]=rows[r];
  }
  return output;
}
