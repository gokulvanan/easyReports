
var _ = require("underscore");
var mysql = require("mysql");
var dao = require("../utils/dao");
var async = require("async");

exports.init = function(conf){
  //init dao
  dao.init(conf);
  //init memcache
  //int logger

}
// method that builds queries
exports.build = function(req,cb){
    
  if(!req) cb(new Error("Invalid call to query.js build method input is null"));
  process.nextTick(function(){
    var query = req.model.query;
    var params = _.extend(query.defaults,req.search);
    //TODO move this logic to static methods inside param object 
    params.escape = function(val){
      if(this[val]) return mysql.escape(this[val]);
      else          return this[val]; 
    }

    var output= {};
    output.display=req.model.display;
    output.sqls=[];

    //TODO add code for processing joins
    var main =  _.template(query.select, {p:params});
    output.sqls.push({"type":"main",  "query": main+" limit "+params.page+","+params.rowsPerPage });
    output.sqls.push({"type":"count", "query":"select count(*) as total from ("+main+") as tempAlias"});
    
    cb(null,output);
  });
};

//method that execute queries (Executes and streams output for processing
exports.execute = function(req,cb){
  if(!req) cb(new Error("Invalid call to query.js execute method, input is null"));
  var sqls = req.sqls;
  var output = {};
  async.forEach(sqls, 
    function (sql,callback){
      dao.execute(sql.query,function(err,rows){
        if(err) callback(err);
        output[sql.type]=rows;         
        callback();
      });
    },
    function(err){
      if(err) cb(err);
      else{
        cb(output);
      }
    }
  );
}
