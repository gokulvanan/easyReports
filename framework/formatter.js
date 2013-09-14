
var logic = null;
var async = require("async");

exports.init = function(conf){
  var path = conf.logic || "../logic";
  logic = require(path);
  if(conf.mode === "dev"){
    setInterval(function(){
      var path = conf.logic || "../logic";
      logic = require(path);
   },120000);
  
}

function update(row,req){
	var obj={}
	var display = req.display;
	for(var colName in display){
		var dp = display[colName];
		if(!dp.format) obj[colName] = row[colName];
		else{
			var key = dp.format.split(",");
			obj[colName] = logic[key[0]](req,row,colName,key.slice(1));	
		}
		return obj;
	}
}

exports.format = function(req,cb){
    if(!req) cb(new Error("error in formatter.js input to format method is null"));
    var data=[];
    var header={};
    var res = req.results["main"];
    var len=res.length;
    async.parallel([
    	function (callback){
    		for(var i=0; i<len/2; i++){
		  		data.push(update(res[i],req));
		  	}
		  	callback();
   		},
    	function (callback){
    		for(var i=len/2; i<len; i++){
		  		data.push(update(res[i],req));
		  	}
		  	callback();
    	},
    	function (callback){
    		var display = req.display;
			for(var d in display){
				header[d]=display[d].header;
			}
			callback();
    	},
    	,function (err){
    		if(err) cb(err);
    		else{
    			var output = {
    				"data" : data,
    				"header":header,
    				"total" : req.results["count"][0]["count"]
    			};
    			cb(null,output);
    		}
	    }
    ]);
 }


