
/*
 * The below file is the primary configuration file used by easyrep
 */
module.exports = function(){

return {
    /*
     * HTTP Server has two modes of operation
     *
     *  - dev mode
     *  - prod mode
     *
     *  In dev mode the js modles are not cached, they are reloaded for every request call made.
     *  This is useful in development as developer could keep the server running and tweak the model js file to observe its chagnes without server restart.
     *  Also certain prod mode specific settings such as clusters are not avaialbe in dev mode.
     *
    */
    mode: "dev",  // or prod
    /*
     * HTTP Port to listen to
     *
    */
    port: 8080,
    /*
     * Specify cluster size. (Only Applicable to prod mode of operation)
     * The number specified in the cluster size would equal number of independent process listening to the same port. ( All credits to cluster API in nodejs for this )
     * If left commented cluster size is choosen based on number of cores in system when run in prod mode.
     *
    */

    //"clusters":4,

    /*
     * relative path to models directory. (Leave unchanged unless you know what your doing)
     *
    */
    models: "models",
    /*
     * Database Configurations:
     *
     * Builds connection pool of resources specified.
     * You can specify you mysql database connections here.
     * These can be accessed in models and cron js scripts you build.
     * default - is the database accessed by default when no database is explicitly specified in models
     * Any other databse can be specified right below this by giving it any name. Eg. to specify another database as reports
     *
     *  reports:{
     *    host: "127.0.0.1",
     *    user:"root",
     *    password:"sdest",
     *    database:"second"
     *  }
     *
     *  note: default is mandatory and can not be renamed
     *
    */
    db: {
      default:{
        host: "localhost",
        user: "root",
        password: "mysql",
        database: "easyrep"
      }
    },
    /*
     * Mongo Datastore configuration:
     * 
     * Very similar to mysql database configuration, easyrep uses monogdb native js driver api.
     * hence "opts" can be specified as the opts permited in mongdb native js api.
     * By default auto_reconnect and poolSize are specified in this template
     *
    */
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
    /*
     * Memcache Connection Config:
     *
     * Very similar to mysql and mongo configuraiton specified above.
     * Cache play an effective role to speed up response from server.
     * The default cache is used to cache result list form server (Note: Memcache has a size restriction of 1MB, if result size is greater it would not be cached)
     * keyval cache could be used in cases where meta data could be joined with report data. One such use case is joing name with ids.
     * 
     * Note: Its not necessary to have keyval cache as default cache could be used for the same use case. It depends on logic used in app.js
     * Also real usecase would need different caches to be pointing to different host/ports.
     *
    */
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
    /*
     * Email Configuration
     *
     * Configures email capability to the application which is used in monitoring application stability and can also be used by developer
     * in models and cronjobs.
     * 
     * email feature uses nodeemailer in background and as a result it allows email body content to be either text or html.
     *  - templates -> specifies relative path to templates folder which hold templates (underscore templates / .html files) for building html output that would be the body of the email
     *  
     *  Note: Alternatively text emails could be sent by simple string text in body.
     *
     *  - error -> specifies the configuration for emails to send for application monitoring. (This can be used by techops to be aletered incase of any issues
     *  with the server or cron scripts).
     *
     *  This is an effective tool which alerts when any connected component such as databse mysq/mongo or cache layer is down.
     *
    */
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
    /*
     * CRON Server configuration:
     *
     * The below configuration specifies the relative path to cron js scripts.
     * Each cron js script that needs to be run are listed in scripts{}
     * In below sample configuration , test is the script that would be run if test.js is present in cron directory.
     *
     * test cron script has the following config options: 
     *
     *  - interval - durtion in seconds after which script is run again. 
     *  (Note if previous script is not finished before next script is run. Then the next script is not run and an email is sent to techops (if error option of email is configured) 
     *
     *  - loadOnStart - if true will start the script as soon as application cron server starts.
     *
     *  - monitor - if true, will send alert emails to techops on every completion of cron script, 
     *            - if false, will send alert emails to techops only if cron script has failed (not on success)
     *
    */
    cron:{
      path:"cron",
      scripts: { //name of script in cron folder without the .js extension and duration in seconds
        "test":{ interval:10, loadOnStart:true, monitor:true}
      }
    },
    // logger config.. 
    /*
     * Logger Config:
     *
     * The following levels are provided:
     *
     * var levels= {emerg: 7,critical: 6, "alert": 5, error: 4,warn: 3,info: 2,debug: 1, trace: 0  };
     *
     * logger.info("message",obj); // would log the message and object JSON if the level is set to to info or below info
     *
     * NOTE: alert - when used (eg.. logger.alert("test"); ) will trigger email to techopts with message as email body content
     *       critical - when used will generate critical.log in root directory. ( This is used by system when email sending has failed ).
     *       Its the duty of techops to monitor the project root directory for critical.log and have scripts to alert incase this file is generated. 
     *
    */
    logger: {
       path: "logs",
       level: "info" // change to trace or  debug to check framewrok trace/debug logs 
    }
  };
}();


