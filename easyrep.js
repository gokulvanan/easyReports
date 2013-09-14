#!/usr/bin/env node

var program = require('commander');
var fs = require("fs");
program
  .version('0.0.1')
  .option('-d, --dev', 'Devlopment Mode - (Overrides config.conf setting)')
  .option('-p, --prod', 'Production Mode - (Overrides config.conf setting)')
  .option('-p, --port', 'HTTP Server Port no. - (Overrides config.conf setting')

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
//	try{
		var conf = JSON.parse(fs.readFileSync("./conf/config.json"));
		if(program.dev) 	conf.mode="dev";
		else             	conf.mode="prod";
		if(program.port)	conf.port=program.port;
		var server = require("./framework/server");
//		server.init(conf);
//		server.start();
/*	}catch(err){
		console.log("Error in start");
		console.log(err);
	}
  */
}

function stop(){
//	try{
		server.stop();
/*	}catch(err){
		console.log("Error in stop");
		console.log(err);
	}
  */
}

var args = process.argv;
if((args[0] === "node" && args.length !== 3) || (args[0] !== "node" && args.length !== 2) ){
  console.log("Invalid usage");
  console.log("usage: node easyrep start/stop");
}

program.parse(process.argv);
