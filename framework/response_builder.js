
var mime ="text";

exports.init = function(conf){
    
}

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

	function generateError(msg){
		return {
      status:"error",
      message:msg
    }
	}
  
  function generateResponse(obj){
		return {
				status: "success",
				message: (obj.data.length === 0) ? "No Data Found" : "Data Fetched Successfully",
				table: obj.data,
        header: obj.header,
				total: obj.total,
				page: obj.page,
				rowsPerPage:obj.rowsPerPage
			};
  }
	return {

		setMime: function(key){
			mime=key;
		},
		start: function(){
			return generatePrefix();
		},
		end: function(){
			return generateSuffix()
		},
		error: function(msg){
			return generateError(msg);
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
