var MongoClient = require('mongodb').MongoClient;
var async = require("async");

var urls = {}; // map each mongo url connection url to name as in config.js
var logger = null; //pointer to common logger

exports.init = function(opts){
  logger = opts.getLogger();
  logger.trace("initializing mongo");
  var confs = opts.mongo;
  if(confs){
    for(var c in confs){
      if(confs.hasOwnProperty(c)){
        var conf = confs[c];
        var url = 'mongodb://'+conf.host+':'+conf.port+'/'+conf.database;
        urls[c]=url;
        MongoClient.connect(url,function(err,db){
          if(err) logger.warn("mongodb "+c+" not properly configured \n",err.stack);
          else logger.info("Successfully connected to mongo db "+c);
        });
      }
    }
  }else {
    logger.warn("no mongo configuration specified in config.js");
  }
  logger.trace("mongo initialized");
};

exports.execute = function(queries,cb){
  logger.trace("Inside Mongo executor");
  var output = {};
  if(!queries) cb(new Error("invalid queries specified"));
    async.forEach(queries,function (val,callback){
      var url = urls[val.datasource];
      if(!url) cb(new Error(" datasource "+val.datasource+" is not cofigured in config.js"));
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

exports.getUrl = function(db){
  return (urls) ? urls[db] : null;
}

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
