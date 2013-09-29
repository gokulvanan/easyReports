/**
* module that holds all customizable business logic 
* each function defined here can be use in the mode json being written
*
**/

module.exports = {
 
 capitalize: function(row,results,val,args){
 	return (val != null)? val.toUpperCase() : val;
 }
}
