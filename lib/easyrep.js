

(function(){
  var program = require('commander');
  var fs = require("fs");
  var dao = require('./utils/dao');
  var path = require("path");
  var common = require('./utils/common');
  var config="/config.js";
 
  program
    .version('0.0.1-beta10')
    .option('-s, --server', 'Start/Run Http server only')
    .option('-c, --cron', 'Start/Run Cron server only');

  program
    .command("clean")
    .description("clean up old logs ")
    .action(function(){
      clean();
    });

  program
    .command("new")
    .description("create new  project")
    .action(function(){
      build();
    });

  program
    .command("quickstart")
    .description("steps to get started with easyrep and use samples")
    .action(function(){
      quickStart();
    });

  program
    .command("status")
    .description("Display current status")
    .action(function(){
      if(!program.server && program.cron) showStatus("cron");
      else if(program.server && !program.cron) showStatus("start");
      else showStatus();
   });

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
      if(!program.server && program.cron) stopCron();
      else if(program.server && !program.cron) stop(true);
      else stop(false);
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

  
  function showStatus(type){
    var command = (type) ? "ps -ef | grep node | grep -w "+type+" | sed '/grep node/d' " : "ps -ef | grep node | sed '/grep node/d' ";
    console.log(command);
    var exec = require('child_process').exec,child;
    child = exec(command,function(err,stdout,stderr){
      if(err){
        console.log("error in checking status");
        process.exit(1);
      }else{
        console.log(stdout);
        process.exit();
      }
    });
  }

  function clean(){
    var conf = process.cwd()+config
    if (!fs.existsSync(conf)){
      errorMsg();
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
          hrBar();
          console.log("invalid logger path");
          console.log("");
        }
      }else{
        hrBar();
        console.log("no logger defined in config.js to clean logs");
        console.log("");
      }
      process.exit(1);
    }
  }

  function loadTestData(){
    // check if config.json has dao configured
    var conf = process.cwd()+config
    if (!fs.existsSync(conf)){
      errorMsg();
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
                   hrBar();
                   console.log("Done.. Your project '"+name+"' is up and ready :) ");
                   console.log("");
                   console.log("If this is your first time type 'easyrep quickstart' ");
                   console.log("");
                }else{
                   hrBar();
                   console.log("Oops.. something went wrong.. Please report this issue @ https://github.com/gokulvanan/easyReports") ;
                   console.log("");
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
      hrBar();
      console.log("Oops.. Current directory is not valid easyrep project.");
      console.log("Use 'easyrep new' to create a new project");
      console.log("");
      process.exit(1);
    }else if (fs.existsSync(pidFile)){
      hrBar();
      console.log("Oops.. cron_process.pid file exists.. which means either your cronserver process is still running or you killed it and need to remove the cron_process.pid file");
      console.log("");
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
      errorMsg();
      process.exit(1);
    }else if (fs.existsSync(pidFile)){
      hrBar();
      console.log("Oops.. process.pid file exists.. which means either your server process is still running or you killed it and need to remove the process.pid file");
      console.log("");
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
      errorMsg();
    }else{
      if(server)  process.argv[2]="runserver";
      else        process.argv[2]="runcron";
      require(__dirname+"/kickstart"); // rn server in same process

    }
  }

  function stopCron(optional){
    var pidFile = process.cwd()+"/cron_process.pid"
    if (fs.existsSync(pidFile)){
      var pids = fs.readFileSync(pidFile).toString().split(",");
      for(var i=0; i<pids.length; i++){
        var pid = pids[i];
         try{
          process.kill(pid,"SIGINT");
        }catch(err){
          console.log("process "+pid+" in cron_process.pid appears to be not running ");
        }  
      }
      require('child_process').exec("rm -f "+pidFile,function(err,stdout,stderr){
        if(err) console.log("error in removing cron_process.pid file.. plz remove it");
      });
      console.log("easyrep has stopped the cron server");
      hrBar();
      if(optional) return true;
      else process.exit(0);
    }else{
     if(optional) return true;
     else process.exit(0);
    }
  }

  function stop(serverOnly){
    var pidFile = process.cwd()+"/process.pid"
    if (fs.existsSync(pidFile)){
      var pids = fs.readFileSync(pidFile).toString().split(",");
      for(var i=0; i<pids.length; i++){
        var pid = pids[i];
        try{
          process.kill(pid,"SIGINT");
        }catch(err){
          console.log("http process "+pid+" in process.pid appears to be not running ");
        }
      }
      require('child_process').exec("rm -f "+pidFile,function(err,stdout,stderr){
        if(err) console.log("error in removing process.pid file.. plz remove it");
        if(serverOnly === true) process.exit(0);
      });
      console.log("easyrep has stopped the server");
      hrBar();
    }
     if(!serverOnly){
      var status = stopCron();
      if(status) process.exit(0);
      else{
        console.log(" cron server is not running or process.pid/cron_process.pid files were removed manually..");
        process.exit(1);
      }
    }

  }

  function welcomeMsg(){
    hrBar();
    console.log("Invalid Usage");
    console.log("");
    console.log("use easyrep --help to find out correct options");
    console.log("");
    console.log("To create a new project type 'easyrep new'");
    console.log("");
  }

  function quickStart(){
    hrBar();
    console.log("1) change directory to your project. cd <projectName>");
    console.log("");
    console.log("2) modify your config.json to point to your mysql database");
    console.log("");
    console.log("3) use 'easyrep testdata' to load test data tables into your database");
    console.log("");
    console.log("4) user 'easrep run' to run the server");
    console.log("");
    console.log("5) now access the sample models using http://localhost:8080/sample.json&sdate=2013-09-28&edate=2013-09-28");
    console.log("");
    console.log("6) checkout out other sample models in models directory");
    console.log("");
    console.log("Find out more info on running cron server and clusters  @  https://github.com/gokulvanan/easyReports ");
    console.log("");
  }

  function hrBar(){
     console.log("");
     console.log("##################################################################################################");
     console.log("");
  }

  function errorMsg(){
    hrBar();
    console.log("Oops.. Current directory is not valid easyrep project.");
    console.log("");
    console.log("Use 'easyrep new' to create a new project");
    console.log("");
    console.log("Then 'cd <project>; easyrep run' to run  your server cluster");
    console.log("");
    console.log("User 'easyrep start' to start server cluster in nohub mode");
    console.log("");
  }

  var args = process.argv;
 // if(args.length < 3)  welcomeMsg(); // commented as this lead to welcome msg being printed too often while running on prod mode
  

  program.parse(process.argv);

}).call(this);
