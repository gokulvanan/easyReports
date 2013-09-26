
var fs = require('fs');
var ncp = require('ncp').ncp;

/* Utilities for formatter.js */

// util function for getting hash joins 
exports.getJoinFlag = function(row,join,delim){
	var output = new Array();
	for(var j in join)	output.push(row[join[j]]);
	return output.join(delim);//TODO have this delimiter customizable through application.conf
}


/* Utilities for easyrep.js */

// Read command line arg
exports.read = function(msg,cb){
	process.stdout.write(msg+" ");
	process.stdin.resume();
	process.stdin.on("data", function(data){
  		process.stdin.pause();
  		cb((data+"").substring(0,data.length-1)); // remove carriage return
	});
}



// create directory
exports.createDir = function(name,path,cb){
	var proj = path+"/"+name
	fs.mkdir(proj,function(e){
        if(e)  cb(new Error("Error in creating "+proj+". Check if folder already exist. Error msg: "+e));
        else  cb(null,proj);
    });
}


// copies contents from src directory to destination directory
exports.copyContents = function(src,dest,cb){
	ncp.limit = 16; // not sure.. to check documentation on this
	ncp(src, dest, function (err) {
	 if (err) 	cb(err);
	 else cb(null,true);
	});
	
}