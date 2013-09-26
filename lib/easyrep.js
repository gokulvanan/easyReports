

(function(){
  var program = require('commander');
  var fs = require("fs");
  var path = require("path");
  var common = require('./utils/common')
  var server = null;
  

  program
    .version('0.0.1')
    .option('-d, --dev', 'Devlopment Mode - (Overrides config.conf setting)')
    .option('-p, --prod', 'Production Mode - (Overrides config.conf setting)')
    .option('-p, --port', 'HTTP Server Port no. - (Overrides config.conf setting');

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
                console.log(err);
                fs.rmdirSync(dest);
              } 
              else{
                if(flag) console.log("Yoo.. project "+name+" is up and ready");
                else     console.log("Oops.. something went wrong.. blame it on the author.") ;
              }
               
            });
          }
        });
    });
  }

  function start(){
    console.log("starting");
    // adde code here to validate if cwd is in project.
    var conf = process.cwd()+"/config.json"
    if (!fs.existsSync(conf)){
      console.log("Oops.. Current directory is not valid easyrep project. Use 'easyrep new' to create a new project");
    }else{
      var conf = JSON.parse(fs.readFileSync(process.cwd()+"/config.json"));
      console.log("config loaded")
      if(program.dev)        conf.mode="dev";
      else if(program.prod)  conf.mode="prod";
      if(program.port)       conf.port=program.port;
      server = require(__dirname"/framework/server");
      server.init(conf);

      server.start();
      console.log("easyrep has started");  
    }
    
  }

  function stop(){
    console.log("stoping"); 
    if(server) server.stop();
    else  console.log("Error Server not started to stop");
    console.log("easyrep has been stoped")

  }

  function welcomeMsg(){
       console.log("Welcome to easyrep");
       console.log("A super easy way to build json/cvs/xml reports");
       console.log("To get started create a new project using 'easyrep new'");
       console.log("To start server navigate to project directory and start using 'easyrep start'");
       console.log("To stop server navigate to project directory and stop using  'easyrep stop'");
  }



  var args = process.argv;
  var cmd = args[args.length-1];
  if(cmd !== "start" && cmd !== "stop" && cmd !== "new"){
    welcomeMsg();
  }

  program.parse(process.argv);

}).call(this);
