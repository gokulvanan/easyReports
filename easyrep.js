#!/usr/bin/env node
var program = require('commander');
var fs = require("fs");
var server = null;
program
  .version('0.0.1')
  .option('-d, --dev', 'Devlopment Mode - (Overrides config.conf setting)')
  .option('-p, --prod', 'Production Mode - (Overrides config.conf setting)')
  .option('-p, --port', 'HTTP Server Port no. - (Overrides config.conf setting');

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
  .description("Invalid suage")
  .action(function(){
  	 console.log("Invalid usage");
  	 console.log("usage: node easyrep start/stop");
  });


function start(){
  console.log("starting");
  var conf = JSON.parse(fs.readFileSync("./conf/config.json"));
  console.log("config loaded")
  if(program.dev) 	     conf.mode="dev";
	else if(program.prod)	 conf.mode="prod";
	if(program.port)	     conf.port=program.port;
	server = require("./framework/server");
  server.init(conf);

  server.start();
  console.log("easyrep has started");
}

function stop(){
  console.log("stoping"); 
	if(server) server.stop();
  else  console.log("Error Server not started to stop");
  console.log("easyrep has been stoped")

}

var args = process.argv;
if((args[0] === "node" && args.length !== 3) || (args[0] !== "node" && args.length !== 2) ){
  console.log("Invalid usage");
  console.log("usage: node easyrep start/stop");
}

program.parse(process.argv);
