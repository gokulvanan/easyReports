

(function(){
  var program = require('commander');
  var fs = require("fs");
  var dao = require('./utils/dao');
  var path = require("path");
  var common = require('./utils/common');
  var config="/config.js";
 
  program
    .version('0.0.1')
    .option('-s, --server', 'Start/Run Http server only')
    .option('-c, --cron', 'Start/Run Cron server only');

  program
    .command("clean")
    .description("delete logs from project")
    .action(function(){
      clean();
    });

  program
    .command("new")
    .description("create project")
    .action(function(){
      build();
    });

  /*
    program
    .command("startcron")
    .description("cron start")
    .action(function(){
      startCron(); 
    });
  */

  program
    .command("start")
    .description("start server")
    .action(function(){
      if(!program.server && program.cron) startCron();
      else if(program.server && !program.cron) start(true);
      else start(false);
    });

  program
    .command("run")
    .description("run server")
    .action(function(){
      if(!program.server && program.cron) run(false);
      else run(true);
    });

  /*
 program
    .command("stopcron")
    .description("stop cron")
    .action(function(){
      stopCron();
    });
*/
  program
    .command("stop")
    .description("stop server")
    .action(function(){
      stop();
    });
  
  program
    .command("testdata")
    .description("loads sample data")
    .action(function(){
      loadTestData();
    });

  program
    .command("*")
    .description("Invalid usage")
    .action(welcomeMsg);

  
  function clean(){
    var conf = process.cwd()+config
    if (!fs.existsSync(conf)){
      console.log("Oops.. Current directory is not valid easyrep project.");
      console.log("Use 'easyrep new' to create a new project");
      console.log("Then 'cd <project>; easyrep run' to run  your server cluster");
      console.log("User 'easyrep start' to start server cluster in nohub mode");
      process.exit(1);
    }else{
      var conf = require(process.cwd()+config);     
      if(conf.logger){
        var path = conf.logger.path;
        if( path.charAt(0) !== '/') path = process.cwd()+"/"+path;
        if(fs.existsSync(path)){
          var exec = require('child_process').exec,child;
          child = exec('rm '+path+'/cron/* '+path+'/server/*');
          console.log("easyrep has cleaned the old logs");
        }else{
          console.log("invalid logger path");
        }
      }else{
        console.log("no logger defined in config.js to clean logs");
      }
      process.exit(1);
    }
  }

  function loadTestData(){
    // check if config.json has dao configured
    var conf = process.cwd()+config
    console.log(conf);
    if (!fs.existsSync(conf)){
      console.log("Oops.. Current directory is not valid easyrep project.");
      console.log("Use 'easyrep new' to create a new project");
      console.log("Then 'cd <project>; easyrep run' to run  your server cluster");
      console.log("User 'easyrep start' to start server cluster in nohub mode");
      process.exit(1);
    }else{
      var conf = require(process.cwd()+config);     
      dao.testdata(conf); 
    }

    // add dao utils methods to create table 
    // populate data from sampleDump files
  }

  function build(){
    common.read("Enter name of you project",function(name){
        common.createDir(name,process.cwd(),function(err,dest){
          if(err) console.log(err);
          else{
            var src=path.join(__dirname,"../template");
            common.copyContents(src,dest,function(err,flag){
              if(err){
                fs.rmdirSync(dest);
              } 
              else{
                if(flag){
                   console.log("Yo.. project "+name+" is up and ready");
                   console.log("If your a first time user, follow these steps:");
                   console.log("1) cd into your project. cd "+name+"");
                   console.log("2) Modify your config.json to point to your mysql database");
                   console.log("3) use 'easyrep testdata' to load test data t tables to your database");
                   console.log("4) user 'easrep run' to run the server");
                   console.log("Thats it now access this using http://localhost:8080/sample.json&sdate=2013-09-28&edate=2013-09-28");
                   console.log("Find out more @  https://github.com/gokulvanan/easyReports ");
                }else{
                   console.log("Oops.. something went wrong.. Please report this issue @ https://github.com/gokulvanan/easyReports") ;
                }

              }
               
            });
          }
        });
    });
  }
  
  function startCron(optional){
    var conf = process.cwd()+config
    var pidFile = process.cwd()+"/cron_process.pid"
    if (!fs.existsSync(conf)){
      console.log("Oops.. Current directory is not valid easyrep project.");
      console.log("Use 'easyrep new' to create a new project");
      process.exit(1);
    }else if (fs.existsSync(pidFile)){
      console.log("Oops.. cron_process.pid file exists.. which means either your cronserver process is still running or you killed it and need to remove the cron_process.pid file");
      process.exit(1);
    }else{
      var bg = require("child_process").fork(__dirname+"/kickstart",["cron"],"/usr/bin/env node");// run server as separate process
      fs.writeFileSync(pidFile,bg.pid);
      if(optional) return;
      process.exit(0);
    }

  }

  function start(serverOnly){
    var conf = process.cwd()+config
    var pidFile = process.cwd()+"/process.pid"
    if (!fs.existsSync(conf)){
      console.log("Oops.. Current directory is not valid easyrep project.");
      console.log("Use 'easyrep new' to create a new project");
      console.log("Then 'cd <project>; easyrep run' to run  your server cluster");
      console.log("User 'easyrep start' to start server cluster in nohub mode");
      process.exit(1);
    }else if (fs.existsSync(pidFile)){
      console.log("Oops.. process.pid file exists.. which means either your server process is still running or you killed it and need to remove the process.pid file");
      process.exit(1);
    }else{
      if(!serverOnly){
        var confObj = require(conf);
        if(confObj.cron)  startCron(true);
      }
      var bg = require("child_process").fork(__dirname+"/kickstart",["start"],"/usr/bin/env node");// run server as separate process
      fs.writeFileSync(pidFile,bg.pid);
      process.exit(0);
    }
  }

  function run(server){
    var conf = process.cwd()+config
    if (!fs.existsSync(conf)){
      console.log("Oops.. Current directory is not valid easyrep project.");
      console.log("Use 'easyrep new' to create a new project");
      console.log("Then 'cd <project>; easyrep run' to run your server cluster and start developing reports");
    }else{
      if(server)  process.argv[2]="runserver";
      else        process.argv[2]="runcron";
      require(__dirname+"/kickstart"); // rn server in same process

    }
  }

  function stopCron(){
    var pidFile = process.cwd()+"/cron_process.pid"
    if (fs.existsSync(pidFile)){
      var pids = fs.readFileSync(pidFile).toString().split(",");
      for(var i=0; i<pids.length; i++){
        var pid = pids[i];
        process.kill(pid,"SIGINT");
      }
      require('child_process').exec("rm -f "+pidFile,function(err,stdout,stderr){
        if(err) console.log("error in removing cron_process.pid file.. plz remove it");
      });
      console.log("easyrep has stopped the cron server");
      return true;
    }else{
      return false;
    }
  }

  function stop(){
    var pidFile = process.cwd()+"/process.pid"
    if (fs.existsSync(pidFile)){
      var pids = fs.readFileSync(pidFile).toString().split(",");
      for(var i=0; i<pids.length; i++){
        var pid = pids[i];
        process.kill(pid,"SIGINT");
      }
      require('child_process').exec("rm -f "+pidFile,function(err,stdout,stderr){
        if(err) console.log("error in removing process.pid file.. plz remove it");
      });
      console.log("easyrep has stopped the server");
      var status = stopCron();
      if(status) process.exit(0);
    }else{
      var status = stopCron();
      if(status) process.exit(0);
      else {
        console.log("Neither http server nor cron server is running or process.pid/cron_process.pid files were removed manually..");  
        process.exit(1);
      }
    }
  }

  function welcomeMsg(){
       console.log("Welcome to easyrep");
       console.log("A super easy way to build json/cvs/xml reports");
       console.log("To get started create a new project using 'easyrep new'");
       console.log("To start server navigate to project directory and start using 'easyrep start'");
       console.log("To stop server navigate to project directory and stop using  'easyrep stop'");
  }


  var args = process.argv;
  if(args.length < 3)  welcomeMsg();
  

  program.parse(process.argv);

}).call(this);
