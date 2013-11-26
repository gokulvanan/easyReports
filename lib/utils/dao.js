var mysql = require('mysql');
var fs = require('fs');
var async = require("async");

var pools= {}; // map to hold all dao pools
var logger = null; // logger pointer

exports.init = function(opts){
  logger = opts.getLogger();
  logger.trace("initializing dao pool");
  var databases = opts.db;
  if(databases){
    for(var db in databases){
      if(databases.hasOwnProperty(db)){
        var pool = mysql.createPool(databases[db]);
        pools[db]=pool;
        testConnection(pool,db);
      }
    }
  }else {
    logger.warn("No SQL databases specified in config.js");
  }
  logger.trace("dao pool initialized");
};

function testConnection(pool,db){
  pool.getConnection(function(err,conn){
    if(err){
      logger.warn("db "+db+" not configured");
      return
    }
    logger.info("Successfully connected to db "+db);
    conn.release();
  });
}
exports.execute = function(db,sql,cb){
  if(!sql) cb(new Error("error no sql specified "));
  if(!db) cb(new Error("error no db specified"));
  var pool = pools[db];
  pool.getConnection(function(err,conn){
    if(err){
      cb(err);
      return;
    }
    conn.query(sql,function(err,rows){
      if(err) {
        cb(new Error("error in query execution"));
      }else{
        cb(null,rows);
      }
    });
    conn.release();
  });
};

exports.getPool = function(db){
  return (pools) ? pools[db] : null;
}

exports.testdata = function(opts){
 // logger = opts.getLogger();
  var pool = pools["default"];
  pool = mysql.createPool(opts.db);
  pool.getConnection(function(err,conn){
    if(err){
      console.log("unable to configure db connection ");
      console.log(err);
      process.exit(1);
      return
    }
    console.log("connected to database");
    var lines = fs.readFileSync(__dirname+"/../data.txt").toString().split("\n");
    async.forEachLimit(lines,5,function(line,callback){
      conn.query(line,function(err,rows){
        if(line.length === 0){
          callback();
          return;
        }
        if(err) console.log("error in query execution, sql:- "+line);
        else    console.log("query executed successfully sql:- "+line);
        callback();
      });
    },
    function(err){
      conn.release();
      process.exit(0);
    })
  });
};
