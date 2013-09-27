var mysql = require('mysql');
var fs = require('fs');

var pool= null;
var logger = null;

exports.init = function(opts){
  logger = opts.getLogger();
  logger.debug("initializing dao");
  pool = mysql.createPool(opts.db);
  logger.debug("dao initialized");
};

exports.execute = function(sql,cb){
  if(!pool) cb(new Error("dao pool is null. please initialise dao using dao.config"));
  if(!sql) cb(new Error("error in call to dao.js execute method, input is null"));
  pool.getConnection(function(err,conn){
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
