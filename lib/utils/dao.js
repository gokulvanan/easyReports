var mysql = require('mysql');
var fs = require('fs');
var async = require("async");

var pool= null;
var logger = null;

exports.init = function(opts){
 // logger = opts.getLogger();
  console.log("initializing dao");
  pool = mysql.createPool(opts.db);
  pool.getConnection(function(err,conn){
    if(err){
      console.log("db not configured");
      return
    }
    console.log("db connection  has been established");
    conn.release();
  });
  console.log("dao initialized");
};

exports.execute = function(sql,cb){
  if(!pool) cb(new Error("dao pool is null. please initialise dao using dao.config"));
  if(!sql) cb(new Error("error in call to dao.js execute method, input is null"));
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

exports.testdata = function(opts){
 // logger = opts.getLogger();
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
