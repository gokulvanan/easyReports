var mysql = require('mysql');
var fs = require('fs');

var pool= null;


exports.config = function(opts){
	pool = mysql.createPool(opts.dao);
}

exports.execute = function(sql,cb){
  if(!pool) cb(new Error("dao pool is null. please initialise dao using dao.config");
  if(!sql) cb(new Error("Error in call to dao.js execute method, input is null"));
  pool.getConnection(function(err,conn){
    conn.query(sql,function(err,rows){
      if(err) {
        cb(new Error("Error in query execution"));
      }else{
        cb(null,rows);
      }
    });

    conn.release();
  });
};
