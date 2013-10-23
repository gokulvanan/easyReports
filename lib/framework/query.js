
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
    var def = (query.defaults)? common.clone(query.defaults) : {}; // in prod mode objecs are singleton.. added to prevent muatation
    var params = _.extend(def,(req.search)? req.search : {}); 

    if(query.filter){
      for(var fld in query.filter){
        var val = params[fld]; 
        params[fld] = query.filter[fld](val);
      }
    }

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
  if(req.source === "mongo"){
    executeMongoQuery(sqls,cb);
  }else{
    executeSQLQuery(req,sqls,cb);
  }
}


function buildMongoQuery(req,query,params,cb){
    var output= {};
    output.source="mongo";
    output.display=req.model.display;
    output.sqls=[];
    output.joins={};
    var main = null;
    var count = null;
    if(query.buildQuery){
      var obj = query.buildQuery(params);
      var pipe = common.clone(obj.filter)
      var countPipe = common.clone(obj.filter);
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
      
      main =  { database:obj.database, collection:obj.collection, pipe : pipe};
      count = { database:obj.database, collection:obj.collection, pipe : countPipe};

    }else if (query.pipe){ // TODO
      main =  _.template(query.pipe, {p:params}); //takes pipe code entered and applies templating
      // WOULD required count clause to be specified exclusively
    }else{ //TODO
      params.escape = escapeFunc;
      var buff =  _.template(query.select, {p:params}); // takes select clause and translates to pipe and select caluse
      var obj = translateToMongo(buff);
      main = obj.main;
      count = obj.count;
    }
    main.type="main"; //TODO change this
    count.type="count"; //TODO change this
    output.sqls.push({"type":"main",  "query": main });
    output.sqls.push({"type":"count",  "query": count });
    cb(null,output);
}

function buildSqlQuery(req,query,params,cb){
  
    var output= {};
    output.display=req.model.display;
    output.sqls=[];
    output.joins={};   
    var main = null;
    if(query.buildQuery){ //Added for specifying this from local js model if needed
      main =  query.buildQuery(params);
      if(params.orderBy){
        main += "order by "+params.orderBy+" "+(params.dir || "asc");
      }
    }else{
      params.escape = escapeFunc;
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

function executeSQLQuery(req,sqls,cb){
  var output = {};
  async.forEach(sqls,function (sql,callback){
      dao.execute(sql.query,function(err,rows){
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

function executeMongoQuery(sqls,cb){
  mongo.execute(sqls,function(err,output){
     if(err) cb(err);
     else    cb(null,output);
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


function escapeFunc(val){
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