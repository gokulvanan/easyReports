
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
    var params = req.search; 

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
  
  if(req.source === "mongo"){
    executeMongoQuery(req,cb);
  }else{
    executeSQLQuery(req,cb);
  }
}

exports.getDao = function(){
  return dao;
}

function buildMongoQuery(req,query,params,cb){
    var output= { "search" : params, header: req.header}; //params are carried forward till formatter
    output.source="mongo";
    output.display=req.model.display;
    output.sqls=[];
    output.joins={};
    var main = null;
    var count = null;
    if(query.aggregate){ //imperative declaration for aggreagate queries
      var obj = query.aggregate(params);
      
      var pipe = common.clone(obj.where)
      var countPipe = common.clone(obj.where);

      pipe.push({$project:obj.select});
      if(params.orderBy){
        var sort ={};
        sort[params.orderBy]= ((params.dir && params.dir === "desc")? -1 : 1 );
        pipe.push({$sort:sort});
      }

      if(params.rowsPerPage){
        pipe.push({$skip: (parseInt(params.page) || 0 )});
        pipe.push({$limit: parseInt(params.rowsPerPage)});
      }

      countPipe.push({$group: {_id : null, total: {$sum:1}}});
      countPipe.push({$project:{_id:0,total:1}});
      
      main =  { database:obj.database, collection:obj.collection, pipe : pipe , aggregate:true};
      count = { database:obj.database, collection:obj.collection, pipe : countPipe, aggregate:true};

    }else if (query.build){ // imperative declaration for simple mong queries
      var obj = query.build(params);
      main =  { database:obj.database, collection:obj.collection, where : obj.where, select: obj.select};
      count = { database:obj.database, collection:obj.collection, where : obj.where};

      if(params.rowsPerPage){
        main.page = params.page || 0 ;
        main.rowsPerpage= params.rowsPerpage;
      }

      if(params.orderBy){
        var dir = (params.dir && params.dir === "desc")? -1 :  1;
        main.orderBy={};
        main.orderBy[params.orderBy] = dir;
      }
    }
    main.type="main"; //TODO change this
    count.type="count"; //TODO change this
    var datasource = query.datasource || "default"; //detault data source if no source is specified
    output.sqls.push({"datasource":datasource,  "query": main });
    output.sqls.push({"datasource":datasource,  "query": count });
    cb(null,output);
}

function buildSqlQuery(req,query,params,cb){
  
    var output= { "search" : params}; //params are carried forward till formatter
    var datasource = query.datasource || "default"; //default datasource if not specified
    output.display=req.model.display;
    output.header=req.model.header;
    output.sqls=[];
    output.joins={};   
   
    params.escape = common.escapeFunc; // added for SQL injection prevention

    var main = templateProcessing(query,params);
    
    // Main query building
    output.sqls.push({"datasource": datasource, "type":"main",  "query": (main + ((params.dir!== undefined && params.orderBy !== undefined) ? " order by " + params.orderBy + " " + (params.dir!==undefined ? params.dir  : " desc " ) : " ") + ((params.page!== undefined && params.rowsPerPage !== undefined) ? " limit "+params.page+","+params.rowsPerPage : "")) });
    output.sqls.push({"datasource": datasource, "type":"count", "query":"select count(*) as total from ("+main+") as tempAlias"});

    //Join query building
    var joins = query.joins;
    if(joins){
      for(var j in joins){
        var join = joins[j];
        var ds = join.datasource || "default";
        var sql = templateProcessing(join,params);
        output.sqls.push({"datasource":ds, "type":j, "query":sql });    
        output.joins[j] = {"join_type":join.type, "on":join.on}; // join charectersitcs
      }
    }
    cb(null,output);
}

function templateProcessing(obj,params){
  var sql = "";
  if(obj.build){ //Added for specifying this from local js model if needed
    sql =  obj.build(params);
  }else{
    sql =  _.template(obj.select, {p:params});
  }
  return sql;
}

function executeSQLQuery(req,cb){
  var sqls = req.sqls;
  var output = {};
  async.forEach(sqls,function (sql,callback){
      dao.execute(sql.datasource,sql.query,function(err,rows){
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
      });
    },
    function(err){
      if(err) cb(err);
      else    cb(null,output);
    }
  );
}

function executeMongoQuery(req,cb){
  var sqls = req.sqls;
  mongo.execute(sqls,function(err,output){
    if(err) cb(err);
    else{
      cb(null,output);
    }
  });
}

function processJoin(rows,joinInfo){
  var output = {};
  for(var r in rows){
    var joinFlag = common.getJoinFlag(rows[r],joinInfo.on,"^");
    output[joinFlag]=rows[r];
  }
  return output;
}



//TODO construct this function
function translateToMongo(sql){
  // sql = common.trim(sql);
  // var select= common.trim(sql.match(/select.*from/).pop().replace("select","").replace("from").split(","));
  // var collection = common.trim(sql.match(/from \w+ /).pop().replace("from"));
  // var where = common.trim(sql.match(/where.* group/));
  // if(where.length !=0) where = where.pop().replace("where","").replace("group").split(""));

  

  var main={};
  var count={};
  return {main:main, count:count};
}
