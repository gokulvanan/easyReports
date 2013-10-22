var MongoClient = require('mongodb').MongoClient;
var Server = require('mongodb').Server;
// var fs = require('fs');
// var async = require("async");

var pool= null;
var logger = null;

exports.init = function(opts){
  logger = opts.getLogger();
  var conf = opts.mongo;
  logger.debug("initializing mongo");
  pool = new MongoClient(new Server(conf.host, conf.port),conf.opts);
  pool.open(function(err,conn){
    if(err){
      logger.warn("mongodb not configured");
      return
    }
    logger.info("mongodb connection  has been established");
    conn.close();
  });
  logger.debug("mongo initialized");
};

exports.execute = function(query,cb){
  console.log("INside mogno executor");
  console.log(query);
  if(!pool) cb(new Error("mongo pool is null. please initialise mongo using config.js"));
  if(!query) cb(new Error("error in call to mongo.js execute method, input is null"));
  pool.open(function(err,conn){
    if(err){
      cb(err);
      return;
    }
    if(query.type === "main"){
      
      conn.db(query.database).collection(query.collection).aggregate(query.pipe,function(err,rows){
        if(err) {
          conn.close();
          cb(new Error("error in mongo pipe execution"));
        }else{
          conn.close();
          cb(null,rows);

        }
      });  
    }else{
      //do nothing TODO implement calls to join and count
      cb(null,null);
    }      
  });
};



/*exports.testdata = function(opts){
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
};*/
