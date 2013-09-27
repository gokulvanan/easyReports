






/**
* module that holds all customizable business logic 
* each function defined here can be use in the mode json being written
*
**/

module.exports = {
 
 capitalize: function(req,row,col,args){
 	return row[col].toUpperCase();
 }
}
