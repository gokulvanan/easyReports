
var mime ="text";
var logger = null;
var mode = "dev";

function getContentType(){
  switch(mime.toLowerCase()){
    case "json" : return "application/json ; charset=utf-8";
    case "csv"  : return "application/CSV ; charset=utf-8";
    case "html" : return "text/html; charset=utf-8";
    default     : return "text/plain; charset=utf-8";
   }
}


module.exports= function ResponseBuilder(){

	function generatePrefix(){
		return "";
	}

	function generateSuffix(){
		return "";
	}	

	function generateError(type,msg){
		var response ={
     	 	status:"error",
     	 	type:type,
      	message:(mode === "dev" )?msg+"":"Service Error"
    	}
    if (mode === "prod") logger.alert("Error in service "+type,msg);
   	return JSON.stringify(response);

	}
	
	function generateNofication(type,msg){
		var response ={
     	 	status:"notification",
     	 	type:type,
      	message:getNotifyMsg(type,msg)
    	}
    	return JSON.stringify(response);
	} 

	function getNotifyMsg(type,msg){
		if(type === "validator"){
			return "Request is valid and JSON model for this request exist.";
		}else if(type === "builder"){
			return msg.sqls;
		}else if(type === "executor"){
			return msg;
		}
	} 

  	function generateResponse(obj){
		var type= getContentType();
                logger.info(type);
                if (type.indexOf("CSV") != -1) {
                        var response = { status: "success", rows:obj.data, message: "Data successfully added." };
                }
                else {
			var response = {
				status: "success",
				message: (obj.data.length === 0) ? "No Data Found" : "Data Fetched Successfully",
			      	//object: obj.object,
				//table: obj.data,
			      	//header: obj.header,
				rows: obj.data,
				total: obj.total,
				//page: obj.page,
				//rowsPerPage:obj.rowsPerPage
			};
		}
		return JSON.stringify(response);
  }
 
return {

	init: function(conf){
		logger = conf.getLogger();
   		logger.debug("initailizing response builder");
      mode=conf.mode;
   		logger.debug("response builder initailized");
	},
	setMime: function(key){
		mime = (key) ? key : "text";
	},
	start: function(msg){
		return generatePrefix(msg);
	},
	end: function(){
		return generateSuffix()
	},
	error: function(type,msg){
		return generateError(type,msg);
	},
	notify: function(type,msg){
		return generateNofication(type,msg);
	},
	success: function(obj){
    	return generateResponse(obj);	
	},
  getHeader: function(){
     return {
        "Content-Type" : getContentType(),
     }
  }
 }
}();
