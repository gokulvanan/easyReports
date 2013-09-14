

/**
* module that holds all customizable business logic 
* each function defined here can be use in the mode json being written
*
**/

module.exports = {
  cache: function (req,row,colName,args){
    //TODO. use memcache implemenation api to fetch data from cache
    return row[colName];
  }
}
