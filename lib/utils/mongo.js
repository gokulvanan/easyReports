var MongoClient = require('mongodb').MongoClient;
var async = require("async");


var url = null;
var logger = null;

exports.init = function(opts){
  logger = opts.getLogger();
  var conf = opts.mongo;
  url = 'mongodb://'+conf.host+':'+conf.port+'/'+conf.database;
  logger.debug("initializing mongo");
  MongoClient.connect(url,function(err,db){
    if(err) logger.warn("mongodb not properly configured");
    else logger.info("mongodb has been propery configured");
  });
  logger.debug("mongo initialized");
};

exports.execute = function(queries,cb){
  logger.debug("Inside Mongo executor");
  var output = {};
  // if(!pool) cb(new Error("mongo pool is null. please initialise mongo using config.js"));
  if(!queries) cb(new Error("error in call to mongo.js execute method, input is null"));
    async.forEach(queries,function (val,callback){
   
      MongoClient.connect(url,function(err,db){
        if(err) callback(err);
        else{
          logger.debug(JSON.stringify(val));
          var q = val.query;
          if(q.aggregate){
            db.collection(q.collection).aggregate(q.pipe,function(err,objects){
              close(err,objects,db,q.type,output,callback);
            });
          }else{ // simple find case
            if(q.type === "count"){
              db.collection(q.collection).count(q.where, function(err,count){
                close(err,count,db,q.type,output,callback);
              });
            }else{
              db.collection(q.collection).find(q.where,q.select)
              .skip(q.page)
              .limit(q.rowsPerPage)
              .sort(q.orderBy)
              .toArray(function(err,rows){
                close(err,rows,db,q.typeoutput,callback);
              });
            }
            
          }
          
        } 
      });
    },
    function(err){
      
      if(err) cb(err);
      else    cb(null,output);
    });

 
};



function close(err,objects,db,type,output,callback){
   if(err){ 
      callback(err);
      db.close(); // close database
    }else{
      output[type] =  objects;  
      callback();  
      db.close(); // close database
    }
}

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
