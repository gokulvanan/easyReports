

(function(){
  var program = require('commander');
  var fs = require("fs");
  var path = require("path");
  var common = require('./utils/common');

  program
    .version('0.0.1');
    // .option('-d, --dev', 'Devlopment Mode - (Overrides config.conf setting)')
    // .option('-p, --prod', 'Production Mode - (Overrides config.conf setting)')
    // .option('-p, --port', 'HTTP Server Port no. - (Overrides config.conf setting');

  program
    .command("new")
    .description("create project")
    .action(function(){
      build();
    });

  program
    .command("start")
    .description("start server")
    .action(function(){
      start();
    });

  program
    .command("run")
    .description("run server")
    .action(function(){
      run();
    });

  program
    .command("stop")
    .description("stop server")
    .action(function(){
      stop();
    });

  program
    .command("*")
    .description("Invalid usage")
    .action(welcomeMsg);


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
                if(flag) console.log("Yo.. project "+name+" is up and ready");
                else     console.log("Oops.. something went wrong.. Please report this issue @ https://github.com/gokulvanan/easyReports") ;

              }
               
            });
          }
        });
    });
  }

  function start(){
    var conf = process.cwd()+"/config.json"
    if (!fs.existsSync(conf)){
      console.log("Oops.. Current directory is not valid easyrep project.");
      console.log("Use 'easyrep new' to create a new project");
      console.log("Then 'cd <project>; easyrep run' to run  your server cluster");
      console.log("User 'easyrep start' to start server cluster in nohub mode");
    }else{
      var bg = require("child_process").fork(__dirname+"/kickstart",[],"/usr/bin/env node");// run server
      process.exit(0);
    }
  }

  function run(){
    var conf = process.cwd()+"/config.json"
    if (!fs.existsSync(conf)){
      console.log("Oops.. Current directory is not valid easyrep project.");
      console.log("Use 'easyrep new' to create a new project");
      console.log("Then 'cd <project>; easyrep run' to run your server cluster and start developing reports");
    }else{
      var server = require(__dirname+"/kickstart");
    }
  }

  function stop(){
    //TODO
    var pid = process.cwd()+""
    console.log("Easyrep has been stoped")

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
