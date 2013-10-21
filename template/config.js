
module.exports = function(){

return {
    // mode in which server should be run 
    // possible options are dev and prod modes, use prod mode to e
    mode: "dev", 
    // port to listen
    port: 8080,
    //cluster size when run in prod mode. by default.. number of cpu cores would be taken as cluster size
    //"clusters":4,
    // relative or absloute path to models folder that hold model json
    models: "models",
    //db configurations for mysql database connection
    db: {
        host: "localhost",
        user: "root",
        password: "mysql",
        database: "easyrep"
    },
    // memcache connection used for keyval cache and  list repsonse cache
    cache: {
        keyval: { 
            servers: "127.0.0.1:11211", 
            opts:{
                poolSize:10,
                timeout:5
            }
        },
        list: { 
            servers: "127.0.0.1:11211", 
            opts:{
                poolSize:10
            }
        }
    },
    // logger config.. 
    logger: {
       path: "logs",
       level: "info" // change to debug logs debug statements from framework
    }
  };
}();


