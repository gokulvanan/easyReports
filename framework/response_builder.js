

module.exports= function ResponseBuilder(){
	var mime = "text";

	function getContentType(){
	  switch(mime.toLowerCase()){
	    case "json" : return "application/json ; charset=utf-8";
	    case "csv"  : return "application/CSV ; charset=utf-8";
	    case "html" : return "text/html; charset=utf-8";
	    default     : return "text/plain; charset=utf-8";
	   }
	}

	function generatePrefix(){
		return " In prefix TODO";
	}

	function generateSuffix(){
		return " In suffix TODO";
	}	

	function generateError(msg){
		return msg;
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
			return {
				status: "success",
				message: (obj.data.length === 0) ? "No Data Found" : "Data Fetched Successfully",
				data: obj.data,
				total: obj.total,
				page: obj.page,
				rowsPerPage:obj.rowsPerPage
			};
		},
    getHeader: function(){
       return {
          "Content-Type" : getContentType(),
       }
    }
 	}
 }();
