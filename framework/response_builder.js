
var mime ="text";


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
      		message:msg+""
    	}
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
			return msg.model;
		}else if(type === "builder"){
			return msg.sqls;
		}else if(type === "executor"){
			return msg;
		}
	} 

  	function generateResponse(obj){
		var response = {
			status: "success",
			message: (obj.data.length === 0) ? "No Data Found" : "Data Fetched Successfully",
			table: obj.data,
       		header: obj.header,
			total: obj.total,
			page: obj.page,
			rowsPerPage:obj.rowsPerPage
		};

		return JSON.stringify(response);
  }

return {

	init: function(conf){
   		console.log("Initailizing response builder");

   		console.log("Response builder initailized");
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
