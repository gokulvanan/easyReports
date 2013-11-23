
module.exports = function(){

return {
    // mode in which server should be run 
    // possible options are dev and prod modes, use prod mode to e
    mode: "dev", 
    // port to listen
    port: 8080,
    //cluster size when run in prod mode. 
    // uncomment the below line to customize numer of clusters
    // by default.. number of cpu cores would be taken as cluster size
    //"clusters":4,
    // relative or absloute path to models folder that hold model json
    models: "models",
    //db configurations for mysql database connection
    db: {
      default:{
        host: "localhost",
        user: "root",
        password: "mysql",
        database: "easyrep"
      }
    },
    //db configuration for mongodb datastore connection
    mongo: {
      default:{
        host: "localhost",
        port: 27017,
        database: "easyrep",
        opts:{
            auto_reconnect: true,
            poolSize: 5
        }
      }
    },
    // memcache connection 
    cache: {
        keyval: { //cache used to get key val for formatting in display
            servers: "127.0.0.1:11211", 
            opts:{
                poolSize:10,
                timeout:5
            }
        },
        default: { // default cache used in cache all request response from the server
            defaultCacheDuration:600, // 10 minutes
            servers: "127.0.0.1:11211", 
            opts:{
                poolSize:10
            }
        }
    },
    /* Uncomment to configure email properties
     email:{
      host:"host address",
      port:569,
      auth:{user:"username",pass:"password"},
      templates:"templates", //template diector to build templates for email output
      error:{ //used in error reporting, triggered from logger.alert method call
        from:"from@gmail.com",
        to:"a@gmail.com,b@gmail.com",
        subject:"Easyrep Error report"
      }
    },
    */
    /* Uncomment to configure cron server properties
    cron:{
      path:"cron",
      scripts: { //name of script in cron folder without the .js extension and duration in seconds
        "script1":1800,
        "script2":600
      }
    },
    */
    // logger config.. 
    logger: {
       path: "logs",
       level: "info" // change to trace or  debug to check framewrok trace/debug logs 
    }
  };
}();


