/**
* module that holds all customizable business logic 
* each function defined here can be use in the mode json being written
*
**/

module.exports = function(){
 return {
   capitalize: function(row,results,val,key,cacheMap,callback){
     //incase of error callback(err);
    return callback((val != null)? val.toUpperCase() : val);
   }
  }
}();
