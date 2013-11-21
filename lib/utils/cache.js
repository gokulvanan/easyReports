
/**
	wrapper for memcache connnection
*/

var Memcached = require("memcached");
var caches = {};
var threshold=1000;
var defaultCache = { //default empty cache definition to prevent null pointer errors
  get: function(key,cb){ cb(null,null); },
  set: function(){}
};


/*
	Configures all cache declartaions
*/
exports.init = function(conf){
	logger = opts.getLogger();
  logger.trace("initializing caches");
  var cacheConf = conf.cacheConf;
  if(cacheConf){
  	for(var type in cacheConf){
  		if(cacheConf.hasOwnProperty(type)){
  			 var cache = new Memcached(cacheConf[type].servers,cacheConf[type].opts);  
  			 cacheOpts.defaultCacheDuration= cacheOpts.defaultCacheDuration || 0;
  			 checkAndWrap(type,cache,cacheConf[type]);
  			 caches[type] = cache;
  		}
  	}
  }
  logger.trace("caches initialized");
}

exports.getCache = function(type){
	var cache = caches[type];
	return cache || defaultCache;
}

/**
	functoin verfies if memcache is up and runing and wrapps get and set methods to respond within
	a timeout threshold
*/
function checkAndWrap(name,cache,cacheOpts){
	// Wrapper for Cache to enable timeout
	var get = cache.get;
	var set = cache.set;
	cache.get = function(key,cb){
		setTimeout(function(){
			cb(new Error("Cache timed out"));
		},threshold); //added to timeout incase get does not response in 1 second
		get(key,cb);
	}

	// wrapper to set had duration as last arg as its optional;
	cache.set = function(key,data,cb,duration){ 
		duration = (duration) ? duration : cacheOpts.defaultCacheDuration;
		setTimeout(function(){
			cb(new Error("Cache timed out"));
		},threshold); //added to timeout incase get does not response in 1 second
		set(key,data,duration,cb);
	}

	//Check if is up and running
	cache.set("cacheTest","testdata",10,functiton(err){
		if(err) logger.warn("Error in set operation to cache "+name+" err: ",err.stack);
		else{
			cache.get("cacheTest",function(err,data){
				if(err)logger.warn("Error in get operation to cache "+name+" err: ",err.stack);
				else logger.info("Successfully connected to cache "+name);
			});
		}
	});
	
}