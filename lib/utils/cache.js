
/**
	wrapper for memcache connnection
*/

var Memcached = require("memcached");
var caches = {}; //global variable for all caches
var threshold=5000;// threshold to avoid timeout hangs due to memcache
var emptyCache = { //default empty cache definition to prevent null pointer errors
  get: function(key,cb){ cb(null,null); },
  set: function(key,val,duration,cb){cb(null);}
};


/*
	Configures all cache declartaions
*/
exports.init = function(conf, log){
	logger = log;
  logger.trace("initializing caches");
  var cacheConf = conf.cache;
  if(cacheConf){
  	for(var type in cacheConf){
  		if(cacheConf.hasOwnProperty(type)){
         var cacheOpts = cacheConf[type].opts;
  			 var cache = new Memcached(cacheConf[type].servers,cacheOpts);  
  			 cacheOpts.defaultCacheDuration= cacheOpts.defaultCacheDuration || 0;
  			 checkAndWrap(type,cache,cacheConf[type]);
  			 caches[type] = cache;
  		}
  	}
  }
  logger.trace("caches initialized");
}

exports.get = function(type){
	var cache = caches[type];
	return cache || emptyCache;
}

/**
	function verfies if memcache is up and runing and wrapps get and set methods to respond within
	a timeout threshold
*/
function checkAndWrap(name,cache,cacheOpts){
	// Wrapper for Cache to enable timeout
	var get = cache.get;
	var set = cache.set;
  console.log(set);
  var timeoutgetFlag=false;
	cache.get = function(key,cb){
		var timeoutId = setTimeout(function(){
			cb(new Error("Cache timed out"));
      timeoutgetFlag=true;
		},threshold); //added to timeout incase get does not response in 1 second
		get.call(cache,key,function(err,data){
      if(timeoutgetFlag) return;
      clearTimeout(timeoutId); //clear timeout if successfull
      cb(err,data)
    });
	}

  var timeoutsetFlag=false;
	cache.set = function(key,data,duration,cb){ 
		duration = (duration) ? duration : cacheOpts.defaultCacheDuration;
		var timeoutId = setTimeout(function(){
      timeoutsetFlag=true;
			cb(new Error("Cache timed out"));
		},threshold); //added to timeout incase get does not response in 1 second
		set.call(cache,key,data,duration,function(err){
      if(timeoutsetFlag) return;
      clearTimeout(timeoutId);
      cb(err);
    });
	}

	//Check if is up and running
	cache.set("cacheTest","testdata",10,function(err){
		if(err) logger.warn("Error in set operation to cache "+name+" err: ",err.stack);
		else{
			cache.get("cacheTest",function(err,data){
				if(err)logger.warn("Error in get operation to cache "+name+" err: ",err.stack);
				else logger.info("Successfully connected to cache "+name);
			});
		}
	});
	
}
