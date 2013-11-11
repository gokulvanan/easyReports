
/*
 *  WIP .. Lazy to do this now will try to get this done soon
*/


// BELOW IS AN EXAMPLE OF AGGERGATE query in MONGO
var app = require("../app.js");// business logic file
module.exports= function(){
	return  {
    // all get/post request params are passed in as params this can be validated for manadtory params,filtered (to modify the params before sending them query processing logic and sensible defautls could be added"
    request:{
      mandatory:["sdate","edate"], // mandatory fields expected in web request
      defaults:{ // default params used in query i.e. in absence of query params from web request
        orderBy:"daydate", 
        dir:"desc" ,
        page:0, 
        rowsPerPage:20
      }
      /*
       * filter:{
       *   sdate:function(date){ //logic to format and return date here } // sdate is pattern matched with input params
       * }
       */
    },

    query:{ 
      source:"mongo", // declare mongo data source
      aggregate: function(params){
        //TODO
        return {
          database:"dbname",
          collection:"collectionname",
          where:[],
          select:{},
          orderBy:"col"
        }
      }
        
    },
    display:{
      //TODO
      daydate :	{  key : "daydate", header :"Date"}
    }
  }
};

